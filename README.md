# 🚀 WA Live Count

> Track any WhatsApp Channel's live subscriber & follower count in real time with an ultra-clean, mobile-responsive UI.

Created with ❤️ by **Agent X**.

Built with **Next.js 15 (Turbopack)**, **TypeScript**, **Tailwind CSS**, and **Baileys**.

---

## ⚠️ Important Warnings & Developer Guidelines

> [!WARNING]
> ### 1. Use a Secondary WhatsApp Number (Recommended)
> While this app **only performs read-only channel metadata queries** and **never sends messages or DMs**, developer best practice is to link a **secondary/spare WhatsApp number** (e.g. a secondary SIM or WhatsApp Business account) rather than your main personal WhatsApp account for 100% peace of mind.

> [!CAUTION]
> ### 2. Never Run Localhost and Cloud Servers Concurrently
> WhatsApp allows only **one active WebSocket connection per device session**. If both `localhost` and your cloud host (Render) connect simultaneously using the same credentials, WhatsApp will trigger `440 Conflict / Stream Errored` disconnects. Once you export your session to the cloud, **stop localhost (`Ctrl + C`)**.

> [!IMPORTANT]
> ### 3. Session Security
> Never commit your `./auth/` folder to GitHub or expose session strings publicly. The `./auth/` folder is git-ignored by default. On production servers, session export endpoints are strictly locked down with `403 Forbidden` rules.

---

## ✨ Features

- ⚡ **Real-Time Live Odometer Counter**: Smooth numerical transitions (SocialBlade/YouTube style).
- 📱 **Mobile-First Responsive UI**: Auto-scaling digits, touch-friendly refresh rate pills, and zero iOS auto-zoom bugs.
- ☁️ **Cloud Session Export (`WA_AUTH_BACKUP`)**: Export your authenticated local session as a Base64 environment variable for 24/7 cloud hosts like Render.
- 🛡️ **3-Second Deduplication Cache**: Instant response for concurrent visitors while keeping WhatsApp queries low and safe.
- ⏱️ **Custom Refresh Rates**: Switch live polling speed between 3s, 5s, 10s, and 30s.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/Agentx-max/wa-channel-count.git
cd wa-channel-count
npm install
```

### 2. Local Setup & Linking

```bash
npm run dev
```

1. Open **`http://localhost:3000/setup`** in your browser.
2. Click **🔢 Phone Pairing Code** (or Scan QR Code).
3. Enter your phone number with country code (e.g. `94770153179`).
4. On your phone: Open **WhatsApp → Linked Devices → Link with phone number instead** and type the 8-digit code.
5. The setup page will switch to **Engine Connected! ✓**.

---

## ☁️ 24/7 Cloud Deployment Guide (Render.com + UptimeRobot)

Serverless hosts (like Vercel, Netlify, or Cloudflare Workers) **cannot** maintain persistent WhatsApp WebSockets. Long-running container hosts like **Render.com** or **Railway.app** are required.

### Step A: Export Session from Localhost
1. Connect WhatsApp locally at `http://localhost:3000/setup`.
2. Click **📤 Export Session for Cloud** and click **Copy**.
3. Stop localhost in your terminal (`Ctrl + C`).

### Step B: Deploy on Render.com
1. Create a free **Web Service** on [Render.com](https://render.com) linked to your repository.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. Go to **Environment** tab on Render and add:
   - **Key**: `WA_AUTH_BACKUP`
   - **Value**: *(Paste the copied Base64 string)*
5. Click **Save Changes**.

### Step C: Keep Awake 24/7 for Free (UptimeRobot)
Render free servers sleep after 15 minutes of inactivity. Use UptimeRobot to keep it awake 24/7/365:
1. Sign up at [UptimeRobot.com](https://uptimerobot.com).
2. Click **+ Add New Monitor**.
3. Select **`HTTP(s)`** and enter your Render website URL (e.g. `https://your-app.onrender.com`).
4. Set interval to **`Every 5 minutes`** and save.

---

## 📡 API Endpoint

### `GET /api/channel`

Resolves a WhatsApp Channel invite link to metadata and live follower counts.

```http
GET /api/channel?url=https://whatsapp.com/channel/0029Va4K0PZ5a245NkngBA2M
```

#### Response Example:
```json
{
  "success": true,
  "channel": {
    "name": "WhatsApp",
    "followers": 182450123,
    "id": "120363144038483540@newsletter",
    "picture": "https://pps.whatsapp.net/v/t61.24694-24/...",
    "verified": true,
    "fetchedAt": "2026-09-25T12:00:00.000Z"
  }
}
```

---

## 📁 Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root HTML layout & fonts
│   ├── page.tsx            # Main live counter page
│   ├── globals.css         # Glassmorphism & dark theme styles
│   ├── setup/
│   │   └── page.tsx        # Phone pairing & cloud export admin page
│   └── api/
│       ├── channel/
│       │   └── route.ts    # GET /api/channel — Live subscriber lookup
│       ├── auth/
│       │   └── route.ts    # GET/POST /api/auth — Socket status & pairing
│       └── auth/export/
│           └── route.ts    # GET /api/auth/export — Base64 session export (local only)
│
├── components/
│   ├── ChannelCard.tsx     # Card container & view toggler
│   ├── ChannelInput.tsx    # URL input, validation & test chips
│   ├── LiveCounter.tsx     # Live counter & refresh controls
│   └── OdometerCounter.tsx # Smooth digit animation engine
│
├── lib/
│   ├── whatsapp.ts         # Baileys singleton manager & cache
│   ├── channel.ts          # Newsletter metadata mapping
│   ├── validation.ts       # WhatsApp channel URL validator
│   └── rateLimit.ts        # IP rate limiting engine
│
├── auth/                   # Local WhatsApp session keys (Git-ignored)
└── package.json
```

---

## 🧑‍💻 Author

Created & Maintained by **Agent X**.
