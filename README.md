# ✦ GitHub Changer

> Dashboard **lokal** buat maintain akun & repository GitHub: `push`, `pull`, `fetch`, `clone`, `commit`, bikin repo, arsipkan repo — plus **peta alur Git** yang nyatet setiap operasi: *dari mana*, *ke mana*, branch, remote URL, SHA, akun email, dan hasilnya.

Dibuat buat dipasang di komputer/server kamu sendiri: path project **menyesuaikan folder yang ada di mesin itu**, dan Git yang dipakai ya Git yang **sudah terinstal** di mesin itu (auto-detect, bisa di-override). Login memakai **OAuth GitHub asli** (Device Flow), dikenali per **email GitHub**; arsitekturnya sudah **multi-akun** sejak awal. Ada juga panel **Parameters** lengkap dan sentuhan **Arena AI** ✨ (hehe).

---

## Kenapa app ini

| Masalah | Cara app ini menyelesaikan |
| --- | --- |
| Capek `cd` sana-sini buat cek repo | Semua repo dipindai dari **root project** yang kamu tentukan, statusnya (branch, ahead/behind, dirty, remote, commit terakhir) tampil dalam satu tabel |
| "Tadi push-nya ke mana ya?" | Tiap operasi nyimpan `from` → `to` lengkap: URL remote push/fetch, nama remote, branch, SHA, durasi, akun. Ada agregasi **"Push ke mana saja"** & **"Pull dari mana saja"** |
| Token GitHub ditaruh di URL remote | Token OAuth dikirim lewat **`GIT_ASKPASS`** (environment), tidak pernah masuk URL/argumen/log. Commit otomatis pakai **nama + email akun aktif** |
| Login ribet kalau app jalan lokal | **OAuth Device Flow**: cuma butuh Client ID, **tanpa client secret & tanpa callback URL**. Kamu approve pakai kode 8 karakter di `github.com/login/device` |
| Pengaturan tersebar | Satu halaman **Parameters** (28 parameter) dengan label, penjelasan, tipe, dan sumber nilai (`default` / `custom` / `env`) |

---

## Kebutuhan

- **Node.js ≥ 18** (disarankan 20/22)
- **Git ≥ 2.31** terinstal di server (auto-detect lintas-platform: `where.exe` di Windows, `which` + `PATH`/`PATHEXT` di Linux/macOS)
- Koneksi internet dari **server** ke `github.com` & `api.github.com` untuk login + GitHub API (operasi Git ke remote lokal/LAN tetap bisa tanpa internet)
- Satu **GitHub OAuth App** dengan *Device Flow* aktif (cukup Client ID)
- `gh` CLI opsional (hanya ditampilkan info versinya)

Tidak ada `npm install`, tidak ada build step, tidak ada dependency eksternal. **Zero dependency.**

---

## 1. Clone kode ke lokal dulu

Kode ada di branch **`arena/a2271201-github-changer`** — branch `main` masih berisi commit awal (README doang). Jadi clone dengan `-b`:

**Linux / macOS** (clone dari folder induknya):

```bash
git clone --branch arena/a2271201-github-changer https://github.com/turtrsst/github-changer.git
cd github-changer
npm run doctor
npm start
```

**Windows / XAMPP — path yang benar: `C:\xampp\htdocs\github-changer\`**

```bat
cd /d C:\xampp\htdocs
git clone --branch arena/a2271201-github-changer https://github.com/turtrsst/github-changer.git github-changer
cd github-changer
npm run doctor
npm start
```

> ⚠️ **Jangan** `cd C:\xampp\htdocs\github-changer` dulu lalu `git clone …` — itu yang bikin hasilnya bersarang jadi `C:\xampp\htdocs\github-changer\github-changer`. Clone dilakukan **dari folder induk** (`C:\xampp\htdocs`), dengan nama folder tujuan `github-changer`. Kalau folder tujuan sudah ada dan kosong, alternatif: `cd C:\xampp\htdocs\github-changer` lalu `git clone --branch arena/a2271201-github-changer https://github.com/turtrsst/github-changer.git .`

