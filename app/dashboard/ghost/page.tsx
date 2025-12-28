"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
// Make sure to run: npm install react-qr-code
import QRCode from "react-qr-code"; 
import { createRoom, joinRoom, sendFile, destroyRoom } from "@/lib/webrtcService";
import { 
  Radio, Signal, Upload, Lock, Unlock, Zap, 
  Image as ImageIcon, ArrowRight, CheckCircle2, 
  Copy, Check, ArrowLeft, FileUp, Download, ShieldCheck,
  AlertTriangle, X
} from "lucide-react";

export default function GhostPage() {
  const [activeTab, setActiveTab] = useState<"GHOST_DROP" | "STEGANOGRAPHY">("GHOST_DROP");
  const [transferMode, setTransferMode] = useState<"IDLE" | "SEND" | "RECEIVE">("IDLE");

  // --- WEBRTC STATE ---
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  // 🔴 UPDATED: Array for multiple files
  const [receivedFiles, setReceivedFiles] = useState<{name: string, data: string}[]>([]); 

  // --- SENDER BATCH STATE ---
  const [fileQueue, setFileQueue] = useState<File[]>([]);

  const handleQueueFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileQueue(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFileQueue(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const sendBatch = async () => {
    if (fileQueue.length === 0) return;
    
    for (let i = 0; i < fileQueue.length; i++) {
      const file = fileQueue[i];
      setStatus(`Streaming [${i + 1}/${fileQueue.length}]: ${file.name}...`);
      await sendFile(file);
    }
    
    setStatus("All Transfers Complete.");
    setFileQueue([]); 
  };

  // --- UI STATE ---
  const [isCopied, setIsCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // --- STEGANOGRAPHY STATE ---
  const [stegMode, setStegMode] = useState<"ENCODE" | "DECODE">("ENCODE");
  const [secretMessage, setSecretMessage] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HELPER: COPY FUNCTION ---
  const copyToClipboard = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- HELPER: DOWNLOAD FUNCTION ---
  const downloadFile = (file: {name: string, data: string}) => {
    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  // --- CLEANUP LOGIC ---
  const handleDisconnect = async (showModal = false) => {
    if (roomId) {
      await destroyRoom(roomId);
      setRoomId("");
    }
    setStatus("Idle");
    setIsConnected(false);
    setReceivedFiles([]); // Clear receiver list
    setFileQueue([]);     // Clear sender queue
    setTransferMode("IDLE");
    if (showModal) setShowExitModal(true);
  };

  // Auto-destroy if user closes the tab
  useEffect(() => {
    const handleTabClose = () => {
      if (roomId) destroyRoom(roomId);
    };
    window.addEventListener("beforeunload", handleTabClose);
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      if (roomId) destroyRoom(roomId);
    };
  }, [roomId]);

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
        (blob, name) => console.log("Received back:", name)
      );
      setRoomId(id);
      setStatus("Waiting for Receiver...");
    } catch (e) {
      console.error(e);
      setStatus("Connection Error");
    }
  };

  // --- RECEIVER LOGIC ---
  const tuneFrequency = async () => {
    if (!roomId) return;
    setStatus(`Connecting to ${roomId}...`);
    try {
      await joinRoom(
        roomId,
        () => {
          setStatus("Secure Tunnel Established. Listening...");
          setIsConnected(true);
        },
        (blob, fileName) => {
          setStatus("Data Fragment Received.");
          const url = URL.createObjectURL(blob);
          // 🔴 APPEND TO LIST
          setReceivedFiles(prev => [...prev, { name: fileName, data: url }]);
        },
        () => {
          handleDisconnect(true);
        }
      );
    } catch (err) {
      alert("Invalid Room ID or Room no longer exists.");
      setStatus("Connection Failed");
    }
  };

  // --- STEGANOGRAPHY LOGIC (Unchanged) ---
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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-6 md:p-12 selection:bg-indigo-500/30 relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* CUSTOM DISCONNECT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Connection Terminated</h3>
              <p className="text-neutral-400 text-sm">
                The sender has destroyed the room. The frequency is now dead.
              </p>
              <button 
                onClick={() => setShowExitModal(false)}
                className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* --- SENDER UI --- */}
              {transferMode === "SEND" && (
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm min-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => handleDisconnect(false)} className="flex items-center text-xs font-medium text-neutral-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                    </div>

                    {/* PHASE 1: QR CODE (Broadcasting) */}
                    {!isConnected && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                            <h2 className="text-2xl font-semibold text-white animate-pulse">Waiting for Receiver...</h2>
                            {roomId && (
                                <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                                    <QRCode value={roomId} size={180} />
                                </div>
                            )}
                            <button 
                              onClick={copyToClipboard}
                              className="group flex items-center gap-4 bg-neutral-950 px-8 py-4 rounded-xl border border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer"
                            >
                              <span className="text-4xl font-mono tracking-widest text-indigo-400 font-bold drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                  {roomId}
                              </span>
                              <div className="text-neutral-600 group-hover:text-indigo-400 transition-colors">
                                  {isCopied ? <Check size={24} className="animate-in zoom-in" /> : <Copy size={24} />}
                              </div>
                            </button>
                        </div>
                    )}

                    {/* PHASE 2: BATCH TRANSFER (Connected) */}
                    {isConnected && (
                        <div className="flex-1 grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* LEFT: File Manifest */}
                            <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
                                    <h3 className="text-white font-medium flex items-center gap-2"><FileUp size={16}/> Selected Files</h3>
                                    <span className="text-xs text-neutral-500">{fileQueue.length} files</span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-2 custom-scrollbar">
                                    {fileQueue.length === 0 && <p className="text-neutral-600 text-sm text-center mt-10">No files selected</p>}
                                    {fileQueue.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-neutral-900 p-3 rounded-lg border border-neutral-800 group hover:border-indigo-500/30 transition-colors">
                                            <span className="text-sm text-neutral-300 truncate max-w-[150px]">{file.name}</span>
                                            <span className="text-xs text-neutral-600">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <button onClick={() => removeFile(idx)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: Drop Zone & Actions */}
                            <div className="flex flex-col gap-4">
                                <div className="relative group flex-1">
                                    <input type="file" multiple onChange={handleQueueFiles} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="h-full border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                        <div className="p-4 bg-neutral-800 rounded-full mb-3 group-hover:bg-indigo-500/20 transition-colors">
                                            <FileUp className="w-6 h-6 text-neutral-400 group-hover:text-indigo-400" />
                                        </div>
                                        <p className="text-sm text-neutral-300 font-medium">Add files to queue</p>
                                        <p className="text-xs text-neutral-600 mt-1">or drag and drop</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={sendBatch}
                                    disabled={fileQueue.length === 0}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${fileQueue.length > 0 ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-neutral-800 text-neutral-600 cursor-not-allowed"}`}
                                >
                                    <Zap size={18} /> SEND {fileQueue.length} FILES
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* --- RECEIVER UI --- */}
              {transferMode === "RECEIVE" && (
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm max-w-xl mx-auto min-h-[500px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => handleDisconnect(false)} className="flex items-center text-xs font-medium text-neutral-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                        <p className="text-violet-400 font-mono text-xs animate-pulse">{status}</p>
                    </div>

                    {/* PHASE 1: ENTER CODE */}
                    {!isConnected ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-white">Tune Frequency</h2>
                                <p className="text-neutral-500 text-sm mt-2">Enter 6-digit access code to receive data.</p>
                            </div>
                            
                            <div className="w-full space-y-4">
                                <input 
                                type="text" 
                                placeholder="000 000" 
                                onChange={(e) => setRoomId(e.target.value)} 
                                value={roomId} 
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-neutral-800"
                                />
                                <button 
                                onClick={tuneFrequency} 
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
                                >
                                <Zap className="w-4 h-4 fill-current" /> Connect to Tunnel
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* PHASE 2: FILE LIST (The Data Heist UI) */
                        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
                                <h3 className="text-white font-medium flex items-center gap-2"><Download className="text-emerald-500" size={18}/> Intercepted Data</h3>
                                <span className="text-xs text-neutral-500">{receivedFiles.length} files</span>
                            </div>

                            <div className="flex-1 bg-neutral-950/50 rounded-xl border border-neutral-800 p-2 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2">
                                {receivedFiles.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-3 opacity-60">
                                        <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                                            <Signal className="animate-pulse" size={20}/>
                                        </div>
                                        <p className="text-sm">Listening for data stream...</p>
                                    </div>
                                )}

                                {receivedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl group hover:border-emerald-500/30 transition-all animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm text-white font-medium truncate w-full">{file.name}</span>
                                                <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider">Received</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => downloadFile(file)}
                                            className="p-2 bg-white text-black rounded-lg hover:bg-emerald-400 transition-colors shadow-lg"
                                            title="Download File"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
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