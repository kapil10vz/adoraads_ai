# adoraads.ai Waitlist Server — Deployment Guide

## Overview

This guide walks you through testing, QA, building, and deploying the adoraads waitlist server.

## Pipeline Stages

### 1. Test (Unit Tests)
Run automated tests against the API endpoints:

```bash
npm test
# or
npm run test:unit
```

Tests cover:
- ✅ Health check endpoint
- ✅ Valid email signup
- ✅ Duplicate email handling
- ✅ Invalid email rejection
- ✅ Public signup count
- ✅ Admin authentication
- ✅ CSV export

### 2. QA (Linting & Code Quality)
Check code quality and formatting:

```bash
# Check for linting issues
npm run lint:check

# Auto-fix linting issues
npm run lint

# Run full QA (linting + tests)
npm run qa
```

ESLint rules enforce:
- Consistent formatting (2-space indent)
- Double quotes
- Semicolons
- No unused variables
- Strict equality (=== not ==)

### 3. Build (Pre-deployment Verification)
Run complete build verification:

```bash
npm run build
```

This runs:
1. Linting checks
2. Unit tests
3. Code quality validation

### 4. Integration Testing
Test the full server with real HTTP calls:

```bash
# Starts server, runs tests, stops server
npm run test:integration
```

### 5. Pre-deployment Check
Run the complete pipeline before deploying:

```bash
# Full deployment verification
npm run deploy:check

# Or use the shell script
bash scripts/deploy.sh
```

## Deployment Options

### Option A: Railway (Recommended)

Railway automatically detects Node.js projects and deploys from Git.

**Initial Setup:**
```bash
npm install -g @railway/cli
railway login
railway init
```

**Deploy:**
```bash
npm run deploy:railway
# or
railway up
```

**Environment Variables on Railway:**
1. Go to railway.app → Project → Settings
2. Add these environment variables:
   - `ADMIN_KEY`: Your admin password
   - `SLACK_WEBHOOK_URL`: (optional)
   - `MAILCHIMP_API_KEY`: (optional)
   - `RESEND_API_KEY`: (optional)

**Monitor Deployment:**
```bash
railway status
railway logs
```

### Option B: Render.com

1. Create account at render.com
2. Connect GitHub repository
3. Create new Web Service
4. Configure:
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Environment:** Set variables from `.env.example`

Push to Render branch:
```bash
git push render main:main
```

### Option C: Fly.io

1. Install flyctl: `brew install flyctl`
2. Login: `flyctl auth login`
3. Launch: `flyctl launch`
4. Deploy: `flyctl deploy`

### Option D: GitHub Actions (Auto-deploy)

The CI/CD workflow automatically:
- ✅ Runs tests on every push
- ✅ Checks code quality
- ✅ Deploys to Railway on main branch (if `RAILWAY_TOKEN` is set)

**Setup GitHub Actions:**
1. Go to GitHub Settings → Secrets and variables → Actions
2. Add `RAILWAY_TOKEN`: Get from railway.app → Account → Tokens
3. Push to main to trigger deployment

## Local Development

### Setup
```bash
cp .env.example .env
npm install
npm run dev
```

Server runs at `http://localhost:3010`

### API Endpoints

**Signup:**
```bash
curl -X POST http://localhost:3010/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"Brand Name"}'
```

**Check Count:**
```bash
curl http://localhost:3010/waitlist/count
```

**Admin Panel:**
```bash
curl -H "X-Admin-Key: adoraads-admin-2025" \
  http://localhost:3010/waitlist/admin
```

**Export CSV:**
```bash
curl -H "X-Admin-Key: adoraads-admin-2025" \
  http://localhost:3010/waitlist/admin/csv > waitlist.csv
```

**Health Check:**
```bash
curl http://localhost:3010/health
```

## Environment Variables

Required:
- `ADMIN_KEY`: Admin panel password

Optional (for integrations):
- `SLACK_WEBHOOK_URL`: For Slack notifications
- `MAILCHIMP_API_KEY`: For Mailchimp email list sync
- `MAILCHIMP_LIST_ID`: Mailchimp audience ID
- `LOOPS_API_KEY`: For Loops.so email sync (alternative to Mailchimp)
- `RESEND_API_KEY`: For welcome emails via Resend

See `.env.example` for all options.

## Troubleshooting

### Tests fail with "Connection refused"
Start the server first:
```bash
npm start
# In another terminal:
npm test
```

### Linting errors
Auto-fix with:
```bash
npm run lint
```

### Database errors on Render/Railway
These platforms use ephemeral storage. For production, configure:
- Railway: Add PostgreSQL plugin instead of SQLite
- Render: Add PostgreSQL database

### Email not sending
1. Verify `RESEND_API_KEY` in environment
2. Check sender domain is verified in Resend dashboard
3. Check spam folder

## Monitoring

### Health Check Endpoint
```bash
# Automated health checks (useful for uptime monitors)
curl https://your-deployed-domain.com/health
```

### Logs

**Railway:**
```bash
railway logs --follow
```

**Render:**
View in dashboard → Logs tab

**Fly.io:**
```bash
flyctl logs
```

## Rollback

If deployment fails:

**Railway:**
```bash
railway down  # Rollback to previous version
```

**GitHub Actions:**
Re-run previous workflow or deploy from a previous commit

## Security Checklist

Before production:
- [ ] Change `ADMIN_KEY` from default
- [ ] Set `NODE_ENV=production` on platform
- [ ] Enable HTTPS/SSL (automatic on Railway, Render, Fly.io)
- [ ] Set strong `ADMIN_KEY` (20+ random characters)
- [ ] Rotate API keys (Mailchimp, Resend, etc.)
- [ ] Review CORS settings for your domain
- [ ] Set up monitoring/alerts

## Support

Need help? Check:
- Server logs: `npm start` locally
- Tests: `npm test`
- Railway docs: https://docs.railway.app
- Express docs: https://expressjs.com