**Kalau terlanjur bersarang** (`…\github-changer\github-changer`), **WAJIB matikan dulu proses lama** sebelum memindahkan/menghapus folder. Sisa `npm start` masih menahan CWD-nya (Windows mengunci folder) dan port 4173; kalau dipaksa `rmdir /S /Q`, sebagian file bisa terhapus tapi folder nested-nya tertinggal sehingga `git clone` ditolak ("destination already exists").

```powershell
# 0. Matikan proses lama (pilih salah satu)
Ctrl+C di terminal 'npm start' yang masih terbuka
# atau:
Get-NetTCPConnection -LocalPort 4173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
# atau paksa semua node (hati-hati kalau ada app Node lain):
taskkill /F /IM node.exe
```

Setelah benar-benar mati, pilih salah satu:

```powershell
# Opsi A — pindahkan isinya naik satu level (menjaga .env / data yang sudah ada)
cd C:\xampp\htdocs\github-changer
Get-ChildItem -Force .\github-changer | Move-Item -Destination . -Force
Remove-Item .\github-changer -Recurse -Force
git pull
npm run doctor
```

```bat
:: Opsi B — clone ulang bersih (backup dulu .env / data kalau sudah ada)
cd /d C:\xampp\htdocs
rmdir /S /Q github-changer
git clone --branch arena/a2271201-github-changer https://github.com/turtrsst/github-changer.git github-changer
cd github-changer
npm run doctor
```

**Recovery kalau folder sudah kehapus sebagian** (gejala: `Could not read package.json`, `destination path already exists and is not an empty directory`):

```powershell
# 1. pastikan tidak ada node yang masih jalan
Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
taskkill /F /IM node.exe 2>$null

# 2. hapus TOTAL folder yang rusak dari induknya
cd C:\xampp\htdocs
Remove-Item -Recurse -Force .\github-changer

# 3. clone ulang ke path yang benar
git clone --branch arena/a2271201-github-changer https://github.com/turtrsst/github-changer.git github-changer
cd github-changer
git log --oneline -1        # harusnya 333b7e8 / commit terbaru
npm run doctor
npm start
```

`npm run doctor` dan dashboard sekarang **mendeteksi folder bersarang otomatis** dan kasih peringatan beserta path tujuan yang benar. Kalau port 4173 masih dipakai, `npm start` tidak lagi crash dengan stack trace — app menampilkan pesan + perintah untuk mematikan proses atau ganti `PORT`.

Kalau terlanjur `git clone` biasa (tanpa `-b`): `git fetch origin && git checkout arena/a2271201-github-changer`.

Di lingkungan preview, clone lokal juga sudah dibuat di **`/home/user/projects/github-changer`** (origin tetap `https://github.com/turtrsst/github-changer.git`), jadi app langsung menampilkan 2 repo: checkout kerja + hasil clone.

> Di dalam app, setelah login muncul kartu **"Langkah 1 · Clone repo ke lokal dulu"**: URL diisi otomatis dari `origin` project ini, folder tujuan bisa dipilih dari struktur folder server, nama folder anti-bentrok (`-2`, `-3`, …), dan setelah clone selesai drawer repo langsung terbuka. Tombolnya juga ada di halaman Repository saat daftar masih kosong.

## 2. Mulai cepat (ringkas)

```bash
cd /path/ke/github-changer
npm run doctor
npm start
```

Atau dengan environment:

```bash
cp .env.example .env
# isi GITHUB_CLIENT_ID, PORT, HOST, GHC_WORKSPACE_ROOTS ...
HOST=0.0.0.0 PORT=4173 npm start
```

> Di preview Arena app dijalankan dengan `HOST=0.0.0.0` supaya bisa diakses browser. Untuk pemakaian pribadi, defaultnya `127.0.0.1` (lebih aman).

## 3. Catatan Windows / XAMPP

