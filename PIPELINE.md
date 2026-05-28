# Test, QA, Build & Deploy Pipeline

Quick reference for running the complete pipeline.

## One-Command Deployment

```bash
# Full validation before deploying
npm run deploy:check
```

Or use the shell script:
```bash
bash scripts/deploy.sh
```

## Individual Steps

### 1️⃣ Test (Unit & Integration)

```bash
# Run integration tests (requires server running)
npm test

# Or just unit tests
npm run test:unit

# Or start server + run tests automatically
npm run test:integration
```

**What it tests:**
- ✅ POST /waitlist — valid email signup
- ✅ POST /waitlist — duplicate email handling
- ✅ POST /waitlist — invalid email rejection
- ✅ GET /waitlist/count — public counter
- ✅ GET /waitlist/admin — admin access control
- ✅ GET /waitlist/admin/csv — CSV export
- ✅ GET /health — health check

### 2️⃣ QA (Linting & Code Quality)

```bash
# Check for issues
npm run lint:check

# Auto-fix issues
npm run lint

# Or run full QA (lint + test)
npm run qa
```

**Checks:**
- Consistent indentation (2 spaces)
- Double quotes
- Semicolons required
- No unused variables
- Strict equality (=== not ==)
- Proper brace style

### 3️⃣ Build (Pre-deployment)

```bash
# Full pre-deployment verification
npm run build
```

This runs:
1. Linting checks
2. Unit tests
3. Code quality validation

### 4️⃣ Deploy

```bash
# Railway (recommended)
npm run deploy:railway

# Or manual Railway
railway up

# Check status
railway status
railway logs --follow
```

## Full Pipeline Example

```bash
# Setup
cp .env.example .env
npm install

# Development
npm run dev              # Start with hot-reload
npm test                 # Run tests

# Before deploying
npm run lint             # Fix code style
npm run qa               # Lint + test
npm run build            # Full verification
npm run deploy:check     # Full pre-deployment check

# Deploy
npm run deploy:railway   # Deploy to Railway
```

## Available npm Scripts

| Command | Purpose | When |
|---------|---------|------|
| `npm start` | Start production server | After deployment |
| `npm run dev` | Start with hot-reload | Development |
| `npm test` | Run integration tests | Before committing |
| `npm run test:unit` | Unit tests only | Quick check |
| `npm run test:integration` | Full E2E test | Before deploying |
| `npm run lint:check` | Check code style | CI/CD, PR checks |
| `npm run lint` | Auto-fix code style | Before committing |
| `npm run qa` | Lint + unit test | Pre-commit |
| `npm run build` | Full pre-deploy check | Before deploying |
| `npm run deploy:check` | Complete validation | Final check before deploy |
| `npm run deploy:railway` | Deploy to Railway | Deployment |

## Environment Setup

### First Time

```bash
# Copy template
cp .env.example .env

# Update with your values
nano .env

# Install dependencies
npm install --ignore-scripts
```

### Required Variables

- `ADMIN_KEY` — Admin password (change from default!)

### Optional (for integrations)

- `SLACK_WEBHOOK_URL` — For Slack notifications
- `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` — For email list sync
- `RESEND_API_KEY` — For welcome emails

## CI/CD with GitHub Actions

Automatically runs on push:
1. Linting + tests on Node 18 & 20
2. Security scan (npm audit)
3. Deploy to Railway on main branch

Enable:
1. Add `RAILWAY_TOKEN` secret to GitHub
2. Push to trigger workflow

## Troubleshooting

**Tests fail?**
```bash
# Start server first
npm start

# Run tests in another terminal
npm test
```

**Linting errors?**
```bash
# Auto-fix all issues
npm run lint
```

**Server won't start?**
```bash
# Check environment validation
node scripts/validate-env.js

# Check that .env exists
cat .env
```

**Port already in use?**
```bash
# Find process using port 3010
lsof -i :3010

# Kill it or use different port
PORT=3011 npm start
```

## Performance Tips

- Use `npm ci` instead of `npm install` in CI/CD
- Run tests in parallel (see GitHub Actions workflow)
- Cache npm dependencies

## Security Checklist

Before deploying to production:
- [ ] Change `ADMIN_KEY` from default
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS origin from "*" to your domain
- [ ] Set strong API keys (Slack, Mailchimp, Resend)
- [ ] Enable HTTPS (automatic on Railway/Render/Fly)
- [ ] Set up monitoring/alerts

## Quick Deploy Steps

```bash
# 1. Make changes
vim waitlist-server.js

# 2. Verify locally
npm run dev          # Test manually
npm test             # Run tests

# 3. Pre-deployment check
npm run deploy:check

# 4. Commit and push
git add -A
git commit -m "Fix: improve email validation"
git push origin main

# 5. Deploy
npm run deploy:railway

# 6. Check
railway logs --follow
curl https://your-domain.com/health
```

## Need Help?

- **Local testing:** See README.md
- **Deployment:** See DEPLOYMENT.md
- **API docs:** Comments in waitlist-server.js
