<div align="center">

```
 ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗██████╗ ██████╗  ██████╗ ██████╗
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
██║  ███╗███████║██║   ██║███████╗   ██║   ██║  ██║██████╔╝██║   ██║██████╔╝
██║   ██║██╔══██║██║   ██║╚════██║   ██║   ██║  ██║██╔══██╗██║   ██║██╔═══╝
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ██████╔╝██║  ██║╚██████╔╝██║
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝
```

### Send files straight from one device to another. No account. No sign-up.

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

</div>

---

## What is GhostDrop?

GhostDrop is a small web app for sending files from one device to another, for example from your phone to your laptop.

- **No account.** There is no sign-up, email or password. Open the page and use it.
- **Direct transfer.** Files go straight from one browser to the other. They are not uploaded to a server or stored in the cloud.
- **Protected in transit.** The connection between the two devices is encrypted.
- **Simple pairing.** The sender gets a 6-digit code and a QR code. The receiver types the code or scans the QR.

GhostDrop also has a second tab, **Hide Secret Message**, for hiding a short text message inside a picture and reading it back later.

```
 [ SENDER ] ── 6-digit code / QR code ──► [ RECEIVER ]
     │                                         │
     │   connection set-up only (Firebase)     │
     └─────────────────────────────────────────┘
     │                                         │
     └═══ direct encrypted connection (WebRTC) ┘
                the file travels here
```

---

## How to use it

**Sending files**

1. Open the app and tap **Send Files**. You get a 6-digit code and a QR code.
2. Give the code to the other person, or let them scan the QR code.
3. When they connect, choose your files and tap **Send Now**.

**Receiving files**

1. Open the app and tap **Receive Files**.
2. Type the 6-digit code from the sender, or tap the QR icon to scan it, then tap **Connect**.
3. When a file arrives, tap its download button to save it.

Both devices need to be online at the same time and keep the page open until the transfer is finished. The **About** button in the top bar shows these same steps inside the app.

---

## Features

### Share Files

- **Code or QR pairing.** The receiver can type the code, scan the QR with the camera, or choose a photo of the QR code.
- **Several files at once.** Add as many files as you like, then send them in one go.
- **Big files.** There is no fixed size limit. The sender paces itself so the connection is never flooded. On the receiving side, supported browsers save the incoming file to the device's own storage in small pieces instead of holding it all in memory. Other browsers fall back to memory, where very large files (over about 1 GB) are less reliable. Recent Chrome and Edge handle big files best.
- **Progress bars.** Both devices see a progress bar with the percentage and the size sent or received.
- **Screen stays awake.** While a file is moving, the page asks the device not to go to sleep, which would drop the connection. This works on browsers that support it.
- **Self-closing sessions.** A session ends when either person taps **Close Connection**, refreshes the page, or presses Back. The other device is told. If a device simply disappears, for example the browser is closed, the other one waits 60 seconds and then closes the session. Switching to another app for a while does not end it.
- **Nothing is kept.** Received files live only on the receiving device until they are saved. When the session closes, GhostDrop removes the temporary copies it made on that device.

### Hide Secret Message

- **Hide a Message.** Pick a picture (upload your own or create one with AI), type a message, and download a PNG with the message hidden inside it.
- **Reveal a Message.** Choose a picture made this way to read the hidden message.
- **Keep it a PNG.** Saving as JPEG, or sending the picture through an app that recompresses images, destroys the hidden message.
- **It is not encryption.** The message is scrambled with a fixed key that is in the source code, then hidden in the picture. That keeps it out of casual sight, but anyone who knows to look and has this code can read it.

### AI pictures with automatic backup

When you create a picture with AI, a server route (`/api/generate-image`) asks Pollinations.ai first. If that fails, it tries Hugging Face (only if `HF_API_KEY` is set). If every provider is down, the app makes a plain random-noise picture on the device so the tab keeps working.

---

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/dashboard/ghost` | The app, with the **Share Files** and **Hide Secret Message** tabs |
| `/dashboard/ghost?action=broadcast` | Opens the app and starts a send session immediately |
| `/api/generate-image` | `POST { prompt }` returns an image, with provider failover |

---

## Tech stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Pages and server routes |
| UI | React 19, Tailwind CSS 4, Framer Motion, Lucide icons | Interface and animation |
| Language | TypeScript | Type safety |
| Transfer | WebRTC data channels | Direct browser-to-browser delivery |
| Connection set-up | Firebase Realtime Database | Exchanging the offer, answer and network candidates |
| Sign-in | Firebase Anonymous Authentication | Invisible, account-free session |
| Relay | TURN server (Metered by default) | Connects devices on different networks |
| QR codes | `react-qr-code`, `html5-qrcode` | Showing and scanning room codes |
| AI pictures | Pollinations.ai, Hugging Face | Cover image creation |
| Hosting | Vercel (with Vercel Analytics) | Deployment and page-view statistics |

---

## Getting started

### What you need

- **Node.js** 20.9 or later, and **npm**
- A **Firebase project** with *Anonymous Authentication* and *Realtime Database* turned on
- A **TURN server account**, such as [Metered](https://www.metered.ca/), for transfers between different networks (see below)
- *(Optional)* A **Hugging Face API key** for the picture backup

### Install and run

```bash
# 1. Get the code
git clone https://github.com/swaraj1105/ghost-drop.git
cd ghost-drop

# 2. Install dependencies
npm install