Target pemasangan: **`C:\xampp\htdocs\github-changer\`** (bukan `…\github-changer\github-changer`), Node v26, Windows 10. Beberapa hal yang perlu diperhatikan:

- **App ini server Node.js sendiri, bukan PHP/Apache.** XAMPP/Apache **tidak** menjalankan kode ini. Jalankan `npm start`, lalu buka **<http://localhost:4173>** — bukan `http://localhost/github-changer/...`. Kalau memang ingin lewat Apache, aktifkan `mod_proxy` dan reverse-proxy ke `http://127.0.0.1:4173`.
- **Jangan tambahkan `# komentar` setelah perintah di `cmd`** (itu bukan komentar di cmd, diteruskan sebagai argumen). Cukup ketik `npm start`. Di PowerShell `#` baru berfungsi sebagai komentar.
- **Deteksi Git sekarang lintas-platform**: `where.exe` → scan `PATH` + `PATHEXT` → lokasi umum Git for Windows (`C:\Program Files\Git\cmd\git.exe`, `AppData\Local\Programs\Git`, Chocolatey, Scoop). Karena `git clone` kamu berhasil, Git pasti ada; setelah update ini `npm run doctor` akan menampilkan path lengkapnya. Kalau Node dijalankan sebagai service/Apache dengan PATH berbeda, isi:
  ```bat
  copy .env.example .env
  notepad .env
  ```
  lalu set `GHC_GIT_BINARY=C:\Program Files\Git\cmd\git.exe` (atau ubah parameter `git.binary` di halaman Parameters).
- **Root project dihitung saat runtime**, jadi tidak ada lagi `/home/user` yang jadi `C:\home\user`. Dengan app di `C:\xampp\htdocs\github-changer`, yang dipakai otomatis: folder induk checkout (`C:\xampp\htdocs`), home (`C:\Users\Administrator`), `Documents\GitHub`, `source\repos`, `projects` — hanya yang benar-benar ada. App akan menemukan repo-nya sendiri di `C:\xampp\htdocs\github-changer`. Mau eksplisit? Set di `.env`:
  ```bat
  GHC_WORKSPACE_ROOTS=C:\xampp\htdocs\github-changer;C:\xampp\htdocs
  ```
  (beberapa root dipisah `;` di Windows; bisa juga lewat halaman Parameters → `workspace.roots`).
- **Autentikasi push/pull di Windows**: shebang `#!/usr/bin/env node` tidak bisa dieksekusi langsung, jadi app membuat `data/git-askpass.cmd` (wrapper ke `node.exe`) dan memakai `http.https://github.com/.extraHeader` lewat environment (token tidak pernah masuk argumen/URL). Butuh **Git ≥ 2.31** untuk `GIT_CONFIG_COUNT` — cek dengan `git --version`. Untuk GitHub Enterprise, ubah parameter `git.authHost` / `GHC_GIT_HOST`; token tidak akan dikirim ke host lain.
- **OAuth Client ID** tetap wajib: isi di `.env` (`GITHUB_CLIENT_ID=Iv1.…`) atau di layar login / halaman Parameters.

### Cara setup OAuth GitHub (penting)

1. Buka **<https://github.com/settings/developers>** → **OAuth Apps** → **New OAuth App**.
2. Isi *Homepage URL* `http://localhost:4173`; *Authorization callback URL* boleh `http://localhost:4173` (Device Flow tidak memakainya, tapi form GitHub minta diisi).
3. Setelah dibuat, centang **Enable Device Flow**.
4. Salin **Client ID** → tempel di halaman **Parameters → Otentikasi GitHub → OAuth Client ID**, atau di layar login saat pertama kali, atau set `GITHUB_CLIENT_ID` di `.env`.
5. Klik **Masuk dengan GitHub** → buka `github.com/login/device` → masukkan kode → **Authorize**. Selesai: app menampilkan email utama GitHub kamu yang terverifikasi.

**Client secret tidak diperlukan dan jangan pernah dimasukkan ke app ini.**

Scope yang diminta: `repo read:user user:email workflow`. Token dipakai untuk GitHub API dan autentikasi push/pull HTTPS.

---

## 4. Haruskah PowerShell nyala terus?

