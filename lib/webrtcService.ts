import { db } from "./firebase";
import { ref, set, onValue, onChildAdded, push, child, get, off, remove } from "firebase/database";

// --- CONFIGURATION ---
const CHUNK_SIZE = 16384; // 16KB chunks
const MAX_BUFFERED = 4 * 1024 * 1024; // pause sending when more than 4 MB is waiting to go out
const RESUME_BELOW = 1 * 1024 * 1024; // ...and carry on once that has drained below 1 MB

// --- RELAY (TURN) SERVER ---
// Two devices on different networks (e.g. a phone on mobile data and a laptop
// on Wi-Fi) usually can't reach each other directly. A TURN server relays the
// traffic for them. Without a working one, those connections fail.
//
// Set these in Vercel (Project > Settings > Environment Variables) and redeploy:
//   NEXT_PUBLIC_METERED_USERNAME
//   NEXT_PUBLIC_METERED_PASSWORD
// Hostnames below are the ones Metered documents (global.relay.metered.ca).
const TURN_USERNAME = process.env.NEXT_PUBLIC_METERED_USERNAME;
const TURN_PASSWORD = process.env.NEXT_PUBLIC_METERED_PASSWORD;

const iceServers: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.relay.metered.ca:80",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  },
];

if (TURN_USERNAME && TURN_PASSWORD) {
  iceServers.push({
    urls: [
      "turn:global.relay.metered.ca:80",
      "turn:global.relay.metered.ca:80?transport=tcp",
      "turn:global.relay.metered.ca:443",
      "turns:global.relay.metered.ca:443?transport=tcp", // TLS on 443: gets through strict firewalls
    ],
    username: TURN_USERNAME,
    credential: TURN_PASSWORD,
  });
} else {
  // Don't crash: browsers refuse to start a connection if a TURN entry has no credentials.
  console.warn(
    "GhostDrop: TURN credentials are missing (NEXT_PUBLIC_METERED_USERNAME / NEXT_PUBLIC_METERED_PASSWORD). " +
    "Connections between devices on different networks will probably fail."
  );
}

const servers: RTCConfiguration = {
  iceServers,
  iceCandidatePoolSize: 10,
};

let pc: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

// --- Transfer progress (shown by the UI) ---
export type TransferProgress = {
  direction: "send" | "receive";
  name: string;
  done: number;             // bytes finished so far
  total: number;            // size of the file in bytes
  mode?: "disk" | "memory"; // receiving only: where the incoming file is being kept
  error?: string;           // receiving only: set when the file could not be saved
};

// --- Receiving ---
// Incoming data is NOT kept as thousands of loose chunks in memory. It is grouped
// into ~1 MB pieces and, where the browser allows it, written straight to the
// browser's private file storage (OPFS) on the device's disk. Browsers without
// that fall back to memory, where pieces are kept as Blobs (browsers can park
// those on disk too) rather than as JS buffers.
const RX_FLUSH_BYTES = 1 * 1024 * 1024;
const RX_DIR = "ghostdrop-incoming";
const PROGRESS_EVERY_MS = 100;

type Incoming = {
  name: string;
  size: number;
  type: string;
  received: number;
  pending: ArrayBuffer[];
  pendingBytes: number;
  parts: Blob[];                       // memory mode
  handle: any | null;                  // disk mode: FileSystemFileHandle
  writer: any | null;                  // disk mode: FileSystemWritableFileStream
  mode: "disk" | "memory";
  lastReport: number;
  failed: boolean;
};
type RxCallbacks = {
  onFileReceived: (blob: Blob, name: string) => void;
  onProgress?: (p: TransferProgress) => void;
};

let incoming: Incoming | null = null;
// Messages are handled strictly one after another, because writing to disk is async
// and the file pieces must land in order.
let rxQueue: Promise<void> = Promise.resolve();

async function openDiskFile(): Promise<{ handle: any; writer: any } | null> {
  try {
    const storage = (navigator as any).storage;
    if (!storage || typeof storage.getDirectory !== "function") return null;
    const root = await storage.getDirectory();
    const dir = await root.getDirectoryHandle(RX_DIR, { create: true });
    const handle = await dir.getFileHandle(`${Date.now()}-${Math.random().toString(36).slice(2)}`, { create: true });
    if (typeof handle.createWritable !== "function") return null;
    const writer = await handle.createWritable();
    return { handle, writer };
  } catch {
    return null; // not supported here (or private mode): use memory instead
  }
}

