# Deploy otomatis proyek KRA — Exabytes + Cloudflare

Kondisi: domain/hosting dibeli di **Exabytes**, **tidak ada akses login ke hosting/cPanel**,
tapi pengaturan DNS/proxy dibantu lewat **Cloudflare**. Artinya kita **tidak boleh**
bergantung pada `git pull` di server hosting atau kredensial FTP yang tidak dimiliki.

> ✅ Jalur yang dipilih: **GitHub Actions → Cloudflare Pages / Tunnel**.
> Yang dibutuhkan cuma akses ke akun Cloudflare + repo GitHub KRA.

---

## Opsi A (UTAMA): Cloudflare Pages, tanpa login hosting

Cloudflare yang men-deploy, Exabytes tinggal jadi origin/domain. Ini paling cocok
kalau KRA berupa situs statis / HTML / JS / PHP-statik yang bisa di-build.

1. Salin `.github/workflows/deploy-kra.yml` dari repo ini ke repo **KRA**.
2. Di Cloudflare dashboard (orang yang bantu setting Cloudflare bisa lakukan):
   - **Workers & Pages → Create → Pages → Direct Upload** → buat project, mis. `kra`.
   - **My Profile → API Tokens → Create Token** → template *Edit Cloudflare Workers* /
     atau custom: `Account · Cloudflare Pages · Edit`. Catat **Account ID** (kanan bawah
     pada halaman domain/account).
   - Kalau mau pakai domain `my.id`: **Pages → project kra → Custom domains → Set up
     a custom domain**, ikuti instruksi CNAME yang diberikan Cloudflare.
3. Di repo KRA → **Settings → Secrets and variables → Actions**:

   | Jenis | Nama | Nilai |
   | --- | --- | --- |
   | Variable | `KRA_DEPLOY_ENABLED` | `true` |
   | Variable | `KRA_DEPLOY_TARGET` | `cloudflare` |
   | Variable | `KRA_CF_PROJECT` | `kra` (nama project Pages) |
   | Variable | `KRA_CF_BRANCH` | `main` |
   | Variable | `KRA_BUILD_DIR` | `./dist` (atau `.` kalau tanpa build) |
   | Secret | `CLOUDFLARE_API_TOKEN` | token dari langkah 2 |
   | Secret | `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare |

4. Push ke branch `main` → tab **Actions** → workflow **Deploy KRA** jalan otomatis.
   Tidak ada terminal/PC yang harus nyala. 🎉

> ⚠️ Kalau KRA butuh **PHP + MySQL server-side** (mis. Laravel/CodeIgniter dengan
> database di Exabytes), Cloudflare Pages **tidak bisa** menjalankannya. Pakai Opsi B
> atau minta operator hosting/Cloudflare buatkan kredensial FTP/SSH dulu.

## Opsi B: FTP/FTPS (kalau akhirnya dapat akun FTP cPanel Exabytes)

Workflow yang sama, ubah variable `KRA_DEPLOY_TARGET=ftp` dan tambahkan secrets:

| Secret | Nilai |
| --- | --- |
| `FTP_SERVER` | `ftp.domain.my.id` atau IP server |
| `FTP_USERNAME` | user FTP cPanel |
| `FTP_PASSWORD` | password FTP |

Variable opsional: `KRA_REMOTE_DIR=/public_html/`, `KRA_FTP_PROTOCOL=ftps`,
`KRA_FTP_PORT=21`. File `.git*`, `node_modules`, `.env*`, `.github/` otomatis
tidak di-upload.

## Opsi C: VPS / ada SSH (kalau suatu saat pindah hosting)

`KRA_DEPLOY_TARGET=ssh` + secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY` (private key)
+ variable `KRA_DEPLOY_PATH=/home/user/kra`, `KRA_CF_BRANCH=main`. Workflow menjalankan
`git fetch` + `git pull --ff-only` di server.

---

## Bonus: webhook GitHub → app lokal lewat Cloudflare Tunnel

Kalau kamu tetap mau **app GitHub Changer di Windows** yang nerima webhook (mis. buat
nyatat `from → to` secara live), GitHub tidak bisa memanggil `http://127.0.0.1:4173`.
Solusinya Cloudflare Tunnel — lagi-lagi tidak perlu akses Exabytes:

```powershell
# 1. pastikan server app jalan (background, biar tidak perlu terminal)
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
powershell -ExecutionPolicy Bypass -File scripts\start-hidden.ps1

# 2. instal cloudflared (sekali)
winget install --id Cloudflare.cloudflared

# 3. jalankan quick tunnel
powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1
#    → dapat https://xxxx.trycloudflare.com
#    → webhook URL: https://xxxx.trycloudflare.com/webhook/github
```

Di app: **Automasi → aktifkan `automation.webhookEnabled`**, isi
`automation.webhookSecret` (bebas, tapi **sama persis** dengan yang di GitHub), lalu
`automation.webhookRepository=turtrsst/kra` supaya push repo lain diabaikan, dan
`automation.webhookBranch=main`.

Di GitHub repo KRA → **Settings → Webhooks → Add webhook**:
- Payload URL: URL tunnel di atas + `/webhook/github`
- Content type: `application/json`
- Secret: sama dengan `automation.webhookSecret`
- Events: **Just the push event**

> Quick tunnel berganti URL tiap restart. Untuk URL permanen, buat named tunnel
> (`cloudflared tunnel login`, `cloudflared tunnel create kra`, CNAME di Cloudflare)
> lalu jalankan `-Mode named -TunnelName kra`. Lindungi juga dengan secret + Cloudflare
> Access kalau domainnya publik.

**Ringkasannya:** Pages/Actions = deploy yang tidak bergantung pada PC kamu; Tunnel +
scheduler = audit & kontrol dari dashboard lokal. Keduanya bisa jalan bareng.