**Yang harus hidup itu proses `node server/index.js`, bukan jendela terminalnya.** Kalau kamu menutup jendela `npm start`, server ikut mati (dan besoknya `EADDRINUSE` hilang, tapi dashboard juga tidak bisa dibuka). Pilih salah satu:

| Cara | Perintah | Catatan |
| --- | --- | --- |
| Terminal dibuka (paling sederhana) | `npm start` | Jendela harus tetap terbuka. `Ctrl+C` untuk berhenti |
| **Background (direkomendasikan)** | `powershell -ExecutionPolicy Bypass -File scripts\start-hidden.ps1` | Node jalan tersembunyi, log di `data\server.log`, PID di `data\server.pid`. Jendela boleh ditutup |
| Hentikan background | `powershell -ExecutionPolicy Bypass -File scripts\stop.ps1` | Menghentikan PID + siapa pun yang memegang port 4173 |
| **Otomatis tiap login Windows** | `powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1` | Task Scheduler `GitHub Changer`, auto-restart 3×. Mungkin perlu PowerShell sebagai Administrator |
| Cek / hapus autostart | `Get-ScheduledTask -TaskName 'GitHub Changer'` / `Unregister-ScheduledTask -TaskName 'GitHub Changer' -Confirm:$false` | |
| Alternatif lain | `nssm install GitHubChanger "C:\Program Files\nodejs\node.exe" server/index.js` atau `pm2 start server/index.js --name ghc` | Kalau sudah biasa pakai Windows Service / pm2 |
| Supaya webhook bisa masuk dari internet | `powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1` | Cloudflare Tunnel tanpa port-forwarding; dapat URL publik `https://xxx.trycloudflare.com` |

> Catatan: XAMPP/Apache **tidak** menjalankan app ini. Mau diakses lewat Apache? Aktifkan `mod_proxy` dan reverse-proxy ke `http://127.0.0.1:4173`. Kalau server mati, **scheduler & webhook automasi juga berhenti** — jadi pakai background/autostart kalau mau automasi jalan terus.

## 5. Automasi (termasuk proyek di hosting my.id)

Bisa. Ada **dua jalur**, dan keduanya sudah ada di app (halaman **Automasi**):

**A. Scheduler terjadwal** — parameter `automation.*`:

| Parameter | Fungsi |
| --- | --- |
| `automation.enabled` | Nyalakan scheduler |
| `automation.intervalMinutes` | Jeda run (default 15 menit) |
| `automation.action` | `fetch` / `pull` / `push` (default `pull`, paling aman) |
| `automation.branch` | Pengaman: repo yang checkout-nya beda branch dilewati. Untuk KRA: `arena/cbf4b10e-kantor-rama-ai` |
| `automation.repos` | Path repo yang diautomasi, satu per baris. **Kosong = semua**. Isi path repo KRA kalau mau batasi hanya KRA |
| `automation.onlyClean` | Lewati repo yang punya perubahan lokal (anti konflik) |
| `automation.accountId` | Akun GitHub yang dipakai (kosong = akun pertama) |

Tiap run tercatat di **Alur Git** dengan penanda `trigger: schedule|manual|webhook`, lengkap dengan `from → to`. Tombol **Jalankan sekarang** ada di halaman Automasi.

**B. Webhook GitHub** — `automation.webhookEnabled` + `automation.webhookSecret`:

1. Isi secret (sama persis) di parameter dan di GitHub → **Settings → Webhooks → Add webhook**.
2. URL: `http://<alamat-publik-app>/webhook/github`, Content type `application/json`, event **Just the push event**.
3. Signature diverifikasi **HMAC-SHA256** (`X-Hub-Signature-256`); event `ping` dibalas `pong`; `automation.webhookRepository` membatasi repo (mis. `turtrsst/kra`), `automation.webhookBranch` membatasi branch.
4. Repo lokal yang cocok (dicocokkan dari URL remote / `full_name`) langsung di-`pull`, lalu opsional `automation.deployCommand` (mis. `npm run build`) dijalankan **tanpa shell** (tidak ada `&&`, `|`, `;`).
5. ⚠️ GitHub harus bisa menjangkau URL itu. `http://127.0.0.1:4173` **tidak bisa** dipanggil dari internet → pakai **Cloudflare Tunnel**: `powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1` lalu pakai `https://xxxx.trycloudflare.com/webhook/github` sebagai Payload URL. Lihat `docs/deploy-kra.md`.