// Deletes every file we have parked on disk. Safe to call any time nothing is mid-transfer.
async function clearDiskFiles() {
  try {
    const storage = (navigator as any).storage;
    if (!storage || typeof storage.getDirectory !== "function") return;
    const root = await storage.getDirectory();
    await root.removeEntry(RX_DIR, { recursive: true });
  } catch {}
}

function reportIncoming(inc: Incoming, cb: RxCallbacks, force: boolean) {
  const now = Date.now();
  if (!force && now - inc.lastReport < PROGRESS_EVERY_MS) return;
  inc.lastReport = now;
  cb.onProgress?.({
    direction: "receive",
    name: inc.name,
    done: Math.min(inc.received, inc.size),
    total: inc.size,
    mode: inc.mode,
    error: inc.failed ? "This file could not be saved. The device may be out of space." : undefined,
  });
}

async function flushIncoming(inc: Incoming) {
  if (inc.pending.length === 0) return;
  const piece = new Blob(inc.pending);
  inc.pending = [];
  inc.pendingBytes = 0;
  if (inc.mode === "disk" && inc.writer) {
    await inc.writer.write(piece);
  } else {
    inc.parts.push(piece);
  }
}

async function abortIncoming() {
  const inc = incoming;
  incoming = null;
  if (inc?.writer) {
    try { await inc.writer.abort(); } catch {}
  }
}

async function finishIncoming(inc: Incoming, cb: RxCallbacks) {
  await flushIncoming(inc);
  let file: Blob;
  if (inc.mode === "disk" && inc.writer) {
    await inc.writer.close();
    file = await inc.handle.getFile(); // a File backed by the disk, not by memory
  } else {
    file = new Blob(inc.parts, { type: inc.type });
  }
  incoming = null;
  inc.received = inc.size;
  reportIncoming(inc, cb, true);
  cb.onFileReceived(file, inc.name);
}

async function handleIncomingMessage(data: unknown, cb: RxCallbacks) {
  if (typeof data === "string") {
    let meta: any;
    try { meta = JSON.parse(data); } catch { return; }
    if (!meta || typeof meta.name !== "string" || typeof meta.size !== "number" || !(meta.size >= 0)) return;

    await abortIncoming(); // a new file is starting: drop anything half-finished
    const disk = meta.size > 0 ? await openDiskFile() : null;
    const inc: Incoming = {
      name: meta.name,
      size: meta.size,
      type: typeof meta.type === "string" ? meta.type : "",
      received: 0,
      pending: [],
      pendingBytes: 0,
      parts: [],
      handle: disk?.handle ?? null,
      writer: disk?.writer ?? null,
      mode: disk ? "disk" : "memory",
      lastReport: 0,
      failed: false,
    };
    incoming = inc;
    console.log(`Receiving ${inc.name} (${inc.size} bytes, kept in ${inc.mode})`);
    reportIncoming(inc, cb, true);
    // An empty file sends no data at all, so it is complete as soon as we know about it.
    if (inc.size === 0) await finishIncoming(inc, cb);
    return;
  }

  if (data instanceof ArrayBuffer) {
    const inc = incoming;
    if (!inc || inc.failed) return;
    inc.pending.push(data);
    inc.pendingBytes += data.byteLength;
    inc.received += data.byteLength;
    try {
      if (inc.received >= inc.size) {
        await finishIncoming(inc, cb);
        return;
      }
      if (inc.pendingBytes >= RX_FLUSH_BYTES) await flushIncoming(inc);
    } catch (e) {
      console.error("Could not save incoming file", e);
      inc.failed = true;
      inc.pending = [];
      if (inc.writer) { try { await inc.writer.abort(); } catch {} inc.writer = null; }
      reportIncoming(inc, cb, true);
      return;
    }
    reportIncoming(inc, cb, false);
  }
}

