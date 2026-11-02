'use strict';

/**
 * Parameter/setting engine.
 * Prioritas: defaults.json < data/config.json < environment variable.
 * Semua parameter (label, tipe, deskripsi, sumber nilai) diekspos ke UI
 * lewat /api/parameters sehingga halaman Parameters bisa dibangun otomatis.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { clone, getPath, readJsonSync, setPath, writeJsonAtomic, HttpError } from './util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PROJECT_ROOT = ROOT;
export const DEFAULTS = readJsonSync(path.join(ROOT, 'config/defaults.json'), {});
export const SCHEMA = readJsonSync(path.join(ROOT, 'config/schema.json'), []);
export const DATA_DIR = path.resolve(process.env.GHC_DATA_DIR || path.join(ROOT, 'data'));
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

/**
 * Root project default dihitung saat runtime, mengikuti mesin tempat app
 * di-clone. Tidak ada hardcode path Linux yang ikut ke Windows
 * (/home/user -> C:\home\user yang tidak ada).
 */
function defaultRoots() {
  const home = os.homedir();
  const candidates = [
    path.dirname(ROOT),                            // folder induk checkout: C:\xampp\htdocs\github-changer
    home,                                          // C:\Users\Administrator / /home/user
    path.join(home, 'Documents', 'GitHub'),        // GitHub Desktop
    path.join(home, 'source', 'repos'),            // Visual Studio
    path.join(home, 'projects'),
    process.platform === 'win32' ? 'C:\\xampp\\htdocs' : '/home/user',
    process.platform === 'win32' ? null : '/workspace',
  ].filter(Boolean);
  const out = [];
  for (const candidate of candidates) {
    try {
      if (!fs.statSync(candidate).isDirectory()) continue;
      const real = fs.realpathSync(candidate);
      const key = process.platform === 'win32' ? real.toLowerCase() : real;
      if (!out.some((p) => (process.platform === 'win32' ? p.toLowerCase() : p) === key)) out.push(real);
    } catch { /* path memang tidak ada di mesin ini, lewati */ }
  }
  return out.length ? out : [home];
}
DEFAULTS.workspace.roots = defaultRoots();

const ENV_MAP = new Map(SCHEMA.filter((f) => f.env).map((f) => [f.env, f]));

function parseEnvValue(field, raw) {
  if (raw === undefined || raw === '') return undefined;
  switch (field.type) {
    case 'number': {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'boolean':
      return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
    case 'paths':
      return raw.split(path.delimiter).map((s) => s.trim()).filter(Boolean);
    case 'tags':
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    default:
      return raw;
  }
}

function envSnapshot() {
  const out = {};
  for (const [envKey, field] of ENV_MAP) {
    const value = parseEnvValue(field, process.env[envKey]);
    if (value !== undefined) setPath(out, field.path, value);
  }
  return out;
}

function mergeDeep(base, patch) {
  const out = clone(base);
  const walk = (target, source) => {
    for (const [key, value] of Object.entries(source || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        walk(target[key], value);
      } else {
        target[key] = clone(value);
      }
    }
  };
  walk(out, patch);
  return out;
}

export function loadOverrides() {
  return readJsonSync(CONFIG_FILE, {});
}

export function loadConfig() {
  return mergeDeep(mergeDeep(DEFAULTS, loadOverrides()), envSnapshot());
}

/** Daftar parameter + nilai + sumber untuk halaman Parameters. */
export function parameters() {
  const cfg = loadConfig();
  const overrides = loadOverrides();
  const env = envSnapshot();
  return SCHEMA.map((field) => {
    const envValue = getPath(env, field.path);
    const overrideValue = getPath(overrides, field.path);
    const source = envValue !== undefined ? 'env' : overrideValue !== undefined ? 'file' : 'default';
    return {
      ...field,
      value: getPath(cfg, field.path),
      defaultValue: getPath(DEFAULTS, field.path),
      source,
      locked: source === 'env',
    };
  });
}

export function validateValue(field, value) {
  switch (field.type) {
    case 'number': {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new HttpError(400, `${field.label} harus berupa angka`);
      if (field.min !== undefined && n < field.min) throw new HttpError(400, `${field.label} minimal ${field.min}`);
      if (field.max !== undefined && n > field.max) throw new HttpError(400, `${field.label} maksimal ${field.max}`);
      return n;
    }
    case 'boolean':
      if (typeof value !== 'boolean' && !['true', 'false', '1', '0'].includes(String(value))) {
        throw new HttpError(400, `${field.label} harus true/false`);
      }
      return value === true || value === 'true' || value === '1';
    case 'select':
      if (!field.options.includes(value)) throw new HttpError(400, `${field.label} harus salah satu dari: ${field.options.join(', ')}`);
      return value;
    case 'paths':
    case 'tags': {
      const arr = Array.isArray(value) ? value : String(value).split(field.type === 'paths' ? /[:,\n]/ : /[,\n]/);
      return [...new Set(arr.map((v) => String(v).trim()).filter(Boolean))].slice(0, 200);
    }
    default:
      return String(value ?? '').trim();
  }
}

/** Simpan sebagian parameter. Mengembalikan config terbaru. */
export async function saveConfig(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new HttpError(400, 'Format values tidak valid');
  }
  const overrides = loadOverrides();
  for (const [key, raw] of Object.entries(values)) {
    const field = SCHEMA.find((f) => f.path === key);
    if (!field) throw new HttpError(400, `Parameter tidak dikenal: ${key}`);
    const envValue = getPath(envSnapshot(), key);
    if (envValue !== undefined) {
      throw new HttpError(409, `${field.label} dikunci oleh environment variable ${field.env}. Ubah di .env / environment server.`);
    }
    setPath(overrides, key, validateValue(field, raw));
  }
  await writeJsonAtomic(CONFIG_FILE, overrides);
  return loadConfig();
}

export async function resetConfig(keys) {
  const overrides = loadOverrides();
  const list = Array.isArray(keys) && keys.length ? keys : SCHEMA.map((f) => f.path);
  for (const key of list) {
    const parts = key.split('.');
    let cur = overrides;
    for (let i = 0; i < parts.length - 1; i += 1) cur = cur?.[parts[i]];
    if (cur) delete cur[parts.at(-1)];
  }
  await writeJsonAtomic(CONFIG_FILE, overrides);
  return loadConfig();
}

export async function ensureDataDir() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.chmod(DATA_DIR, 0o700).catch(() => {});
  const gitignore = path.join(ROOT, '.gitignore');
  if (fs.existsSync(gitignore)) {
    const content = fs.readFileSync(gitignore, 'utf8');
    if (!content.includes('data/')) await fsp.appendFile(gitignore, '\ndata/\n');
  }
}

export { ROOT };