### Proyek KRA — `turtrsst/kantor-rama-ai` (sudah dicek)

Repo aslinya **PHP 8.1+ / MySQL / Electron**, domain `kantor-rama-ai.my.id` +
`automation.kantor-rama-ai.my.id` (service Node N100N :5679), sumber di
`\\100.76.172.67\c$\xampp\htdocs\kantor-rama-ai\`. Karena **bukan static**,
**Cloudflare Pages tidak bisa dipakai**. Yang benar: push → webhook bertanda
tangan (lewat **Cloudflare Tunnel**) → app ini jalankan `git pull` **di mesin
yang menyajikan domain**. PHP langsung baca file baru; N100N perlu restart.

| Berkas | Isi |
| --- | --- |
| `docs/deploy-kra.md` | Hasil pengecekan repo, arsitektur, setup, checklist keamanan (default password `123456`, MySQL root tanpa password, terminal bridge), troubleshooting |
| `.github/workflows/deploy-kra.yml` | Template untuk repo KRA: CI `php -l` + `node --check` → POST webhook HMAC setelah CI hijau; cadangan FTP |
| `config/cloudflared-kra.yml.example` | Tunnel 3 hostname: KRA :8088, N100N :5679, webhook app :4173 |

**Branch terkonfirmasi: `arena/cbf4b10e-kantor-rama-ai`** (yang dipakai domain;
`main` tidak di-deploy). Nilai konkret: `automation.repos=C:\xampp\htdocs\kantor-rama-ai`,
`automation.branch=arena/cbf4b10e-kantor-rama-ai`,
`automation.webhookRepository=turtrsst/kantor-rama-ai`,
`automation.webhookBranch=arena/cbf4b10e-kantor-rama-ai`.
`automation.branch` adalah **pengaman**: repo yang checkout-nya beda branch akan
dilewati (dan alasannya dicatat), jadi tidak pernah salah tarik `main`.
Workflow template hanya trigger di branch itu dan tidak aktif di repo ini
(guard `vars.KRA_DEPLOY_ENABLED`). Saya **tidak mengubah repo KRA**; template
tinggal disalin ke sana.

---

## Fitur

### 🏠 Dashboard
Statistik repo lokal / repo GitHub / push / pull, **alur Git terbaru** dengan visual `dari → ke`, agregasi tujuan push & sumber pull, kartu lingkungan server (path & versi Git, `gh`, root project), aksi cepat, dan kartu konteks **Arena AI** yang bisa disalin untuk dipakai sebagai prompt.

### 📁 Repository lokal
- Pindai root project (kedalaman & pengecualian folder bisa diatur)
- Status: branch, upstream, ahead/behind, jumlah file berubah, commit terakhir, URL push/fetch
- Aksi cepat: **Fetch**, **Pull**, **Push**
- Drawer detail: riwayat commit, daftar branch + checkout, daftar remote, dan form lengkap
  - Push: pilih remote, branch lokal, branch tujuan, `-u`, `--force-with-lease`
  - Pull: strategi `ff-only` / `rebase` / `merge` (dari parameter)
  - Commit: `git add -A` + commit atas nama **email GitHub aktif**
  - Branch baru (opsi prefix `arena/`), checkout, tambah/ubah remote
  - **Terminal live** (SSE) untuk output perintah Git
- **Clone** & **Init** repo baru langsung ke root project

### 🐙 GitHub Remote
Daftar repo milik akun aktif via GitHub API (public/private/arsip, bahasa, default branch, rate limit), **buat repository baru**, **arsipkan / buka arsip**, dan **clone** satu klik ke folder lokal.

### 🔀 Alur Git (audit trail)
Riwayat semua operasi dengan filter aksi / akun / repo. Kolom **Dari**, **Ke**, **Akun**, **Status**, durasi; detail per entri berisi perintah Git + output mentah. Ringkasan bisa disalin. Semua tersimpan di `data/activity.jsonl`.

### ⚡ Automasi
Scheduler `fetch`/`pull`/`push` berkala per repo (bisa dibatasi hanya proyek tertentu), tombol **Jalankan sekarang**, webhook GitHub dengan verifikasi HMAC-SHA256 + branch filter + perintah deploy tanpa shell, dan riwayat run. Semua run masuk audit Alur Git.

### ⚙️ Parameters
28 parameter dikelompokkan: **Server**, **Workspace & Git**, **Otentikasi GitHub**, **Arena AI**, **Tampilan**, **Aktivitas**. Tiap parameter punya deskripsi, tipe input yang sesuai, badge sumber nilai, dan tombol reset. Prioritas nilai:

```
config/defaults.json  <  data/config.json  <  environment variable
```

Yang dikunci `env` tidak bisa diubah dari UI (ditandai jelas). Tema (dark/light) & 4 aksen warna juga dari sini.

### 👥 Multi-akun
Klik avatar → **Tambah akun GitHub** → Device Flow lagi → akun masuk ke daftar → **ganti akun** kapan saja. Setiap operasi Git memakai token akun yang sedang aktif dan identitasnya tercatat di log. Parameter `auth.allowedEmails` bisa dipakai untuk **membatasi login hanya untuk email tertentu** (kosong = bebas / multi-akun).

### 🤖 Arena AI
Panel konteks berisi project, path, branch, upstream, URL push/fetch, HEAD, ahead/behind, jumlah perubahan, dan akun aktif — tinggal **Salin konteks** untuk ditempel ke Arena AI. Ada template pesan commit (`{session}`, `{repo}`, `{branch}`, `{date}`) dan prefix branch `arena/`. Semua bisa dimatikan/diubah di Parameters.

---

## Parameter penting

| Parameter | Default | Fungsi |
| --- | --- | --- |
| `workspace.roots` | `$HOME` | Folder yang dipindai; **sesuaikan dengan path project di server** |
| `workspace.scanDepth` | `3` | Kedalaman pemindaian folder `.git` |
| `git.binary` | `git` | Path executable Git (auto-detect lewat `PATH`) |
| `git.defaultRemote` / `git.defaultBranch` | `origin` / `main` | Default aksi Git |
| `git.pullStrategy` | `ff-only` | `ff-only` / `rebase` / `merge` |
| `git.authorFromAccount` | `true` | Commit pakai nama + email GitHub aktif |
| `auth.clientId` | kosong | **Wajib** untuk login OAuth |
| `auth.allowedEmails` | `[]` | Whitelist email GitHub yang boleh login |
| `auth.sessionDays` | `7` | Masa berlaku sesi |
| `arena.*` | — | Label sesi, prefix branch, template commit, catatan konteks |
| `activity.retention` | `1000` | Maksimal entri riwayat |

Environment: `HOST`, `PORT`, `GITHUB_CLIENT_ID`, `APP_SECRET`, `APP_PIN`, `GHC_GIT_BINARY`, `GHC_WORKSPACE_ROOTS`, `GHC_DATA_DIR`.

---

## Keamanan

- Token GitHub **terenkripsi AES-256-GCM** di `data/accounts.json`; kuncinya di `data/secret.key` (mode `0600`) atau `APP_SECRET`.
- Sesi disimpan sebagai **hash** token di `data/sessions.json`, dikirim lewat header `Authorization: Bearer` (bekerja juga di iframe/preview) + cookie `HttpOnly; SameSite=Lax`.
- **Path repo divalidasi**: `realpath` harus berada di dalam salah satu `workspace.roots` (anti path traversal & symlink escape). Nama remote/branch/URL divalidasi ketat.
- Semua perintah Git lewat `spawn(argv)` **tanpa shell**; token lewat environment `GHC_GIT_TOKEN` yang dibaca `scripts/git-askpass.js`, tidak pernah muncul di `git remote -v`, argumen, atau log.
- `data/` sudah ada di `.gitignore`: **tidak ada token/config/log yang masuk Git**.
- Opsional `APP_PIN` untuk PIN tambahan, dan `server.host=127.0.0.1` untuk akses lokal saja. Kalau bind `0.0.0.0`, pakai `APP_PIN` / firewall / reverse proxy.
- Webhook `/webhook/github` **tidak memakai sesi browser** tapi wajib `automation.webhookSecret` + signature HMAC-SHA256; tanpa secret semua request ditolak. `automation.deployCommand` dieksekusi tanpa shell (tokenisasi spasi, tidak ada `&&`/`|`/`;`) dan default kosong — aktifkan hanya kalau kamu paham perintahnya.

---

## Struktur

```
server/
  index.js            HTTP server + static + SSE
  api.js              router REST API
  lib/config.js       parameter engine (defaults < file < env)
  lib/store.js        akun terenkripsi, sesi, activity.jsonl
  lib/auth.js         sesi + state machine Device Flow
  lib/github.js       OAuth Device Flow + GitHub REST API
  lib/git.js          eksekutor Git aman + metadata from/to
  lib/automation.js   scheduler, webhook HMAC, deploy command
  lib/util.js         helper