# 3. Create .env.local (see the variables below)

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Firebase setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Turn on **Authentication → Sign-in method → Anonymous**.
3. Create a **Realtime Database**, open its **Rules** tab, and publish these rules:

```json
{
  "rules": {
    // Nothing is readable or writable at the top level, so nobody can list or dump rooms
    ".read": false,
    ".write": false,

    "rooms": {
      "$roomId": {
        // Only signed-in users, and only for 6-digit room codes
        ".read": "auth != null && $roomId.matches(/^[0-9]{6}$/)",
        ".write": "auth != null && $roomId.matches(/^[0-9]{6}$/)",

        // Only the data GhostDrop actually uses, with a size limit
        "offer": {
          ".validate": "newData.hasChildren(['sdp','type']) && newData.child('sdp').isString() && newData.child('sdp').val().length < 50000"
        },
        "answer": {
          ".validate": "newData.hasChildren(['sdp','type']) && newData.child('sdp').isString() && newData.child('sdp').val().length < 50000"
        },
        "callerCandidates": { "$id": { ".validate": "newData.hasChild('candidate')" } },
        "calleeCandidates": { "$id": { ".validate": "newData.hasChild('candidate')" } },
        "$other": { ".validate": false }
      }
    }
  }
}
```

4. Register a web app in the project settings and paste its config into [`lib/firebase.ts`](lib/firebase.ts). The file currently holds the config of the hosted GhostDrop project, so replace it if you fork.

> Firebase web config values are public identifiers, not secrets. The rules above are what protect your database. Do not use the default "any signed-in user can read and write everything" rules: Firebase will warn you that they are insecure.

### TURN setup (needed across different networks)

Two devices on the same Wi-Fi can usually connect directly. Two devices on **different networks**, for example a phone on mobile data and a laptop on home Wi-Fi, often cannot, because mobile carriers and many routers block direct connections. They need a **TURN relay**, so treat this as required for transfers between networks.

1. Create a free account at [Metered](https://www.metered.ca/) and create a TURN credential.
2. Add the username and password as the environment variables below, locally in `.env.local` and on Vercel under **Settings → Environment Variables**, then **redeploy**. The values are baked in at build time, so changing them without redeploying does nothing.
3. The relay hostnames are set in [`lib/webrtcService.ts`](lib/webrtcService.ts) (`global.relay.metered.ca`). To use another provider, change them there.

Data sent through the relay stays encrypted between the two browsers. Metered's free plan includes 0.5 GB of relay traffic per month. Relay traffic is only used when a direct connection is not possible. Check your usage in the Metered dashboard.

To check that it works, open the browser console on one device and start a transfer. `ICE candidate found: relay` means the TURN server is working. A line like `ICE server problem: ... 701` means a server could not be reached, and `401` means the credentials are wrong.

> The TURN username and password reach the browser (they use the `NEXT_PUBLIC_` prefix), so anyone can read them from the site's code. Use a credential with a usage limit and replace it if it is abused.

---

## Environment variables

Create a `.env.local` file in the project root:

```env
# Hugging Face (picture backup provider)
HF_API_KEY=your_huggingface_api_key

# TURN relay (needed for transfers between different networks)
NEXT_PUBLIC_METERED_USERNAME=your_turn_username
NEXT_PUBLIC_METERED_PASSWORD=your_turn_password
```

| Variable | Where it is used | Purpose |
| --- | --- | --- |
| `HF_API_KEY` | Server only | Authenticates the Hugging Face backup request. If unset, that step is skipped. |
| `NEXT_PUBLIC_METERED_USERNAME` | Browser | TURN relay username. If missing, devices on different networks will probably fail to connect. |
| `NEXT_PUBLIC_METERED_PASSWORD` | Browser | TURN relay password. |

On Vercel, add them under **Project → Settings → Environment Variables** and redeploy.

> **Never commit `.env.local`.** It is already in `.gitignore`. `HF_API_KEY` must stay on the server and must never start with `NEXT_PUBLIC_`.

---

## Privacy and security notes

Read these before trusting GhostDrop with anything sensitive.

- **Files are encrypted in transit and never stored on a server.** WebRTC data channels are encrypted between the two browsers. If a TURN relay is used, it only forwards the encrypted traffic.
- **The connection set-up is visible to Firebase.** The room code and the technical connection details, including network addresses, are held in Firebase while a room is open and deleted when it closes. Rooms that were abandoned without a clean disconnect are not cleaned up automatically.
- **Room codes are short, not secret.** They are 6 digits. The database rules stop people from listing rooms, but anyone who guesses a code while that room is open can try to join it. Share codes only with the person you are sending to.
- **Vercel Analytics is on.** The hosted site records anonymous page-view statistics through Vercel Analytics. Remove it from `app/layout.tsx` if you do not want that.
- **Hide Secret Message is obfuscation, not encryption.** See above.

---

## Roadmap

- [x] Direct device-to-device transfer with no cloud storage
- [x] Sessions that close themselves
- [x] Large file support with progress bars
- [x] Plain-language interface with an About guide
- [x] Locked-down database rules
- [ ] Per-room ownership rules, so only the two people in a room can use it
- [ ] Automatic clean-up of abandoned rooms
- [ ] Resume a transfer after a short connection drop

---

## Contributing

Issues and pull requests are welcome. Fork the repo, create a branch, and open a pull request with a clear description of the change.
