import { db } from "./firebase";
import { ref, set, onValue, push, child, get, off, remove } from "firebase/database";

// --- CONFIGURATION ---
const CHUNK_SIZE = 16384; // 16KB chunks

// 🔴 TODO: PASTE YOUR METERED KEYS HERE
const turnConfig = {
  username: "PASTE_YOUR_USERNAME_HERE",
  credential: "PASTE_YOUR_PASSWORD_HERE",
  urls: [
    "stun:stun.relay.metered.ca:80",
    "turn:global.turn.metered.ca:80?transport=udp",
    "turn:global.turn.metered.ca:80?transport=tcp",
    "turn:global.turn.metered.ca:443?transport=tcp"
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
 * 1. SENDER: Creates a Room
 */
export const createRoom = async (
  onChannelOpen: () => void, 
  onFileReceived: (blob: Blob, name: string) => void,
  onRoomDestroyed: () => void // <--- NEW CALLBACK
) => {
  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

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

  onValue(child(roomRef, "answer"), (snapshot) => {
    const data = snapshot.val();
    if (pc && pc.signalingState === "have-local-offer" && data) {
      pc.setRemoteDescription(new RTCSessionDescription(data)).catch(e => console.log("Ignore duplicate answer"));
    }
  });

  onValue(child(roomRef, "calleeCandidates"), (snapshot) => {
    snapshot.forEach((c) => {
      pc?.addIceCandidate(new RTCIceCandidate(c.val())).catch(e => {});
    });
  });

  // 🔴 NEW: Watch if the room gets destroyed (by Receiver)
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
  onRoomDestroyed: () => void // <--- NEW CALLBACK
) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);
  if (!roomSnapshot.exists()) throw new Error("Room not found");

  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

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

  // 🔴 NEW: Watch for Room Destruction
  onValue(roomRef, (snapshot) => {
    // If snapshot becomes null/doesn't exist, the Sender deleted the room
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
  if (!dataChannel || dataChannel.readyState !== "open") return;

  const meta = JSON.stringify({ name: file.name, size: file.size, type: file.type });
  dataChannel.send(meta);

  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    
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
  
  if (pc) {
    pc.close();
    pc = null;
  }
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  const roomRef = ref(db, `rooms/${roomId}`);
  await remove(roomRef);
  console.log(`💥 Room ${roomId} destroyed.`);
};