scripts/start-hidden.ps1, stop.ps1, install-autostart.ps1, start-tunnel.ps1  # background/autostart/tunnel Windows
.github/workflows/deploy-kra.yml  # TEMPLATE CI PHP + webhook deploy / FTP untuk repo KRA
docs/deploy-kra.md               # hasil pengecekan KRA + panduan deploy PHP/MySQL via Cloudflare Tunnel
config/cloudflared-kra.yml.example  # contoh tunnel 3 hostname KRA/N100N/GitHub Changer
public/               index.html, styles.css, app.js (vanilla, tanpa build)
scripts/
  git-askpass.js      kredensial untuk push/pull HTTPS
  doctor.js           npm run doctor
  smoke-test.js       npm test (offline, end-to-end)
config/               defaults.json + schema.json (sumber halaman Parameters)
data/                 runtime SAJA (di-gitignore): config, akun, sesi, log
```

---

## Referensi API (ringkas)

Semua endpoint di bawah `/api`, respons `{ ok: true, ... }`; error `{ ok: false, error }`. Mutasi butuh header `Authorization: Bearer <session>` (kecuali endpoint setup/login).

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/bootstrap` | Status app, config, akun, lingkungan Git |
| GET/PUT | `/api/parameters`, `/api/config` | Baca / ubah parameter |
| POST | `/api/config/reset` | Reset parameter |
| GET | `/api/environment`, POST `/api/environment/probe` | Info & validasi path |
| POST | `/api/auth/device/start` `/poll` `/cancel` | Login OAuth GitHub |
| POST | `/api/auth/pat` | Login darurat dengan PAT (jika diizinkan) |
| POST | `/api/auth/logout`, `/api/auth/switch` | Sesi & ganti akun |
| GET/DELETE | `/api/accounts`, `/api/accounts/:id` | Daftar & hapus akun |
| GET | `/api/repos`, `/api/repos/detail?path=` | Pindai & detail repo lokal |
| POST | `/api/git` | `{ action, params }` → jalankan Git + catat aktivitas |
| GET/DELETE | `/api/activity` | Riwayat + statistik from/to |
| GET/POST | `/api/github/repos` | Daftar & buat repo GitHub |
| PATCH | `/api/github/repos/:owner/:repo` | Arsipkan / ubah repo |
| GET | `/api/arena/context` | Konteks siap salin untuk Arena AI |
| GET/POST | `/api/automation`, `/api/automation/run`, `/api/automation/toggle` | Status scheduler, jalankan manual, aktif/nonaktif |
| POST | `/webhook/github` | Webhook GitHub (HMAC-SHA256, event `push` / `ping`) |
| GET | `/api/events` | SSE: output Git live + event aktivitas / automasi / webhook |

