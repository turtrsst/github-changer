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
- **Git** terinstal di server (dicek otomatis lewat `PATH`)
- Koneksi internet dari **server** ke `github.com` & `api.github.com` untuk login + GitHub API (operasi Git ke remote lokal/LAN tetap bisa tanpa internet)
- Satu **GitHub OAuth App** dengan *Device Flow* aktif (cukup Client ID)
- `gh` CLI opsional (hanya ditampilkan info versinya)

Tidak ada `npm install`, tidak ada build step, tidak ada dependency eksternal. **Zero dependency.**

---

## Mulai cepat

```bash
cd /path/ke/github-changer
npm run doctor          # cek Git, root project, OAuth, dll
npm start               # http://localhost:4173
```

Atau dengan environment:

```bash
cp .env.example .env
# isi GITHUB_CLIENT_ID, PORT, HOST, GHC_WORKSPACE_ROOTS ...
HOST=0.0.0.0 PORT=4173 npm start
```

> Di preview Arena app dijalankan dengan `HOST=0.0.0.0` supaya bisa diakses browser. Untuk pemakaian pribadi, defaultnya `127.0.0.1` (lebih aman).

### Cara setup OAuth GitHub (penting)

1. Buka **<https://github.com/settings/developers>** → **OAuth Apps** → **New OAuth App**.
2. Isi *Homepage URL* `http://localhost:4173`; *Authorization callback URL* boleh `http://localhost:4173` (Device Flow tidak memakainya, tapi form GitHub minta diisi).
3. Setelah dibuat, centang **Enable Device Flow**.
4. Salin **Client ID** → tempel di halaman **Parameters → Otentikasi GitHub → OAuth Client ID**, atau di layar login saat pertama kali, atau set `GITHUB_CLIENT_ID` di `.env`.
5. Klik **Masuk dengan GitHub** → buka `github.com/login/device` → masukkan kode → **Authorize**. Selesai: app menampilkan email utama GitHub kamu yang terverifikasi.

**Client secret tidak diperlukan dan jangan pernah dimasukkan ke app ini.**

Scope yang diminta: `repo read:user user:email workflow`. Token dipakai untuk GitHub API dan autentikasi push/pull HTTPS.

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
  lib/util.js         helper
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
| GET | `/api/events` | SSE: output Git live + event aktivitas |

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
| Repo tidak muncul | Cek `workspace.roots`, `scanDepth`, `workspace.exclude` → tombol **Cek path** |
| Push gagal `Permission denied` | Token butuh scope `repo`; cek `auth.allowedEmails`; login ulang |
| `Path di luar root project` | Tambahkan folder induk repo ke `workspace.roots` |
| Parameter tidak bisa diubah | Sedang dikunci environment variable (badge `env`) |

---

## Catatan

- Login **benar-benar OAuth GitHub** — tidak ada akun palsu. Tombol **"Lihat pratinjau UI"** hanya menampilkan data contoh di browser (jelas diberi banner) supaya tampilan bisa dieksplorasi sebelum punya Client ID; semua aksi nyata tetap butuh login.
- App ini tidak menggantikan `git` / `gh`; ia membungkus keduanya dengan UI, audit trail, dan manajemen akun.
- Dibuat dengan ❤️ (dan Arena AI, hehe).
