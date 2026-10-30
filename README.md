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
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-Open_Source-00FF9C?style=for-the-badge)

**NO LOGIN. NO PROFILE. NO TRACE.**

</div>

---

## `> WHAT IS GHOSTDROP`

GhostDrop is a privacy-first file drop built on one idea: **the sender should never have to be someone.**

There is no sign-up form, no email field, no password. Open the app and a silent, anonymous session is minted for you in the background. Files travel **directly from one browser to another** over a WebRTC peer-to-peer channel. The server only helps the two devices find each other and never stores the file.

GhostDrop also ships a **steganography suite** for hiding short text messages inside images, with optional AI-generated cover images.

```
 [ SENDER ] ── 6-digit code / QR ──► [ RECEIVER ]
     │                                    │
     │      signaling only (offer,        │
     └──►  answer, ICE) via Firebase  ◄───┘
     │                                    │
     └═══ WebRTC data channel (P2P) ══════┘
              the file goes here
```

---

## `> FEATURES`

### 01 // Zero-Identity Auth — *The Silent Bouncer*

- **No login screen.** Firebase Anonymous Authentication silently creates a session token on page load.
- **Invisible access control.** Realtime Database rules (`auth != null`) limit reads and writes to holders of a valid session token.
- **Nothing to leak.** No credentials are collected, so there are none to breach.

### 02 // P2P File Transfer

- Hit **Start Transfer** to get a **6-digit room code** and a **QR code**.
- The receiver joins by typing the code, scanning the QR with their camera, or uploading a screenshot of the QR.
- **Queue multiple files** and send them as one batch. Files are streamed in 16 KB chunks with backpressure control, so large files don't flood the channel.
- Received files stay in the receiver's browser memory until they download them. Nothing is stored in the cloud.
- **Self-destructing rooms.** The signaling room is deleted from Firebase when either side disconnects, closes or refreshes the tab, or presses Back, and the other peer is notified.

### 03 // Steganography Suite

- **Encode:** hide a text message inside an image by writing it into the least-significant bit of the red, green and blue channels. The result downloads as `secure_artifact.png`.
- **Decode:** load an image made by GhostDrop to reveal the hidden message.
- **Cover image:** upload your own, or generate one with AI.
- **Keep it a PNG.** Re-saving as JPEG, or sending through apps that recompress images, destroys the hidden data.

### 04 // Dynamic API Failover — *Edge Routing*

A resilient Next.js server route (`/api/generate-image`) requests AI-generated cover images with automatic provider failover:

```
                ┌────────────────────┐
  REQUEST ────► │  Next.js API Route │
                └─────────┬──────────┘
                          │
                  ┌───────▼────────┐
                  │ Pollinations.ai│  (primary)
                  └───────┬────────┘
                          │  network crash / error response
                  ┌───────▼─────────────────────────┐
                  │ Hugging Face Serverless Router  │  (failover · SDXL)
                  └───────┬─────────────────────────┘
                          │  all providers down
                  ┌───────▼────────┐
                  │   HTTP 503     │──► Offline Entropy Mode
                  └────────────────┘
```

The server catches upstream errors and reroutes without the client noticing. The Hugging Face step only runs if `HF_API_KEY` is set.

### 05 // Offline Entropy Mode

Graceful degradation, not a crash screen. If every AI provider fails, the frontend catches the `503` and generates a random-noise cover image locally in the browser, so the steganography tools keep working with zero third-party dependencies.

---

