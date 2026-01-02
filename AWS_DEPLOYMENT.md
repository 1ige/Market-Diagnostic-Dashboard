# AWS Deployment Guide

## Quick Setup for AWS EC2

### 1. Security Group Configuration
Ensure your EC2 instance security group allows inbound traffic on:
- **Port 5173** (Frontend - Vite dev server)
- **Port 8000** (Backend API)
- **Port 22** (SSH access)

### 2. Environment Configuration

#### For Production (Direct Backend Access)
If your AWS security group allows port 8000:

Edit `devops/env/frontend.env`:
```bash
VITE_API_URL=http://YOUR_AWS_PUBLIC_IP:8000
```

Edit `devops/env/backend.env`:
```bash
DATABASE_URL=postgresql://market_user:market_pass@db:5432/market_db
FRED_API_KEY=6f12b75f50396346d15aa95aac7beaef
CORS_ORIGINS=http://YOUR_AWS_PUBLIC_IP:5173
```

#### For Development/Proxy Mode (Recommended)
If you want all traffic through port 5173 only:

Edit `devops/env/frontend.env`:
```bash
VITE_API_URL=/api
```

Edit `devops/env/backend.env`:
```bash
DATABASE_URL=postgresql://market_user:market_pass@db:5432/market_db
FRED_API_KEY=6f12b75f50396346d15aa95aac7beaef
CORS_ORIGINS=*
```

The Vite proxy (configured in `frontend/vite.config.ts`) will route `/api/*` requests to the backend internally.

### 3. Deploy with Docker Compose

```bash
# Pull latest code
git pull origin main

# Rebuild and restart containers
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f
```

### 4. Access Your Dashboard
Open your browser to:
```
http://YOUR_AWS_PUBLIC_IP:5173
```

### 5. Verify Everything Works

Check backend health:
```bash
curl http://localhost:8000/health
```

Check frontend proxy (if using proxy mode):
```bash
docker exec market_frontend wget -qO- http://localhost:5173/api/health
```

## Troubleshooting

### Issue: "Network error when attempting to fetch resource"

**Solution 1: Use Proxy Mode (Recommended)**
- Set `VITE_API_URL=/api` in `devops/env/frontend.env`
- Restart containers: `docker compose restart`
- Clear browser cache

**Solution 2: Allow Port 8000**
- Add port 8000 to AWS security group inbound rules
- Set `VITE_API_URL=http://YOUR_AWS_PUBLIC_IP:8000` in frontend.env
- Update `CORS_ORIGINS` in backend.env with your frontend URL

### Issue: CORS errors

Edit `devops/env/backend.env`:
```bash
CORS_ORIGINS=http://YOUR_AWS_PUBLIC_IP:5173,http://YOUR_DOMAIN.com
```

Or use `*` to allow all origins (less secure):
```bash
CORS_ORIGINS=*
```

### Issue: Frontend not accessible from outside

Check docker-compose.yml has proper port binding:
```yaml
ports:
  - "0.0.0.0:5173:5173"  # Should bind to all interfaces
```

Check Vite is running with `--host` flag:
```yaml
command: ["pnpm", "dev", "--host"]
```

### Clear Browser Cache on Mobile
1. Close browser tab completely
2. Clear browsing data for the site
3. Reopen the URL

## Production Recommendations

For production deployments:

1. **Use a reverse proxy** (Nginx/Caddy) instead of exposing ports directly
2. **Enable HTTPS** with Let's Encrypt certificates
3. **Restrict CORS** to specific domains instead of `*`
4. **Use production build** of frontend instead of dev server
5. **Set up monitoring** and logging
6. **Use managed database** (RDS) instead of containerized PostgreSQL

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