/**
 * NETWORK CANDIDATES (how two devices find a path to each other)
 *
 * Each device publishes "candidates" (possible network addresses) through
 * Firebase. The other device must add them to its connection, but the browser
 * REJECTS a candidate that arrives before the other side's description (the
 * offer/answer) has been applied. The receiver publishes its candidates just
 * BEFORE its answer, so the sender sees candidates first. If those were thrown
 * away, the sender would never learn where to reach the receiver, and a device
 * behind a strict NAT (typically a phone on mobile data) could not connect.
 *
 * So: hold early candidates here, and add them as soon as the description is set.
 */
let pendingCandidates: RTCIceCandidateInit[] = [];

function addRemoteCandidate(candidate: RTCIceCandidateInit | null) {
  if (!pc || !candidate) return;
  if (!pc.remoteDescription) {
    pendingCandidates.push(candidate);
    return;
  }
  pc.addIceCandidate(candidate).catch((e) => console.warn("Could not add ICE candidate:", e));
}

function flushPendingCandidates() {
  const queued = pendingCandidates;
  pendingCandidates = [];
  queued.forEach(addRemoteCandidate);
}

// Shows in the browser console when a STUN/TURN server can't be used.
// 701 = couldn't reach that server (wrong hostname, blocked port), 401 = wrong credentials.
function logIceServerError(e: Event) {
  const err = e as RTCPeerConnectionIceErrorEvent;
  console.warn(`ICE server problem: ${err.url} -> ${err.errorCode} ${err.errorText}`);
}

/**
 * ROOM LIFETIME RULES
 *
 * A room ends when:
 *   1. someone presses Terminate, or
 *   2. someone refreshes the page, or
 *   3. the other device stays gone for longer than GRACE_MS (it was closed).
 *
 * Briefly switching to another app (backgrounding) does NOT end the room: the
 * link is allowed to drop and come back within the grace period.
 *
 * Why a timer? When an app is swiped away the browser gives the page no
 * warning, and from the outside that looks the same as the app being
 * backgrounded. The only reliable difference is time: a backgrounded app
 * comes back, a closed one doesn't.
 */
const GRACE_MS = 60_000; // how long the other device may stay gone (60 seconds)

/**
 * Connection health, reported to the UI.
 *  - "interrupted": the link dropped (e.g. the other phone was backgrounded). It may come back.
 *  - "failed":      the link is down hard; it may still come back, but not for long.
 *  - "connected":   the link came back after an interruption.
 *  - "unreachable": the two devices never managed to connect at all (usually
 *                   because their networks block direct links and no relay worked).
 */
export type ConnectionHealth = "connected" | "interrupted" | "failed" | "unreachable";

let stopWatching: (() => void) | null = null;

/**
 * Watches a peer connection. Reports drops/recoveries through onChange and, if
 * the other device is still gone after GRACE_MS, calls onGiveUp (= treat it as closed).
 * Returns a function that stops watching.
 */