## `> ROUTES`

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/dashboard/ghost` | The app, with the **GhostDrop** and **Steganography** tabs |
| `/dashboard/ghost?action=broadcast` | Opens the app and starts a send session immediately |
| `/api/generate-image` | `POST { prompt }` returns an image, with provider failover |

---

## `> TECH STACK`

| Layer | Technology | Role |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router) | Routing, server routes, failover logic |
| **UI** | React 19, Tailwind CSS 4, Framer Motion | Component-driven, animated interface |
| **Language** | TypeScript | End-to-end type safety |
| **Transfer** | WebRTC data channels | Direct browser-to-browser file delivery |
| **Signaling** | Firebase Realtime Database | Exchanging offer, answer and ICE candidates |
| **Auth** | Firebase Anonymous Authentication | Silent, identity-free session tokens |
| **QR** | `react-qr-code`, `html5-qrcode` | Generating and scanning room QR codes |
| **AI (primary)** | Pollinations.ai | Cover image generation |
| **AI (failover)** | Hugging Face Serverless Router (SDXL) | Backup cover image generation |
| **Hosting** | Vercel | Deployment and analytics |

---

## `> GETTING STARTED`

### Prerequisites

- **Node.js** 20.9 or later
- **npm**
- A **Firebase project** with *Anonymous Authentication* and *Realtime Database* enabled
- *(Optional)* A **Hugging Face API key** for the image failover route
- *(Optional)* A **TURN server** account, such as [Metered](https://www.metered.ca/), for transfers across strict networks

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/swaraj1105/ghost-drop.git
cd ghost-drop

# 2. Install dependencies
npm install

# 3. Configure environment (see below)
#    create .env.local manually

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

4. Register a web app in the project settings and paste its config into [`lib/firebase.ts`](lib/firebase.ts). The file currently holds the config of the hosted GhostDrop project, so replace it if you fork.

> Firebase web config values are public identifiers, not secrets. Your Realtime Database rules are what protect your data, so tighten them (per-path, per-UID) before any production deployment.

### TURN Setup (for strict networks)

GhostDrop uses Google's public STUN servers by default, which is enough for most home networks. Some mobile-carrier and corporate networks block direct peer connections, and those need a TURN relay.

In [`lib/webrtcService.ts`](lib/webrtcService.ts), `turnConfig` contains placeholder credentials. Replace `username` and `credential` with your TURN provider's values (and the URLs, if you are not using Metered). Relayed traffic stays encrypted end to end between the two browsers.

> This repo is public. Avoid committing real TURN credentials. Move them into environment variables first.

---

## `> ENVIRONMENT VARIABLES`

Create a `.env.local` file in the project root:

```env
# ── Hugging Face (failover provider) ──────────────────────
HF_API_KEY=your_huggingface_api_key
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `HF_API_KEY` | **Server only** | Authenticates the Hugging Face failover request. If unset, the failover step is skipped. |

On Vercel, add it under **Project → Settings → Environment Variables** and redeploy.

> **Never commit `.env.local`.** It is already covered by `.gitignore`. `HF_API_KEY` must stay server-side and must never be prefixed with `NEXT_PUBLIC_`.

---

## `> SECURITY NOTES`

Read these before trusting GhostDrop with anything sensitive.

- **Transfers are encrypted in transit.** WebRTC data channels are encrypted between the two browsers. If a TURN relay is used, it forwards the encrypted traffic.
- **Signaling is not invisible.** The room code, SDP and ICE candidates (which include network addresses) sit in Firebase Realtime Database while a room is open and are deleted when it closes. This repo has no server-side expiry for rooms that were abandoned without a clean disconnect.
- **Room codes are short-lived, not secret.** They are 6 digits, and the example database rules let any anonymous session read all rooms. Per-room rules would fix this (see the roadmap).
- **Steganography is obfuscation, not encryption.** Messages are XOR-scrambled with a fixed key that lives in the source code, then hidden in the image's pixels. That keeps a message out of casual sight, but anyone who knows to look, and has this code, can read it.

---

## `> FUTURE ROADMAP`

- [x] **WebRTC P2P Transfer.** Direct peer-to-peer delivery that bypasses cloud storage entirely.
- [x] **Self-destructing rooms.** Signaling rooms are removed on disconnect.
- [ ] Hardened per-room database rules scoped by session UID.

---

## `> CONTRIBUTING`

Issues and pull requests are welcome. Fork the repo, create a feature branch, and open a PR with a clear description of the change.

---

<div align="center">

```
// GHOSTDROP — LEAVE NOTHING BEHIND //
```

</div>
