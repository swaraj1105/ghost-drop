import { db } from "./firebase";
import { ref, set, onValue, push, child, get, off } from "firebase/database";

// Configuration
const CHUNK_SIZE = 16384; // 16KB chunks (Safe for all browsers)

const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

let pc: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

// Variables to re-assemble the file
let incomingBuffer: string[] = [];
let expectedChunks = 0;

/**
 * 1. SENDER: Creates a Room
 */
export const createRoom = async (onChannelOpen: () => void, onMessage: (data: any) => void) => {
  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

  dataChannel = pc.createDataChannel("ghost-drop");
  setupChannel(dataChannel, onChannelOpen, onMessage);

  const roomId = Math.floor(100000 + Math.random() * 900000).toString();
  const roomRef = ref(db, `rooms/${roomId}`);
  const callerCandidatesRef = child(roomRef, "callerCandidates");

  pc.onicecandidate = (event) => {
    if (event.candidate) push(callerCandidatesRef, event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
  await set(roomRef, { offer });

  // 🔴 FIX: Listen ONLY to the "answer" node, not the whole room
  onValue(child(roomRef, "answer"), (snapshot) => {
    const data = snapshot.val();
    
    // 🔴 FIX: Strict State Check - Only proceed if we are waiting for an answer
    if (pc && pc.signalingState === "have-local-offer" && data) {
      const answerDescription = new RTCSessionDescription(data);
      pc.setRemoteDescription(answerDescription).catch((e) => console.log("Already connected, ignoring duplicate answer."));
    }
  });

  onValue(child(roomRef, "calleeCandidates"), (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const candidate = new RTCIceCandidate(childSnapshot.val());
      pc?.addIceCandidate(candidate).catch((e) => {});
    });
  });

  return roomId;
};

/**
 * 2. RECEIVER: Joins a Room
 */
export const joinRoom = async (roomId: string, onChannelOpen: () => void, onMessage: (data: any) => void) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnapshot = await get(roomRef);

  if (!roomSnapshot.exists()) throw new Error("Room does not exist");

  if (pc) pc.close();
  pc = new RTCPeerConnection(servers);

  pc.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupChannel(dataChannel, onChannelOpen, onMessage);
  };

  const calleeCandidatesRef = child(roomRef, "calleeCandidates");
  
  pc.onicecandidate = (event) => {
    if (event.candidate) push(calleeCandidatesRef, event.candidate.toJSON());
  };

  const offer = roomSnapshot.val().offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
  await set(child(roomRef, "answer"), answer);

  onValue(child(roomRef, "callerCandidates"), (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const candidate = new RTCIceCandidate(childSnapshot.val());
      pc?.addIceCandidate(candidate).catch((e) => {});
    });
  });
};

/**
 * HELPER: Handle Data Channel Events (With Re-assembly Logic)
 */
function setupChannel(channel: RTCDataChannel, onOpen: () => void, onMessage: (data: any) => void) {
  channel.onopen = () => {
    console.log("👻 TUNNEL ESTABLISHED");
    onOpen();
  };

  channel.onmessage = (event) => {
    const data = event.data;
    
    // Header Check
    try {
        if (typeof data === 'string' && data.startsWith("HEAD:")) {
            expectedChunks = parseInt(data.split(":")[1]);
            incomingBuffer = [];
            console.log(`Receiving file in ${expectedChunks} chunks...`);
            return;
        }
    } catch (e) {}

    incomingBuffer.push(data);

    if (incomingBuffer.length === expectedChunks) {
        console.log("File re-assembled!");
        const fullFile = incomingBuffer.join("");
        onMessage(fullFile);
        incomingBuffer = [];
        expectedChunks = 0;
    }
  };
}

/**
 * 3. PUBLIC: Send Data (With Chunking)
 */
export const sendData = (data: string) => {
  if (dataChannel && dataChannel.readyState === "open") {
    
    // 1. Calculate chunks
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
    
    // 2. Send Header
    dataChannel.send(`HEAD:${totalChunks}`);

    // 3. Send Chunks
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        dataChannel.send(chunk);
    }

  } else {
    console.error("Connection not open");
  }
};