Aksi `/api/git`: `status`, `fetch`, `pull`, `push`, `commit`, `checkout`, `branch`, `remote`, `clone`, `init`.

---

## Tes & troubleshooting

```bash
npm run check    # syntax check semua file
npm test         # tes end-to-end offline (bare repo lokal, tanpa internet)
npm run doctor   # laporan lingkungan
```

`npm test` membuat repo Git temporer + remote bare di `/tmp`, menjalankan server di port acak, lalu menguji push/pull/commit/parameter/validasi path/riwayat — **tidak menyentuh akun GitHub asli**.

| Gejala | Solusi |
| --- | --- |
| Tombol login nonaktif | Client ID belum diisi (Parameters atau `.env`) |
| `Client ID tidak dikenal GitHub` | Pastikan OAuth App benar & **Enable Device Flow** dicentang |
| `Tidak bisa menghubungi GitHub` | Server butuh akses ke `github.com` / `api.github.com` |
| Windows: `Git tidak ditemukan` | Update ke versi terbaru (deteksi `where.exe`), atau set `GHC_GIT_BINARY` / `git.binary` ke path absolut `git.exe` |
| Windows: root `C:\home\user` tidak ada | Sudah diperbaiki: root default dihitung runtime. Cek `/api/bootstrap` → `environment.roots` |
| Windows: buka lewat Apache/XAMPP | App jalan di Node port 4173; buka `http://localhost:4173` atau pasang reverse proxy Apache |
| Windows: hasil clone bersarang `github-changer\github-changer` | `doctor` & dashboard kasih peringatan. Pindahkan isinya ke `C:\xampp\htdocs\github-changer` (PowerShell `Get-ChildItem -Force … \| Move-Item …`) atau clone ulang dari `C:\xampp\htdocs` |
| Windows: push minta password | Pastikan Git ≥ 2.31 (`GIT_CONFIG_COUNT`) dan `git.authHost` = `github.com` |
| `EADDRINUSE 127.0.0.1:4173` | Masih ada `npm start` lama. `Ctrl+C` di terminalnya, atau `Get-NetTCPConnection -LocalPort 4173 \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`, atau `set PORT=4174 && npm start` |
| `used by another process` saat `Remove-Item` / `rmdir` | Proses node lama mengunci CWD-nya. Matikan dulu (lihat baris atas), **baru** hapus folder. Jangan paksa `rmdir /S /Q` sebelum itu |
| `Could not read package.json` / clone ditolak "not empty" | Folder terhapus sebagian. Pakai blok **Recovery** di section Windows/XAMPP |
| Automasi tidak jalan | Proses server mati (pakai `scripts\start-hidden.ps1` / autostart), `automation.enabled` masih `false`, atau belum ada akun GitHub login |
| Webhook `Signature tidak valid` | `automation.webhookSecret` beda dengan secret di GitHub, atau `webhookEnabled` mati. Kirim ulang event `ping` untuk cek |
| Run automasi `skipped` karena beda branch | Checkout server balik ke `arena/cbf4b10e-kantor-rama-ai`; ini memang fungsi `automation.branch` |
| Repo tidak muncul | Cek `workspace.roots`, `scanDepth`, `workspace.exclude` → tombol **Cek path** |
| Push gagal `Permission denied` | Token butuh scope `repo`; cek `auth.allowedEmails`; login ulang |
| `Path di luar root project` | Tambahkan folder induk repo ke `workspace.roots` |
| Parameter tidak bisa diubah | Sedang dikunci environment variable (badge `env`) |

---

## Catatan

- Login **benar-benar OAuth GitHub** — tidak ada akun palsu. Tombol **"Lihat pratinjau UI"** hanya menampilkan data contoh di browser (jelas diberi banner) supaya tampilan bisa dieksplorasi sebelum punya Client ID; semua aksi nyata tetap butuh login.
- App ini tidak menggantikan `git` / `gh`; ia membungkus keduanya dengan UI, audit trail, dan manajemen akun.
- Dibuat dengan ❤️ (dan Arena AI, hehe).
