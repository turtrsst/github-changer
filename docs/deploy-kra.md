# Deploy otomatis KRA — `turtrsst/kantor-rama-ai`

Dokumen ini disusun setelah **mengecek repo publik aslinya** pada 2026-11-02.
Semua template ada di repo `github-changer`; saya **tidak mengubah repo KRA**
(karena repo itu di luar checkout sesi ini). Salin berkas yang disebut ke sana.

---

## 1. Hasil pengecekan

| Fakta | Nilai |
| --- | --- |
| Repo | `turtrsst/kantor-rama-ai` — **public**, default branch `main`, terakhir push 2026-11-02 |
| Bahasa / stack | **PHP 8.1+ (disarankan 8.2+), MySQL/MariaDB `kra_db`, Apache atau `php -S :8088`, Electron desktop** |
| Ukuran | ~46 MB, `main` = 1417 file |
| Branch | `main`, `arena/23a84f9d-kantor-rama-ai` (2599 file), `arena/cbf4b10e-kantor-rama-ai` (3912 file) |
| Domain | `https://kantor-rama-ai.my.id` (PHP) · `https://automation.kantor-rama-ai.my.id` (N100N Node :5679) |
| Lokasi sumber | `\\100.76.172.67\c$\xampp\htdocs\kantor-rama-ai\` (alamat Tailscale, Windows + XAMPP) |
| Web app | `Start KRA.bat` → `php -S 100.76.172.67:8088 -t .`, dibuka di `/web/index.html` |
| Memory vault | `C:\vault\KRA\` (di luar repo, env `KRA_MEMORY_ROOT`) |
| Konfigurasi | `api/config.json`, `.env`, `.temp/`, `node_modules/` **sudah di-`.gitignore`** ✅ |
| CI | `.github/workflows/ci.yml` **hanya ada di branch `arena/*`**, tidak ada di `main` |
| N100N | Bundle service Node + `docs/N100N_DEPLOYMENT.md` juga **hanya di branch `arena/*`** |

Kutipan penting dari `docs/N100N_DEPLOYMENT.md` (branch arena):

> *"Push source ke GitHub saja belum mengubah proses yang sedang berjalan. Di
> mesin/folder yang benar-benar menjalankan service domain tersebut …"*

## 2. Kesimpulan: rencana lama dibuang

❌ **Cloudflare Pages / Workers tidak bisa dipakai.** KRA butuh interpreter PHP,
koneksi MySQL, `KraTerminalBridge`, dan service Node persisten dengan disk
(`APP_DATA_DIR`) — Pages hanya menyajikan static/build output.

✅ **Yang benar: `git pull` di mesin yang menyajikan domain**, tepat seperti
yang sudah ditulis di docs KRA sendiri. Karena mesin itu Windows + XAMPP dan
sudah menjalankan GitHub Changer di `C:\xampp\htdocs\github-changer`, app ini
bisa jadi "eksekutor deploy"-nya.

⚠️ **Perbedaan branch wajib diperhatikan:** `main` belum punya `n100n/`,
`.github/workflows/ci.yml`, `.htaccess`, dan docs deployment. Kalau domain
`automation.kantor-rama-ai.my.id` menjalankan kode dari branch `arena/*`,
maka `automation.action=pull` harus dijalankan di checkout branch itu — bukan
`main`. Cek dulu dengan `git -C C:\xampp\htdocs\kantor-rama-ai branch --show-current`.

## 3. Arsitektur

```text
git push → GitHub (turtrsst/kantor-rama-ai)
             │
             ├─(A) GitHub Webhook langsung              ← paling sederhana
             │   atau
             └─(B) GitHub Actions: php -l + node --check (CI),
                    lalu POST webhook bertanda tangan HMAC  ← deploy hanya kalau CI hijau
             │
             ▼
   https://ghc.kantor-rama-ai.my.id/webhook/github   (Cloudflare Tunnel)
             │
             ▼
   GitHub Changer :4173 di mesin KRA  → verifikasi HMAC + filter repo/branch
             │
             ▼
   git pull  C:\xampp\htdocs\kantor-rama-ai   (+ tercatat di Alur Git from→to)
             │
             ├─ PHP built-in server :8088 → otomatis baca file baru (tanpa restart)
             └─ N100N Node :5679 → PERLU restart proses & disk persisten
```

Pilih **A atau B**, jangan dua-duanya aktif bersamaan (nanti pull dua kali).

## 4. Setup

### A. Di mesin yang menyajikan `kantor-rama-ai.my.id`

```powershell
cd /d C:\xampp\htdocs\github-changer
git pull
npm run doctor
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1   # biar server selalu nyala
powershell -ExecutionPolicy Bypass -File scripts\start-hidden.ps1
```

Pastikan folder KRA ada dan remote-nya benar:

```powershell
git -C C:\xampp\htdocs\kantor-rama-ai remote -v
git -C C:\xampp\htdocs\kantor-rama-ai branch --show-current
```

Di halaman **Automasi** (atau Parameters) isi:

| Parameter | Nilai |
| --- | --- |
| `automation.enabled` | `true` |
| `automation.intervalMinutes` | `15` (cadangan kalau webhook terlewat) |
| `automation.action` | `pull` |
| `automation.repos` | `C:\xampp\htdocs\kantor-rama-ai` |
| `automation.onlyClean` | `true` (jangan timpa perubahan lokal di server) |
| `automation.webhookEnabled` | `true` |
| `automation.webhookSecret` | string acak panjang, **sama** dengan yang di GitHub/Actions |
| `automation.webhookRepository` | `turtrsst/kantor-rama-ai` |
| `automation.webhookBranch` | `main` (atau branch arena yang dipakai domain) |
| `automation.deployCommand` | kosongkan dulu; lihat bagian restart N100N di bawah |

### B. Cloudflare Tunnel (tanpa akses login Exabytes)

Contoh config tiga hostname ada di **`config/cloudflared-kra.yml.example`**:

```yaml
- hostname: kantor-rama-ai.my.id             → http://127.0.0.1:8088
- hostname: automation.kantor-rama-ai.my.id → http://127.0.0.1:5679
- hostname: ghc.kantor-rama-ai.my.id        → http://127.0.0.1:4173
- service: http_status:404                  # fallback wajib
```

```powershell
winget install --id Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create kra
# salin config/cloudflared-kra.yml.example → %USERPROFILE%\.cloudflared\config.yml
# minta operator Cloudflare buat 3 CNAME ke <UUID>.cfargotunnel.com
powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1 -Mode named -TunnelName kra
```

Quick tunnel untuk coba cepat (URL berubah tiap restart):
`scripts\start-tunnel.ps1` → `https://xxx.trycloudflare.com/webhook/github`.

### C. Opsi A — Webhook GitHub langsung (paling sederhana)

Repo KRA → **Settings → Webhooks → Add webhook**:

- Payload URL: `https://ghc.kantor-rama-ai.my.id/webhook/github`
- Content type: `application/json`
- Secret: sama dengan `automation.webhookSecret`
- Events: **Just the push event**

### D. Opsi B — GitHub Actions (CI + deploy hanya kalau hijau)

Salin **`.github/workflows/deploy-kra.yml`** ke repo KRA. Isi di
**Settings → Secrets and variables → Actions**:

| Jenis | Nama | Nilai |
| --- | --- | --- |
| Variable | `KRA_DEPLOY_ENABLED` | `true` |
| Variable | `KRA_DEPLOY_TARGET` | `notify` (atau `ftp`) |
| Variable | `KRA_PHP_VERSION` | `8.3` |
| Secret | `KRA_DEPLOY_WEBHOOK_URL` | `https://ghc.kantor-rama-ai.my.id/webhook/github` |
| Secret | `KRA_DEPLOY_WEBHOOK_SECRET` | sama dengan `automation.webhookSecret` |
| Secret (opsional) | `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` | kalau dapat akses cPanel |

Workflow: `verify` (`php -l` semua file `api/`+`tools/`, `node --check` di
`web/ desktop/ tools/`) → `notify` mengirim payload mirip webhook `push` dengan
signature `X-Hub-Signature-256` HMAC-SHA256 → app lokal melakukan `git pull`.
Di repo `github-changer` workflow ini **tidak aktif** (guard `KRA_DEPLOY_ENABLED`).

### E. Restart service N100N

PHP built-in server membaca file dari disk tiap request → **tidak perlu restart**
untuk perubahan `.php`/`web/*`. Tetapi **N100N adalah proses Node persisten**:
perubahan `n100n/server.js`, `.env`, atau dependency butuh restart + `APP_DATA_DIR`
persisten. Lakukan lewat scheduled task / pm2 / script `Start n100n.bat` milik KRA.
Jangan menaruh rahasia di workflow JSON atau browser (sudah diperingatkan docs KRA).

## 5. Checklist keamanan (penting, repo publik!)

- 🔴 **`n100n/.env.example` mendokumentasikan password bootstrap `123456`.**
  Sebelum service dibuka ke jaringan, **wajib** isi `APP_PASSWORD`,
  `APP_SECRET`, `APP_API_TOKEN` dengan nilai acak dan ganti password dari UI.
  Commit `"Sync N100N password update for automation deployment"` ternyata hanya
  mengubah `.env.example` + docs (bukan kredensial asli) — aman, tapi jangan
  sampai file `.env` asli ikut ter-commit.
- 🔴 MySQL KRA default **`root` tanpa password**, dan ada `KraTerminalBridge` /
  `KraAuth`. **Jangan** expose `kantor-rama-ai.my.id` tanpa **Cloudflare Access**
  (Zero Trust → Access → Application) dan autentikasi aplikasi.
- 🔴 Pastikan `api/config.json`, `api/config.local.json`, `n100n/.env`, `data/`,
  `.temp/`, `node_modules/` tidak bisa diakses lewat HTTP. Branch `arena/*`
  punya `.htaccess` untuk menolak akses langsung ke folder `n100n/` —
  pertimbangkan membawanya ke `main`.
- ✅ `KRA_API_KEY` / `KRA_FLOW_API_KEY` hanya di environment server, jangan di
  browser atau workflow JSON.
- ✅ Webhook app sudah ditutup HMAC-SHA256 + filter `webhookRepository` + filter
  branch; tanpa secret semua request ditolak.
- ✅ Template FTP secara eksplisit **mengecualikan** `.env*`, `api/config.json`,
  `data/`, `.temp/`, `node_modules/`, `.git*` sebelum upload.

## 6. Cadangan: FTP kalau dapat akses cPanel Exabytes

Set `KRA_DEPLOY_TARGET=ftp` + secrets FTP, dan variable
`KRA_REMOTE_DIR=/public_html/`. Workflow meng-upload source (tanpa rahasia).
Ingat: FTP **tidak** menjalankan migrasi DB, tidak menyalakan service Node, dan
tidak mengisi `C:\vault\KRA` — tetap perlu setup manual di hosting.

## 7. Troubleshooting

| Gejala | Periksa |
| --- | --- |
| Webhook 401 | Secret di GitHub/Actions beda dengan `automation.webhookSecret` |
| Webhook 200 tapi `matched: 0` | Remote URL repo lokal tidak mengandung `turtrsst/kantor-rama-ai`; isi `automation.repos` sebagai fallback |
| Webhook 200 `skipped` | `automation.webhookRepository` / `webhookBranch` tidak cocok dengan payload |
| Pull dilewati terus | `automation.onlyClean=true` dan ada perubahan lokal di server → commit/stash dulu |
| Domain masih versi lama | Cek **branch** checkout di server (`main` vs `arena/*`), dan restart N100N |
| `502` dari Tunnel | `Start KRA.bat` (:8088) / GitHub Changer (:4173) / N100N (:5679) tidak jalan |

---

**Belum saya lakukan (butuh keputusan kamu):** menyalin template ke repo KRA dan
mengisi secrets/variables, karena repo itu di luar checkout sesi ini. Kasih tahu
kalau mau saya bantu lewat PR/branch di repo KRA — dan konfirmasi dulu **branch
mana yang benar-benar dipakai `kantor-rama-ai.my.id`** (`main` atau `arena/*`).
