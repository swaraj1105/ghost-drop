"use client";

import React, { useState, useRef, ChangeEvent } from "react";
// Make sure to run: npm install react-qr-code
import QRCode from "react-qr-code"; 
import { createRoom, joinRoom, sendData } from "@/lib/webrtcService";
import { 
  Radio, Signal, Upload, Lock, Unlock, Zap, 
  Image as ImageIcon, ArrowRight, CheckCircle2, 
  Copy, Check, ArrowLeft, FileUp, Download, ShieldCheck
} from "lucide-react";

export default function GhostPage() {
  const [activeTab, setActiveTab] = useState<"GHOST_DROP" | "STEGANOGRAPHY">("GHOST_DROP");
  const [transferMode, setTransferMode] = useState<"IDLE" | "SEND" | "RECEIVE">("IDLE");

  // --- WEBRTC STATE ---
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  const [incomingFile, setIncomingFile] = useState<{name: string, data: string} | null>(null);
  
  // --- UI STATE (NEW) ---
  const [isCopied, setIsCopied] = useState(false);

  // --- STEGANOGRAPHY STATE ---
  const [stegMode, setStegMode] = useState<"ENCODE" | "DECODE">("ENCODE");
  const [secretMessage, setSecretMessage] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HELPER: COPY FUNCTION (NEW) ---
  const copyToClipboard = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- SENDER LOGIC ---
  const startBroadcast = async () => {
    setTransferMode("SEND");
    setStatus("Generating Secure Frequency...");
    try {
      const id = await createRoom(
        () => {
          setStatus("Peer Connected. Tunnel Open.");
          setIsConnected(true);
        },
        (data) => console.log("Received:", data)
      );
      setRoomId(id);
      setStatus("Waiting for Receiver...");
    } catch (e) {
      console.error(e);
      setStatus("Connection Error");
    }
  };

  const handleFileDrop = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isConnected) return;

    setStatus(`Encrypting ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      sendData(JSON.stringify({ name: file.name, data: base64Data }));
      setStatus("File Sent Successfully.");
    };
    reader.readAsDataURL(file);
  };

  // --- RECEIVER LOGIC ---
  const tuneFrequency = async () => {
    if (!roomId) return;
    setStatus(`Connecting to ${roomId}...`);
    try {
      await joinRoom(
        roomId,
        () => {
          setStatus("Connected to Source.");
          setIsConnected(true);
        },
        (rawData) => {
          setStatus("Receiving Data...");
          const payload = JSON.parse(rawData);
          setIncomingFile(payload);
          setStatus("Transfer Complete.");
        }
      );
    } catch (err) {
      alert("Invalid Room ID");
      setStatus("Connection Failed");
    }
  };

  const downloadReceivedFile = () => {
    if (!incomingFile) return;
    const link = document.createElement("a");
    link.href = incomingFile.data;
    link.download = incomingFile.name;
    link.click();
  };

  // --- STEGANOGRAPHY LOGIC ---
  const handleStegUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setDecodedMessage("");
      };
      reader.readAsDataURL(file);
    }
  };

  const processSteganography = () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    const img = new Image();
    img.src = selectedImage;
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (stegMode === "ENCODE") {
             let binaryMessage = "";
             for (let i = 0; i < secretMessage.length; i++) {
                 binaryMessage += secretMessage.charCodeAt(i).toString(2).padStart(8, "0");
             }
             binaryMessage += "00000000"; 

             if (binaryMessage.length > (data.length / 4) * 3) {
                 alert("Message too long");
                 setIsProcessing(false);
                 return;
             }

             let bitIndex = 0;
             for (let i = 0; i < data.length; i += 4) {
                 if (bitIndex >= binaryMessage.length) break;
                 for (let j = 0; j < 3; j++) {
                     if (bitIndex < binaryMessage.length) {
                         data[i + j] = (data[i + j] & 254) | parseInt(binaryMessage[bitIndex]);
                         bitIndex++;
                     }
                 }
             }
             ctx.putImageData(imageData, 0, 0);
             const link = document.createElement("a");
             link.download = "ghost_artifact.png";
             link.href = canvas.toDataURL("image/png");
             link.click();
        } else {
             let binaryMessage = "";
             let decoded = "";
             for (let i = 0; i < data.length; i += 4) {
                 for (let j = 0; j < 3; j++) {
                     binaryMessage += (data[i + j] & 1).toString();
                 }
             }
             for (let i = 0; i < binaryMessage.length; i += 8) {
                 const byte = binaryMessage.slice(i, i + 8);
                 if (byte === "00000000") break;
                 decoded += String.fromCharCode(parseInt(byte, 2));
             }
             setDecodedMessage(decoded);
        }
        setIsProcessing(false);
    };
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-6 md:p-12 selection:bg-indigo-500/30">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-8 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Ghost Dashboard</h1>
              <p className="text-sm text-neutral-500">Secure Communications Suite v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-neutral-900 rounded-full border border-neutral-800 text-emerald-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            ENCRYPTED
          </div>
        </header>

        <div className="flex justify-center">
          <div className="inline-flex bg-neutral-900/50 backdrop-blur-sm p-1 rounded-lg border border-neutral-800">
            <button onClick={() => setActiveTab("GHOST_DROP")} className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "GHOST_DROP" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400"}`}>GhostDrop</button>
            <button onClick={() => setActiveTab("STEGANOGRAPHY")} className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "STEGANOGRAPHY" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400"}`}>Steganography</button>
          </div>
        </div>

        <main className="transition-all duration-300 ease-in-out">
          {activeTab === "GHOST_DROP" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {transferMode === "IDLE" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <button onClick={startBroadcast} className="group relative overflow-hidden rounded-2xl bg-neutral-900/40 border border-neutral-800 p-8 text-left hover:border-indigo-500/50 transition-all">
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center mb-6 text-indigo-400"><Radio className="w-6 h-6" /></div>
                      <h3 className="text-xl font-medium text-white mb-2">Broadcast Signal</h3>
                      <p className="text-neutral-400 text-sm">Create a secure P2P tunnel.</p>
                    </div>
                  </button>
                  <button onClick={() => setTransferMode("RECEIVE")} className="group relative overflow-hidden rounded-2xl bg-neutral-900/40 border border-neutral-800 p-8 text-left hover:border-violet-500/50 transition-all">
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center mb-6 text-violet-400"><Signal className="w-6 h-6" /></div>
                      <h3 className="text-xl font-medium text-white mb-2">Tune Frequency</h3>
                      <p className="text-neutral-400 text-sm">Connect using a room code.</p>
                    </div>
                  </button>
                </div>
              )}

              {transferMode === "SEND" && (
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm text-center">
                   <button onClick={() => setTransferMode("IDLE")} className="flex items-center text-xs font-medium text-neutral-500 hover:text-white mb-6"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                   <h2 className="text-2xl font-semibold text-white mb-2">Broadcasting Signal</h2>
                   <p className="text-indigo-400 text-sm mb-6 font-mono">{status}</p>
                   {roomId && (
                     <div className="mb-8 flex flex-col items-center gap-4">
                       <div className="bg-white p-4 rounded-xl"><QRCode value={roomId} size={150} /></div>
                       
                       {/* --- NEW COPY BUTTON CODE START --- */}
                       <button 
                         onClick={copyToClipboard}
                         className="group bg-neutral-950 px-6 py-3 rounded-lg border border-neutral-800 flex items-center gap-4 hover:border-emerald-500/50 transition-all cursor-pointer"
                       >
                         <span className="text-3xl font-mono tracking-widest text-emerald-400">{roomId}</span>
                         <div className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors">
                            {isCopied ? <Check size={20} /> : <Copy size={20} />}
                         </div>
                       </button>
                       {/* --- NEW COPY BUTTON CODE END --- */}
                       
                     </div>
                   )}
                   <div className="relative group max-w-md mx-auto">
                      <input type="file" onChange={handleFileDrop} disabled={!isConnected} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`border-2 border-dashed rounded-xl p-12 transition-all ${isConnected ? "border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer" : "border-neutral-800 opacity-50 cursor-not-allowed"}`}>
                          <FileUp className={`w-10 h-10 mx-auto mb-4 ${isConnected ? "text-emerald-500" : "text-neutral-600"}`} />
                          <p className="text-neutral-300 font-medium">{isConnected ? "Drop File to Send" : "Waiting for Connection..."}</p>
                      </div>
                   </div>
                </div>
              )}

              {transferMode === "RECEIVE" && (
                 <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm max-w-xl mx-auto">
                    <button onClick={() => setTransferMode("IDLE")} className="flex items-center text-xs font-medium text-neutral-500 hover:text-white mb-6"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-white">Tune Frequency</h2>
                      <p className="text-violet-400 text-sm mt-2">{status}</p>
                    </div>
                    {!incomingFile ? (
                      <div className="space-y-4">
                          <input type="text" placeholder="Enter 6-digit Code" onChange={(e) => setRoomId(e.target.value)} value={roomId} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center text-lg tracking-widest font-mono text-white focus:outline-none focus:border-violet-500"/>
                          <button onClick={tuneFrequency} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg">Connect to Tunnel</button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                              <p className="text-white font-medium">File Received</p>
                              <p className="text-sm text-neutral-400">{incomingFile.name}</p>
                          </div>
                          <button onClick={downloadReceivedFile} className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download File</button>
                      </div>
                    )}
                 </div>
              )}
            </div>
          )}

          {/* STEGANOGRAPHY TAB */}
          {activeTab === "STEGANOGRAPHY" && (
             <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="border-b border-neutral-800 px-6 py-4 flex gap-6">
                 <button onClick={() => { setStegMode("ENCODE"); setSelectedImage(null); setFileName("") }} className={`text-sm font-medium transition-colors ${stegMode === "ENCODE" ? "text-indigo-400" : "text-neutral-500"}`}>Encode (Hide)</button>
                 <button onClick={() => { setStegMode("DECODE"); setSelectedImage(null); setFileName("") }} className={`text-sm font-medium transition-colors ${stegMode === "DECODE" ? "text-indigo-400" : "text-neutral-500"}`}>Decode (Reveal)</button>
               </div>
               <div className="p-6 md:p-8 grid md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                   <div className="space-y-3">
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{stegMode === "ENCODE" ? "1. Source Image" : "1. Encrypted Image"}</label>
                     <div className="relative group">
                       <input type="file" accept="image/*" onChange={handleStegUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                       <div className={`border border-dashed rounded-xl p-8 text-center transition-all ${selectedImage ? "border-indigo-500/50 bg-indigo-500/5" : "border-neutral-700 bg-neutral-900/50"}`}>
                         {selectedImage ? <div className="flex flex-col items-center gap-2"><ImageIcon className="w-8 h-8 text-indigo-400" /><span className="text-sm font-medium text-white">{fileName}</span></div> : <div className="flex flex-col items-center gap-2 text-neutral-500"><Upload className="w-8 h-8 mb-2" /><span className="text-sm font-medium">Drop image here</span></div>}
                       </div>
                     </div>
                   </div>
                   {stegMode === "ENCODE" && (
                     <div className="space-y-3">
                       <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">2. Secret Payload</label>
                       <textarea value={secretMessage} onChange={(e) => setSecretMessage(e.target.value)} placeholder="Enter secret text..." className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]" />
                     </div>
                   )}
                   <button onClick={processSteganography} disabled={isProcessing || !selectedImage} className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${isProcessing || !selectedImage ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"}`}>
                     {isProcessing ? <Zap className="w-4 h-4 animate-spin" /> : stegMode === "ENCODE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                     {isProcessing ? "Processing..." : stegMode === "ENCODE" ? "Encrypt & Download" : "Decrypt Image"}
                   </button>
                 </div>
                 <div className="relative bg-neutral-950 rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center min-h-[300px]">
                   {decodedMessage ? (
                     <div className="w-full animate-in zoom-in-95 duration-300">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">Decoded</span></div>
                       </div>
                       <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-2xl"><p className="text-white text-lg leading-relaxed">{decodedMessage}</p></div>
                     </div>
                   ) : (
                     <div className="text-center opacity-40 max-w-xs"><ShieldCheck className="w-16 h-16 text-neutral-500 mx-auto mb-4" /><p className="text-sm text-neutral-500">Result will appear here.</p></div>
                   )}
                 </div>
               </div>
             </div>
          )}
        </main>
      </div>
    </div>
  )
}