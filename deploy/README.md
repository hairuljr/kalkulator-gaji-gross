# Deployment ke VPS

Alur: push ke `main` → CI hijau → workflow **Deploy** membangun image Docker,
mengirimnya via SSH ke VPS, lalu menjalankan ulang container di
`127.0.0.1:3100`. Reverse proxy (Caddy) menerbitkan HTTPS untuk
`gaji.jrcomp.biz.id`.

## Setup sekali di VPS

1. DNS: record `A` untuk domain → IP VPS.
2. Firewall: buka port 80 & 443 (di firewall penyedia cloud **dan** di dalam VM).
3. Pasang Docker dan pastikan user deploy ada di grup `docker`:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   ```
4. Pasang Caddy (https://caddyserver.com/docs/install) dan tambahkan blok di
   `deploy/Caddyfile` ke konfigurasinya, lalu muat ulang Caddy. Jika memakai
   nginx, cukup `proxy_pass http://127.0.0.1:3100;`. Pastikan port `3100`
   belum dipakai layanan lain; bila bentrok, ubah di `deploy.yml` dan
   `deploy/Caddyfile`.
5. Buat SSH key khusus deploy (bukan key pribadi):
   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N "" -C github-actions-deploy
   cat deploy_key.pub >> ~/.ssh/authorized_keys   # di VPS
   ```

## Secret GitHub (Settings → Secrets and variables → Actions)

| Secret | Isi |
|---|---|
| `VPS_HOST` | IP/hostname VPS |
| `VPS_USER` | user SSH di VPS |
| `VPS_SSH_KEY` | isi **private** key `deploy_key` |

Setelah itu hapus `deploy_key` lokal. Deploy manual: tab Actions → Deploy →
*Run workflow*.
