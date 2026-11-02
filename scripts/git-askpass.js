#!/usr/bin/env node
/**
 * GIT_ASKPASS helper.
 *
 * Git memanggil script ini dengan satu argumen berisi prompt, mis:
 *   "Username for 'https://github.com':"
 *   "Password for 'https://x-access-token@github.com':"
 *
 * Kita jawab dengan kredensial OAuth milik akun GitHub yang sedang aktif.
 * Token HANYA lewat environment variable GHC_GIT_TOKEN (tidak pernah lewat
 * argumen / URL remote), sehingga tidak bocor ke log atau `git remote -v`.
 */
'use strict';

const prompt = (process.argv[2] || '').toLowerCase();
const token = process.env.GHC_GIT_TOKEN || '';

if (/user(name)?/.test(prompt)) {
  process.stdout.write('x-access-token');
} else {
  process.stdout.write(token);
}
