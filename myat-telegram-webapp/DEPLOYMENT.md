# Myat Telegram Web App — Deploy Guide

## 1) Prepare services

### A) Create Postgres (Supabase recommended)
1. Create a Supabase project.
2. Get your Postgres connection string and set it as `DATABASE_URL`.
   - Use the **Transaction pooler** connection string if you deploy on Vercel (recommended).

### B) Create Telegram Bot
1. Create bot with **@BotFather** and get:
   - `TELEGRAM_BOT_TOKEN`
   - bot username (without `@`) → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

## 2) Environment variables
Copy `.env.example` → set variables in your hosting provider:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- `NEXT_PUBLIC_ADMIN_USERNAME` (the admin account to open chat, e.g. `johnnewmannn`)
- `MAIN_CHANNEL_USERNAME` = `Myat_2055` (without `@`)
- `COMMUNITY_GROUP_USERNAME` = `myat_2055G` (without `@`)
- `APP_JWT_SECRET` (long random string)
- `ADMIN_PASSWORD` (for `/admin` panel)
- `TELEGRAM_WEBHOOK_SECRET` (recommended)
- (Optional) `ADMIN_TELEGRAM_ID` (numeric id to receive withdrawal notifications)

## 3) Database migration
Run (locally or in CI):

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

## 4) Deploy the web app

### Option A: Vercel
1. Push this project to GitHub.
2. Import to Vercel.
3. Add all env vars in Vercel Project Settings.
4. Deploy → you will get an HTTPS URL like:
   - `https://your-app.vercel.app`

### Option B: Render (your choice)
1. Push this project to GitHub.
2. In Render: **New +** → **Web Service** → connect your repo.
3. Set:
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm run start`
4. Add all environment variables in Render (same list in section 2).
5. Deploy → you will get an HTTPS URL from Render.

## 5) Configure Telegram WebApp
Telegram requires HTTPS.

### A) Set bot menu button URL
In **@BotFather**:
- **/setmenubutton** → choose your bot → set to your HTTPS URL

### B) Set Web App domain (important)
In **@BotFather**:
- **/setdomain** → choose your bot → set domain (e.g. `your-app.onrender.com`)

## 6) Configure webhook for “Type task”
To auto-detect the phrase `Let's Go with Myat`, set webhook to:

`https://YOUR_DOMAIN/api/telegram/webhook`

And pass the secret token header:
- Header: `X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>`

You can set webhook via browser (simple tool) or Telegram API call:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/api/telegram/webhook","secret_token":"YOUR_SECRET"}'
```

## 7) Permissions needed for task verification

### Follow Channel verification
To verify “Follow channel”, the bot should be **admin** of the channel.

### Join Group + phrase detection
Add the bot to the community group.
For phrase detection, bot needs to receive messages in the group:
- If privacy mode blocks it, disable privacy mode via **@BotFather** → /setprivacy → Disable.

## 8) Admin panel
- Open: `/admin`
- Login: `/admin/login`
Approve withdrawals: Admin panel → Accept/Reject.
