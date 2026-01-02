# 🚀 AWS Quick Fix Guide

## Problem: Port issues on AWS

### ✅ FIXED Configuration

The dashboard now supports two deployment modes:

### 🔐 Option 1: PROXY MODE (Recommended)
**All traffic through port 5173 only**

```bash
# Run the configuration script
./configure_aws.sh
# Choose option 1

# Or manually set:
# devops/env/frontend.env
VITE_API_URL=/api

# devops/env/backend.env  
CORS_ORIGINS=*
```

**AWS Security Group:**
- Port 5173: OPEN ✅
- Port 8000: Can be closed 🔒

**Access:** `http://YOUR_AWS_IP:5173`

---

### 🌐 Option 2: DIRECT MODE
**Frontend and Backend on separate ports**

```bash
# Run the configuration script
./configure_aws.sh
# Choose option 2

# Or manually set:
# devops/env/frontend.env
VITE_API_URL=http://YOUR_AWS_IP:8000

# devops/env/backend.env
CORS_ORIGINS=http://YOUR_AWS_IP:5173
```

**AWS Security Group:**
- Port 5173: OPEN ✅
- Port 8000: OPEN ✅

**Access:** `http://YOUR_AWS_IP:5173`

---

## 📦 Deploy Changes

```bash
# Pull latest code
git pull

# Rebuild containers
docker compose down
docker compose up -d --build

# Check status
docker compose logs -f
```

---

## 🔍 Quick Tests

```bash
# Test backend
curl http://localhost:8000/health

# Test proxy (if using proxy mode)
docker exec market_frontend wget -qO- http://localhost:5173/api/health

# View all logs
docker compose logs -f

# View specific service
docker compose logs -f frontend
docker compose logs -f backend
```

---

## 🐛 Troubleshooting

### Still getting network errors?
1. Clear browser cache completely
2. Try incognito/private browsing mode
3. Check AWS security group rules
4. Verify docker containers are running: `docker compose ps`

### CORS errors?
Update `devops/env/backend.env`:
```bash
CORS_ORIGINS=http://YOUR_AWS_IP:5173
```

### Can't access from phone/tablet?
- Make sure you're using the AWS public IP, not localhost
- Check your device is not on VPN blocking the port
- Use proxy mode (option 1) for better mobile compatibility

---

## 📚 More Details
See `AWS_DEPLOYMENT.md` for complete documentation.
