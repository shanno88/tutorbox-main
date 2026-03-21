# Tutorbox Deployment Guide (Single Server)

This document describes how to deploy the Tutorbox stack
(Next.js admin + FastAPI license server) on a single Linux server.

## 1. Server requirements

- OS: Ubuntu 22.04 (or similar)
- CPU: 1–2 vCPU
- RAM: 2–4 GB
- Disk: 20+ GB SSD
- Public domain (optional but recommended) with DNS pointing to the server

## 2. Components

- Next.js app (under `tutorbox/`, Node 18+)
- FastAPI license server (under `tutorbox/license-server/`, Python 3.11+)
- SQLite for license storage (local file)
- Nginx as reverse proxy and TLS terminator

## 3. Clone project to server

```bash
# On server
sudo apt update
sudo apt install -y git

git clone <YOUR-REPO-URL> ~/tutorbox
cd ~/tutorbox
(If not using git yet, you can rsync/zip the project to the server instead.)

4. Install system dependencies
bash
# Node.js (use nvm or distro packages; example with NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python
sudo apt install -y python3.11 python3.11-venv python3-pip

# Nginx
sudo apt install -y nginx
5. Environment variables
Create a .env.local file for Next.js in ~/tutorbox:

text
# Next.js admin
LICENSE_SERVER_URL=http://127.0.0.1:8000
ADMIN_LICENSE_KEY=ADMIN-TUTORBOX-001
Create a .env or config for FastAPI if needed
(e.g. custom DB path, logging etc; SQLite default is fine for now).

6. Set up FastAPI license server (systemd example)
Create a Python virtualenv and install dependencies:

bash
cd ~/tutorbox/license-server
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # or pip install fastapi uvicorn sqlalchemy ...
Test run:

bash
uvicorn main:app --host 127.0.0.1 --port 8000
# Visit http://SERVER-IP:8000/health to confirm
(Optional) Create a systemd service unit, e.g. /etc/systemd/system/license-server.service:

text
[Unit]
Description=Tutorbox License Server
After=network.target

[Service]
User=YOUR_USER
WorkingDirectory=/home/YOUR_USER/tutorbox/license-server
Environment="PATH=/home/YOUR_USER/tutorbox/license-server/.venv/bin"
ExecStart=/home/YOUR_USER/tutorbox/license-server/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
Then:

bash
sudo systemctl daemon-reload
sudo systemctl enable --now license-server
7. Set up Next.js app
Install dependencies and build:

bash
cd ~/tutorbox
npm install
npm run build
Run in production mode (PM2 example):

bash
sudo npm install -g pm2
pm2 start npm --name tutorbox-admin -- run start
pm2 save
By default Next.js listens on http://127.0.0.1:3000.

8. Nginx reverse proxy
Example /etc/nginx/sites-available/tutorbox:

text
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Optional: expose license API under /license-api
    location /license-api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
Enable config:

bash
sudo ln -s /etc/nginx/sites-available/tutorbox /etc/nginx/sites-enabled/tutorbox
sudo nginx -t
sudo systemctl reload nginx
Then, set in .env.local for production:

text
LICENSE_SERVER_URL=https://your-domain.com/license-api
ADMIN_LICENSE_KEY=ADMIN-TUTORBOX-001
9. Basic verification checklist
curl http://127.0.0.1:8000/health → {"status":"ok"}

curl http://127.0.0.1:8000/v1/licenses/validate -d '{"license_key":"..."}' → JSON

curl http://127.0.0.1:3000/api/admin/billing/search (from server) → 200/403 with JSON

Visit https://your-domain.com/admin and https://your-domain.com/admin/licenses

Admin License page shows status: ok.

text

这份你可以直接存成 `DEPLOY.md`，以后真上服务器的时候，一条条照着执行就行。[1][2]

***

## 二、Plan / License 类型设计（初版）

先来一个够用又简单的模型，后面再细化：

### 1. Plan 层级（基本三档）

- **basic**  
  - 面向小团队/测试。  
  - 限制：每日调用上限较低；只能访问部分高级功能。  
- **pro**（默认你现在用的）  
  - 面向正式付费用户。  
  - 限制：较高的调用上限；可以使用绝大多数功能。  
- **enterprise**  
  - 面向大客户 / 定制合作。  
  - 限制：几乎不限流或按合同约定；支持多管理员、白标等。

可以先只实现 `basic` / `pro`，`enterprise` 留着兼容。

### 2. License 字段（你现在已经有的）

你当前的 `models.License` 大概包含：[3]

- `license_key: str`  
- `plan: str`（目前都是 "pro"）  
- `status: str`（ACTIVE / EXPIRED / REVOKED / INACTIVE）  
- `expires_at: datetime`

后面可以加的（不今天做）：

- `max_users: int | null`（允许多少用户）  
- `notes: str | null`（给你自己看的备注）  
- `metadata: JSON | null`（方便以后扩展东西不改 schema）

### 3. Admin 端如何用 plan

短期内，你可以先在 admin 里用得上这些：

- 在 `/admin/licenses` 页补一行「Plan 说明」，比如 basic/pro。  
- 在某些函数里根据 `plan` 做简单分支：  
  - 比如 basic 不能访问某些高危管理接口，或者显示更少的数据。  

比如在 `withAdminLicense` 里，你暂时不做 plan 限制，只是把 `license.plan` 传递给下游逻辑，后面有需要再用。

***

接下来，你可以先把 `DEPLOY.md` 文件建起来、复制这份进去；等你确认没问题，我们再具体想一下「plan 对应哪些真实能力」——比如你打算卖给谁、每档价位大概多少，这样我们才能决定要不要在 license 里加更多字段。