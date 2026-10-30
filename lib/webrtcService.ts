import { db } from "./firebase";
import { ref, set, onValue, push, child, get, remove } from "firebase/database";

// --- CONFIGURATION ---
const CHUNK_SIZE = 16384; // 16KB chunks

// ✅ SECURED: Credentials pulled from Vercel Environment Variables
const turnConfig = {
  username: process.env.NEXT_PUBLIC_METERED_USERNAME || "",
  credential: process.env.NEXT_PUBLIC_METERED_PASSWORD || "",
  urls: [
    "turn:global.turn.metered.ca:443?transport=tcp",
    "turn:global.turn.metered.ca:80?transport=udp",
    "stun:stun.relay.metered.ca:80",
    "turn:global.turn.metered.ca:80?transport=tcp"
    
  ]
};

const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    turnConfig
  ],
  iceCandidatePoolSize: 10,
};

let pc: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

// Receiver Variables
let receivedChunks: ArrayBuffer[] = [];
let metadata: { name: string, size: number, type: string } | null = null;
let receivedBytes = 0;

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
 */
const GRACE_MS = 60_000; // how long the other device may stay gone (60 seconds)

export type ConnectionHealth = "connected" | "interrupted" | "failed";

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
  onConnectionHealth?: (health: ConnectionHealth) => void
) => {
  stopWatching?.();
  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

  // A dropped link is a warning first; the room only ends if the other device stays gone.
  stopWatching = watchConnection(pc, onConnectionHealth, onRoomDestroyed);

  dataChannel = pc.createDataChannel("ghost-drop");
  setupChannel(dataChannel, onChannelOpen, onFileReceived);

  const roomId = Math.floor(100000 + Math.random() * 900000).toString();
  const roomRef = ref(db, `rooms/${roomId}`);
  const callerCandidatesRef = child(roomRef, "callerCandidates");

  pc.onicecandidate = (e) => {
    if (e.candidate) push(callerCandidatesRef, e.candidate.toJSON());
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await set(roomRef, { offer: { sdp: offer.sdp, type: offer.type } });

  // ✅ FIXED: Listen for the Answer first, THEN listen for candidates.
  // This prevents the mobile race condition where candidates arrive before the answer.
  onValue(child(roomRef, "answer"), async (snapshot) => {
    const data = snapshot.val();
    if (pc && pc.signalingState === "have-local-offer" && data) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        
        // Now that RemoteDescription is set, it is safe to process ICE candidates
        onValue(child(roomRef, "calleeCandidates"), (candSnap) => {
          candSnap.forEach((c) => {
            pc?.addIceCandidate(new RTCIceCandidate(c.val())).catch(e => {});
          });
        });
      } catch (err) {
        console.warn("Ignored duplicate answer or error", err);
      }
    }
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
  onConnectionHealth?: (health: ConnectionHealth) => void
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);
  if (!roomSnapshot.exists()) throw new Error("Room not found");

  stopWatching?.();
  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

  stopWatching = watchConnection(pc, onConnectionHealth, onRoomDestroyed);

  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    setupChannel(dataChannel, onChannelOpen, onFileReceived);
  };

  const calleeCandidatesRef = child(roomRef, "calleeCandidates");
  pc.onicecandidate = (e) => {
    if (e.candidate) push(calleeCandidatesRef, e.candidate.toJSON());
  };

  await pc.setRemoteDescription(new RTCSessionDescription(roomSnapshot.val().offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await set(child(roomRef, "answer"), { sdp: answer.sdp, type: answer.type });

  onValue(child(roomRef, "callerCandidates"), (snapshot) => {
    snapshot.forEach((c) => {
      pc?.addIceCandidate(new RTCIceCandidate(c.val())).catch(e => {});
    });
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
function setupChannel(channel: RTCDataChannel, onOpen: () => void, onFileReceived: (blob: Blob, name: string) => void) {
  channel.onopen = () => {
    console.log("👻 TUNNEL OPEN");
    onOpen();
  };

  channel.onmessage = async (event) => {
    const data = event.data;

    if (typeof data === "string") {
      metadata = JSON.parse(data);
      receivedChunks = [];
      receivedBytes = 0;
      console.log(`Receiving ${metadata?.name} (${metadata?.size} bytes)`);
      return;
    }

    if (data instanceof ArrayBuffer) {
      receivedChunks.push(data);
      receivedBytes += data.byteLength;

      if (metadata && receivedBytes >= metadata.size) {
        const fileBlob = new Blob(receivedChunks);
        onFileReceived(fileBlob, metadata.name);
        receivedChunks = [];
        metadata = null;
        receivedBytes = 0;
      }
    }
  };
}

/**
 * 3. PUBLIC: Send File (Streaming Mode)
 */
export const sendFile = async (file: File) => {
  if (!dataChannel || dataChannel.readyState !== "open") {
    throw new Error("Connection is not open");
  }

  const meta = JSON.stringify({ name: file.name, size: file.size, type: file.type });
  dataChannel.send(meta);

  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    
    // Backpressure control: Don't flood the channel
    if (dataChannel.bufferedAmount > 16 * 1024 * 1024) {
        await new Promise(r => setTimeout(r, 100));
    }
    
    dataChannel.send(buffer);
    offset += CHUNK_SIZE;
  }
};

/**
 * 4. CLEANUP: Self-Destruct Room
 */
export const destroyRoom = async (roomId: string) => {
  if (!roomId) return;
  
  // Stop the grace-period watcher so no timer outlives the room
  stopWatching?.();
  stopWatching = null;

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