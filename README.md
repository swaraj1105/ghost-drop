<div align="center">

```
 ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗██████╗ ██████╗  ██████╗ ██████╗
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
██║  ███╗███████║██║   ██║███████╗   ██║   ██║  ██║██████╔╝██║   ██║██████╔╝
██║   ██║██╔══██║██║   ██║╚════██║   ██║   ██║  ██║██╔══██╗██║   ██║██╔═══╝
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ██████╔╝██║  ██║╚██████╔╝██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝
```

### `// ZERO IDENTITY SECURE PAYLOAD PROTOCOL //`

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-Open_Source-00FF9C?style=for-the-badge)

**NO LOGIN. NO PROFILE. NO TRACE.**

</div>

---

## `> WHAT IS GHOSTDROP`

GhostDrop is a privacy-first payload drop built on one idea: **the sender should never have to be someone.**

There is no sign-up form, no email field, no password. Open the app and a silent, anonymous session is minted for you in the background. Drop encrypted files and text into the cloud, and the payload stays decoupled from your real-world identity.

When the network breaks, GhostDrop doesn't. Its AI cover-generation pipeline fails over between providers on the server, and if every external API goes dark, the UI drops into a local offline mode instead of crashing.

```
[ USER ] ──► [ ANON SESSION TOKEN ] ──► [ PAYLOAD VAULT ]
   │                                          ▲
   └── no email · no password · no name ──────┘
```

---

## `> FEATURES`

### 01 // Zero-Identity Auth — *The Silent Bouncer*

- **No login screen.** Firebase Anonymous Authentication silently generates a cryptographic session token on page load.
- **Invisible access control.** Realtime Database rules (`auth != null`) lock all reads and writes to holders of a valid session token.
- **Nothing to leak.** No credentials are collected, so there are none to breach.

### 02 // Secure Payload Manager

- Drop **encrypted files and text** into the cloud.
- Payloads are accessible only through the temporary session, **decoupling the data from the sender's real-world identity**.

### 03 // Dynamic API Failover — *Edge Routing*

A resilient Next.js server route requests AI-generated payload covers with automatic provider failover:

```
                ┌────────────────────┐
  REQUEST ────► │  Next.js API Route │
                └─────────┬──────────┘
                          │
                  ┌───────▼────────┐
                  │ Pollinations.ai│  (primary)
                  └───────┬────────┘
                          │  network crash / Cloudflare 530
                  ┌───────▼─────────────────────────┐
                  │ Hugging Face Serverless Router  │  (failover · SDXL)
                  └───────┬─────────────────────────┘
                          │  all providers down
                  ┌───────▼────────┐
                  │   HTTP 503     │──► Offline Entropy Mode
                  └────────────────┘
```

The server catches upstream errors and reroutes without the client ever noticing, targeting **99.9% availability** for cover generation.

### 04 // Secure Offline Entropy Mode

Graceful degradation, not a crash screen. If every external API fails, the frontend catches the `503` and transitions the UI into a **local decryption state**, so the core flow keeps working with zero third-party dependencies.

---

## `> TECH STACK`

| Layer | Technology | Role |
| --- | --- | --- |
| **Framework** | Next.js (App Router) | Routing, server routes, edge failover logic |
| **UI** | React | Component-driven interface |
| **Language** | TypeScript | End-to-end type safety |
| **Styling** | Tailwind CSS | Brutalist, utility-first design system |
| **Auth** | Firebase Anonymous Authentication | Silent, identity-free session tokens |
| **Database** | Firebase Realtime Database | Payload storage, secured by `auth != null` rules |
| **AI (primary)** | Pollinations.ai | Payload cover generation |
| **AI (failover)** | Hugging Face Serverless Router (SDXL) | Backup cover generation |

---

## `> GETTING STARTED`

### Prerequisites

- **Node.js** 18.17 or later
- **npm**
- A **Firebase project** with *Anonymous Authentication* and *Realtime Database* enabled
- A **Hugging Face API key** for the failover route

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/ghostdrop.git
cd ghostdrop

# 2. Install dependencies
npm install

# 3. Configure environment (see next section)
cp .env.example .env.local   # or create .env.local manually

# 4. Boot the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Your anonymous session is created automatically.

### Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Realtime Database** and apply these rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

> Tighten these further (per-path, per-UID) before any production deployment.

---

## `> ENVIRONMENT VARIABLES`

Create a `.env.local` file in the project root:

```env
# ── Hugging Face (failover provider) ──────────────────────
HF_API_KEY=your_huggingface_api_key

# ── Firebase Web Config ───────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `HF_API_KEY` | **Server only** | Authenticates the Hugging Face failover request |
| `NEXT_PUBLIC_FIREBASE_*` | Client | Standard Firebase web config |

> **Never commit `.env.local`.** Make sure it is listed in your `.gitignore`. `HF_API_KEY` must stay server-side and must never be prefixed with `NEXT_PUBLIC_`.

---

## `> FUTURE ROADMAP`

- [ ] **WebRTC P2P Transfer.** Direct peer-to-peer payload delivery that bypasses cloud storage entirely.
- [ ] **Self-Destructing Payloads.** Time-to-live and burn-after-read, so payloads vanish after expiry or first access.
- [ ] Hardened per-payload database rules scoped by session UID.

---

## `> CONTRIBUTING`

Issues and pull requests are welcome. Fork the repo, create a feature branch, and open a PR with a clear description of the change.

---

<div align="center">

```
// GHOSTDROP — LEAVE NOTHING BEHIND //
```

</div>
