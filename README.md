# WA Live Count

> Track any WhatsApp Channel's live subscriber/follower count in real time.

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS 4**, and **Baileys**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Connecting WhatsApp](#connecting-whatsapp)
5. [How Channel Lookup Works](#how-channel-lookup-works)
6. [Testing a Channel](#testing-a-channel)
7. [Project Structure](#project-structure)
8. [Production Build](#production-build)
9. [Deployment Note](#deployment-note)

---

## Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- A WhatsApp account on a phone

Check your Node version:
```bash
node --version   # should be v18 or higher
```

---

## Installation

```bash
npm install
```

---

## Running the App

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Connecting WhatsApp

The app uses **Baileys** to connect to WhatsApp over the WebSocket API.  
Before you can look up channels, you must link a WhatsApp account.

1. Start the dev server: `npm run dev`
2. Open **http://localhost:3000/setup**
3. A QR code will appear
4. On your phone: **WhatsApp → Menu (⋮) → Linked Devices → Link a Device**
5. Scan the QR code
6. The page will show ✅ **Connected!**

Authentication credentials are stored in the `./auth/` folder.  
**Never commit this folder — it contains your session keys.**

> If you are ever logged out, delete the `./auth/` folder and repeat the steps above.

---

## How Channel Lookup Works

1. You paste a URL like `https://whatsapp.com/channel/0029XXXX`
2. The app extracts the invite code from the URL
3. The Next.js API route calls Baileys `newsletterMetadata("invite", code)`
4. Baileys resolves the code via WhatsApp and returns metadata including the subscriber count
5. The result is returned as JSON and displayed
6. Every **10 seconds**, the count is automatically refreshed

### API Endpoint

```
GET /api/channel?url=https://whatsapp.com/channel/0029...
```

**Success:**
```json
{
  "success": true,
  "channel": {
    "name": "TechKey",
    "followers": 4238,
    "id": "120363XXXXXXXX@newsletter",
    "picture": null,
    "fetchedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Channel not found.",
  "code": "CHANNEL_NOT_FOUND"
}
```

---

## Testing a Channel

1. Open http://localhost:3000
2. Paste any public WhatsApp Channel URL:
   ```
   https://whatsapp.com/channel/0029Va4EaRQFG8JxbcM3GV2Q
   ```
3. Click **Check Channel**
4. The follower count appears and updates every 10 seconds

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root HTML layout + metadata
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global dark theme styles
│   ├── setup/
│   │   └── page.tsx        # WhatsApp QR auth page
│   └── api/
│       ├── channel/
│       │   └── route.ts    # GET /api/channel — follower lookup
│       └── auth/
│           └── route.ts    # GET/POST /api/auth — connection status
│
├── components/
│   ├── ChannelCard.tsx     # Orchestrates input ↔ counter views
│   ├── ChannelInput.tsx    # URL input form with validation
│   └── LiveCounter.tsx     # Live follower counter + polling
│
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── whatsapp.ts         # Baileys singleton connection manager
│   ├── channel.ts          # Newsletter → ChannelData mapping
│   ├── validation.ts       # URL parsing and validation
│   └── rateLimit.ts        # In-memory IP rate limiting
│
├── auth/                   # WhatsApp session files (auto-created, git-ignored)
├── .env.example            # Environment variables template
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Production Build

```bash
npm run build
npm start
```

---

## Type Checking & Linting

```bash
npm run type-check   # TypeScript strict check
npm run lint         # ESLint
```

---

## Deployment & Netlify Guide

> ⚠️ **Important Architecture Note:** This app uses **Baileys**, which maintains a persistent WebSocket connection to WhatsApp servers and saves session keys to disk (`./auth_info_baileys/`).

### Option A: Render / Railway / VPS Deployment (Recommended for 100% Uptime)
Because platforms like Render, Railway, Fly.io, or VPS (DigitalOcean/Hetzner) support persistent Node.js background services:
1. Push your repository to GitHub.
2. Create a new Web Service on [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm start`
5. Mount a persistent disk for the `./auth_info_baileys` folder so session state is preserved across redeploys.

### Option B: Netlify Deployment
To deploy on [Netlify](https://netlify.com):
1. **Connect Repository**: Push your code to GitHub and link it to Netlify.
2. **Build Settings**:
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
3. **Environment**:
   - Ensure Node version is set to 18+ (`NODE_VERSION` = `20`).
4. **Netlify Functions & WebSocket Note**:
   Netlify Functions are ephemeral (spin up per request). When using Netlify, either:
   - Deploy your Node server on Render/Railway and point your Netlify frontend to it.
   - OR use an external Redis/MongoDB session store (`useRedisAuthState`) for zero-downtime serverless auth.

---

## Security

- WhatsApp credentials (`./auth/`) are **never** sent to the browser
- The `/api/channel` endpoint only accepts `whatsapp.com/channel/*` URLs
- Rate limiting: 12 requests per minute per IP
- No external URLs are fetched — only WhatsApp's own API via Baileys