function watchConnection(
  conn: RTCPeerConnection,
  onChange: ((health: ConnectionHealth) => void) | undefined,
  onGiveUp: () => void
) {
  let wasInterrupted = false;
  let everConnected = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stopTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timer = setTimeout(() => {
      timer = null;
      // If THIS device is the one in the background, the other side didn't
      // leave. Keep waiting until we're visible again instead of giving up.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        startTimer();
        return;
      }
      onGiveUp();
    }, GRACE_MS);
  };

  // Coming back to the app after being away gets a fresh grace window.
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && wasInterrupted) startTimer();
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  conn.oniceconnectionstatechange = () => {
    const state = conn.iceConnectionState;
    if (state === "connected" || state === "completed") everConnected = true;

    // Never connected in the first place: there is no "other device coming back"
    // to wait for, so don't run the grace timer. Just tell the user.
    if (state === "failed" && !everConnected) {
      onChange?.("unreachable");
      return;
    }

    if (state === "disconnected" || state === "failed") {
      // The grace period counts from the FIRST sign of trouble.
      if (!wasInterrupted) startTimer();
      wasInterrupted = true;
      onChange?.(state === "failed" ? "failed" : "interrupted");
    } else if ((state === "connected" || state === "completed") && wasInterrupted) {
      // Came back in time: the room lives.
      wasInterrupted = false;
      stopTimer();
      onChange?.("connected");
    }
  };

  return () => {
    stopTimer();
    conn.oniceconnectionstatechange = null;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

/**
 * 1. SENDER: Creates a Room
 */
export const createRoom = async (
  onChannelOpen: () => void,
  onFileReceived: (blob: Blob, name: string) => void,
  onRoomDestroyed: () => void,
  onConnectionHealth?: (health: ConnectionHealth) => void,
  onProgress?: (p: TransferProgress) => void
) => {
  stopWatching?.();
  if (pc) pc.close();
  pendingCandidates = [];
  pc = new RTCPeerConnection(servers);

  // A dropped link is a warning first; the room only ends if the other device stays gone.
  stopWatching = watchConnection(pc, onConnectionHealth, onRoomDestroyed);

  dataChannel = pc.createDataChannel("ghost-drop");
  setupChannel(dataChannel, onChannelOpen, onFileReceived, onProgress);

  const roomId = Math.floor(100000 + Math.random() * 900000).toString();
  const roomRef = ref(db, `rooms/${roomId}`);
  const callerCandidatesRef = child(roomRef, "callerCandidates");

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log(`ICE candidate found: ${e.candidate.type}`); // "relay" = the TURN server works
      push(callerCandidatesRef, e.candidate.toJSON());
    }
  };
  pc.onicecandidateerror = logIceServerError;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  // Write ONLY the offer node. (Replacing the whole room would wipe out any
  // candidates that were already published.)
  await set(child(roomRef, "offer"), { sdp: offer.sdp, type: offer.type });

  onValue(child(roomRef, "answer"), async (snapshot) => {
    const data = snapshot.val();
    if (pc && pc.signalingState === "have-local-offer" && data) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        // Now that the answer is applied, add the candidates that arrived early.
        flushPendingCandidates();
      } catch (e) {
        console.log("Ignore duplicate answer");
      }
    }
  });

  // onChildAdded delivers each candidate exactly once, in order.
  onChildAdded(child(roomRef, "calleeCandidates"), (snapshot) => {
    addRemoteCandidate(snapshot.val());
  });

  // Watch if the room gets destroyed (by Receiver via Firebase)
  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
       onRoomDestroyed();
    }
  });

  return roomId;
};

/**
 * 2. RECEIVER: Joins a Room
 */
export const joinRoom = async (
  roomId: string,
  onChannelOpen: () => void,
  onFileReceived: (blob: Blob, name: string) => void,
  onRoomDestroyed: () => void,
  onConnectionHealth?: (health: ConnectionHealth) => void,
  onProgress?: (p: TransferProgress) => void
) => {
  void clearDiskFiles(); // leftovers from an earlier session
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);
  if (!roomSnapshot.exists()) throw new Error("Room not found");

  stopWatching?.();
  if (pc) pc.close();
  pendingCandidates = [];
  pc = new RTCPeerConnection(servers);

  // A dropped link is a warning first; the room only ends if the other device stays gone.
  stopWatching = watchConnection(pc, onConnectionHealth, onRoomDestroyed);

  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    setupChannel(dataChannel, onChannelOpen, onFileReceived, onProgress);
  };

  const calleeCandidatesRef = child(roomRef, "calleeCandidates");
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log(`ICE candidate found: ${e.candidate.type}`); // "relay" = the TURN server works
      push(calleeCandidatesRef, e.candidate.toJSON());
    }
  };
  pc.onicecandidateerror = logIceServerError;

  await pc.setRemoteDescription(new RTCSessionDescription(roomSnapshot.val().offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await set(child(roomRef, "answer"), { sdp: answer.sdp, type: answer.type });

  // The offer is already applied here, so these are added straight away.
  onChildAdded(child(roomRef, "callerCandidates"), (snapshot) => {
    addRemoteCandidate(snapshot.val());
  });

  // Watch for Room Destruction (via Firebase)
  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
       onRoomDestroyed();
    }
  });
};

/**
 * HELPER: Handle Data Stream
 */
