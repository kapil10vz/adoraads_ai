# adoraads.ai Waitlist Server

A production-ready Express.js backend for capturing beauty brand signups, with Slack notifications, Mailchimp integration, and welcome emails.

## Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# At minimum, set ADMIN_KEY to something secure
nano .env
```

### 2. Development

```bash
# Start development server with auto-reload
npm run dev

# Server runs at http://localhost:3010
# Static files served from ./public/
```

### 3. Test

```bash
# Run all tests
npm test

# Or specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Full server test
```

### 4. Quality Assurance

```bash
# Check code quality
npm run lint:check

# Auto-fix formatting
npm run lint

# Run full QA (lint + test)
npm run qa
```

### 5. Build & Deploy

```bash
# Verify everything before deploying
npm run build
npm run deploy:check

# Deploy to Railway (recommended)
npm run deploy:railway
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options.

## Features

- 📝 **Signup Capture** — POST `/waitlist` with email + metadata
- 📊 **Admin Dashboard** — GET `/waitlist/admin` (password protected)
- 📧 **Email Integration** — Mailchimp sync + Resend welcome emails
- 💬 **Slack Notifications** — Real-time signup alerts
- 📈 **Public Counter** — GET `/waitlist/count` for social proof
- 📥 **CSV Export** — Download all signups for analysis
- 🔒 **Rate Limiting** — 5 signups per IP per minute
- 🚀 **Zero-Config Deploy** — Railway, Render, Fly.io, Vercel support

## API Endpoints

### Public

```bash
# Submit signup
curl -X POST http://localhost:3010/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "brand@example.com",
    "name": "Brand Owner",
    "brand_name": "Beauty Co",
    "brand_tier": "indie",
    "source": "landing_page"
  }'

# Get total signups
curl http://localhost:3010/waitlist/count

# Health check
curl http://localhost:3010/health
```

### Admin (requires X-Admin-Key header)

```bash
# View all signups
curl -H "X-Admin-Key: your-admin-key" \
  http://localhost:3010/waitlist/admin

# Export as CSV
curl -H "X-Admin-Key: your-admin-key" \
  http://localhost:3010/waitlist/admin/csv > signups.csv
```

## Environment Variables

**Required:**
- `ADMIN_KEY` — Password for admin endpoints (default: `adoraads-admin-2025`)

**Optional:**
- `PORT` — Server port (default: `3010`)
- `SLACK_WEBHOOK_URL` — Slack incoming webhook for notifications
- `MAILCHIMP_API_KEY` — For email list syncing
- `MAILCHIMP_LIST_ID` — Mailchimp audience ID
- `RESEND_API_KEY` — For welcome emails
- `NODE_ENV` — `development` or `production`

See `.env.example` for details.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Start production server |
| `npm run dev` | Start with hot reload |
| `npm test` | Run integration tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Full end-to-end test |
| `npm run lint:check` | Check code style |
| `npm run lint` | Auto-fix code style |
| `npm run qa` | Lint + unit test |
| `npm run build` | Full pre-deploy check |
| `npm run deploy:check` | Test before deploying |
| `npm run deploy:railway` | Deploy to Railway |

## Database

Uses **SQLite** by default (zero-config):
- `waitlist.db` — Signups and events
- Auto-created on first run
- All data persisted locally

For production with Render/Railway/Fly.io, switch to PostgreSQL:
```sql
-- Set DATABASE_URL environment variable
-- Server auto-detects and uses Postgres instead
```

## Integrations

### Slack
1. Create incoming webhook: https://api.slack.com/apps
2. Set `SLACK_WEBHOOK_URL` in `.env`
3. Notified in real-time for each signup

### Mailchimp
1. Get API key: https://mailchimp.com/account/integrations/
2. Get List ID: Audience → Settings → Audience name and defaults
3. Set `MAILCHIMP_API_KEY` and `MAILCHIMP_LIST_ID`
4. New signups auto-added to your list

### Loops.so
1. Get API key: https://app.loops.so/settings/integrations/api
2. Set `LOOPS_API_KEY` in `.env`
3. New signups auto-added as contacts with custom fields (brand_name, brand_tier)
4. Can be used instead of or in addition to Mailchimp

### Welcome Emails (Resend)
1. Get API key: https://resend.com/api-keys
2. Verify sender domain
3. Set `RESEND_API_KEY`
4. Welcome email auto-sent to new signups

## Deployment

### Railway (1-click)
```bash
npm install -g @railway/cli
railway login
railway init
npm run deploy:railway
```

### Render
Push to GitHub, connect Render project, set environment variables.

### Fly.io
```bash
flyctl launch
flyctl deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup for each platform.

## Development

### Project Structure
```
.
├── waitlist-server.js      # Main Express app
├── test-waitlist.js        # Integration tests
├── .eslintrc.json          # Code style rules
├── scripts/
│   ├── validate-env.js     # Env validation
│   └── deploy.sh           # Deployment script
├── .github/
│   └── workflows/ci-cd.yml # GitHub Actions CI/CD
├── public/                 # Static files (index.html, blog.html, etc)
├── .env.example            # Environment template
└── waitlist.db             # SQLite database (auto-created)
```

### Code Style
- 2-space indentation
- Double quotes
- Semicolons required
- ESLint enforced

```bash
npm run lint  # Auto-fix
```

### Testing Workflow
```bash
# 1. Start server
npm start

# 2. Run tests (in another terminal)
npm test

# 3. All tests should pass ✅
```

## Monitoring

Use the health check endpoint for uptime monitoring:
```bash
curl https://your-domain.com/health
# Returns: { "status": "ok", "signups": 42, ... }
```

Monitor logs:
- **Railway:** `railway logs --follow`
- **Render:** Dashboard → Logs
- **Local:** Terminal output

## Troubleshooting

**Tests fail?**
- Ensure server is running: `npm start`
- Check port 3010 is available

**Email not sending?**
- Verify `RESEND_API_KEY` is set
- Check sender domain is verified in Resend

**Database locked error?**
- Kill any other `npm start` processes
- Remove `waitlist.db` and restart (loses data)

**CORS errors?**
- Update origin in `waitlist-server.js` line 27
- Currently allows all origins (`*`)

## Performance

- SQLite: ~1000 signups before needing optimization
- Rate limit: 5 signups per IP per minute
- Response time: <50ms typical

For larger scale, switch to PostgreSQL and add:
- Caching layer (Redis)
- Load balancer
- Database replication

## Security

⚠️  **Before Production:**
- [ ] Change `ADMIN_KEY` from default value
- [ ] Remove CORS `"*"` — set to your domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (automatic on Railway/Render/Fly)
- [ ] Rotate API keys regularly
- [ ] Add request logging/monitoring

Example CORS fix:
```javascript
app.use(cors({ origin: "https://adoraads.ai" }));
```

## Support & Docs

- **Express.js:** https://expressjs.com/
- **Railway:** https://docs.railway.app/
- **Resend:** https://resend.com/docs
- **Mailchimp:** https://mailchimp.com/developer/
- **Slack API:** https://api.slack.com/

## License

Built for adoraads.ai