function setupChannel(channel: RTCDataChannel, onOpen: () => void, onFileReceived: (blob: Blob, name: string) => void, onProgress?: (p: TransferProgress) => void) {
  const cb: RxCallbacks = { onFileReceived, onProgress };
  // Some browsers deliver binary data as a Blob by default; the receiving code
  // below expects an ArrayBuffer, so say so explicitly.
  channel.binaryType = "arraybuffer";

  channel.onopen = () => {
    console.log("👻 TUNNEL OPEN");
    onOpen();
  };

  channel.onmessage = (event) => {
    const data = event.data;
    rxQueue = rxQueue
      .then(() => handleIncomingMessage(data, cb))
      .catch((e) => console.error("Receive error", e));
  };

  // If the link drops mid-file, throw away the unfinished piece.
  channel.addEventListener("close", () => {
    rxQueue = rxQueue.then(abortIncoming).catch(() => {});
  });
}

/**
 * 3. PUBLIC: Send File (Streaming Mode)
 */
export const sendFile = async (file: File, onProgress?: (p: TransferProgress) => void) => {
  // Throw (don't silently return) so the UI can say "Transfer Interrupted"
  // instead of "All Transfers Complete" when the link is down.
  const channel = dataChannel;
  if (!channel || channel.readyState !== "open") {
    throw new Error("Connection is not open");
  }

  const meta = JSON.stringify({ name: file.name, size: file.size, type: file.type });
  channel.send(meta);

  let lastReport = 0;
  const report = (force: boolean) => {
    if (!onProgress) return;
    const now = Date.now();
    if (!force && now - lastReport < PROGRESS_EVERY_MS) return;
    lastReport = now;
    // Bytes still queued in the channel have not reached the other device yet.
    const delivered = force && offset >= file.size && channel.bufferedAmount === 0
      ? file.size
      : Math.max(0, Math.min(offset, file.size) - channel.bufferedAmount);
    onProgress({ direction: "send", name: file.name, done: delivered, total: file.size });
  };

  let offset = 0;
  report(true);
  while (offset < file.size) {
    // Backpressure: reading a file is far faster than the network can carry it,
    // so the channel's send buffer fills up. If it overflows (browsers cap it at
    // about 16 MB) the browser closes the channel and the transfer dies.
    // So pause here, and carry on only once the buffer has drained.
    if (channel.bufferedAmount > MAX_BUFFERED) {
      await waitForBufferBelow(channel, RESUME_BELOW);
    }

    const buffer = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
    channel.send(buffer);
    offset += CHUNK_SIZE;
    report(false);
  }

  // Everything has been handed to the channel, but it may still be queued.
  // Wait until it has really left before reporting success, otherwise a
  // "complete" message could appear while the end of the file is still on its way.
  await waitForBufferBelow(channel, 0);
  report(true);
};

/**
 * Resolves once the channel's send buffer is at or below `limit` bytes.
 * Rejects if the channel closes first, so the caller can report an interrupted transfer.
 */
function waitForBufferBelow(channel: RTCDataChannel, limit: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (channel.readyState !== "open") {
      reject(new Error("Connection closed during transfer"));
      return;
    }
    if (channel.bufferedAmount <= limit) {
      resolve();
      return;
    }

    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", onLow);
      channel.removeEventListener("close", onClosed);
      channel.removeEventListener("error", onClosed);
    };
    const onLow = () => {
      cleanup();
      resolve();
    };
    const onClosed = () => {
      cleanup();
      reject(new Error("Connection closed during transfer"));
    };

    channel.bufferedAmountLowThreshold = limit;
    channel.addEventListener("bufferedamountlow", onLow);
    channel.addEventListener("close", onClosed);
    channel.addEventListener("error", onClosed);
  });
}

/**
 * 4. CLEANUP: Self-Destruct Room
 */
export const destroyRoom = async (roomId: string) => {
  if (!roomId) return;
  
  // Stop the grace-period watcher so no timer outlives the room
  stopWatching?.();
  stopWatching = null;
  pendingCandidates = [];

  // Drop any half-received file and delete received files parked on this device's disk
  rxQueue = rxQueue.then(abortIncoming).then(clearDiskFiles).catch(() => {});

  // Close local connections immediately
  if (pc) {
    pc.close();
    pc = null;
  }
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  // Remove room from Firebase (triggers onRoomDestroyed for the other peer)
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
      await remove(roomRef);
      console.log(`💥 Room ${roomId} destroyed.`);
  } catch (e) {
      console.warn("Room already deleted or network error");
  }
};