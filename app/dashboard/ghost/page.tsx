"use client";

import React, { useState, useRef, ChangeEvent, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from "framer-motion"; 
import QRCode from "react-qr-code"; 
import { Html5Qrcode } from "html5-qrcode";
import { createRoom, joinRoom, sendFile, destroyRoom } from "@/lib/webrtcService";
import { 
  Radio, Signal, Upload, Lock, Unlock, Zap, 
  Image as ImageIcon, ArrowRight, CheckCircle2, 
  Copy, Check, ArrowLeft, FileUp, Download, ShieldCheck,
  AlertTriangle, X, Loader2, QrCode, Share2, Terminal, ScanLine
} from "lucide-react";

// --- 0. ANIMATION COMPONENTS (NEW) ---

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";

function ScrambleText({ text, className }: { text: string, className?: string }) {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    let iteration = 0;
    let interval: NodeJS.Timeout;

    if (text) {
      // ADAPTIVE SPEED MATH:
      // We want the whole animation to take roughly 1.5 seconds (1500ms).
      // Running at 30ms intervals means we have ~50 frames total.
      // So we calculate how many characters to reveal per frame.
      const step = Math.max(1, text.length / 50); 

      interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (index < iteration) return text[index]; // Revealed part
              if (char === " ") return " "; // Keep spaces clean
              return CHARS[Math.floor(Math.random() * CHARS.length)]; // Scramble part
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(interval);
          setDisplayText(text); // Ensure final state is clean
        }

        iteration += step; // Use the calculated adaptive step
      }, 30);
    } else {
      setDisplayText("");
    }

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
}

function ImageScanner({ isScanning }: { isScanning: boolean }) {
  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl">
      {/* The Laser Line */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ 
          duration: 2, 
          ease: "linear", 
          repeat: Infinity,
          repeatDelay: 0.5 
        }}
        className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20"
      />
      
      {/* The Green Tint overlay trailing the laser */}
      <motion.div 
        initial={{ top: "-10%", opacity: 0 }}
        animate={{ top: "110%", opacity: [0, 0.3, 0] }}
        transition={{ 
          duration: 2, 
          ease: "linear", 
          repeat: Infinity,
          repeatDelay: 0.5 
        }}
        className="absolute left-0 right-0 h-24 bg-gradient-to-t from-emerald-500/30 to-transparent z-10"
      />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
    </div>
  );
}

// --- 1. MAIN LOGIC COMPONENT ---
function GhostContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"GHOST_DROP" | "STEGANOGRAPHY">("GHOST_DROP");
  const [transferMode, setTransferMode] = useState<"IDLE" | "SEND" | "RECEIVE">("IDLE");

  // --- MOUSE SPOTLIGHT LOGIC ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // --- WEBRTC STATE ---
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState<{name: string, data: string}[]>([]); 

  // --- SENDER STATE ---
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isSelfDisconnecting = useRef(false);

  // --- SCANNER STATE ---
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null); 

  // --- AUTO-START LOGIC ---
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "broadcast" && transferMode === "IDLE") {
      setTimeout(() => startBroadcast(), 100);
    }
  }, [searchParams]);

  // --- LOGIC FUNCTIONS ---
  const handleQueueFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileQueue(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (isSending) return; 
    setFileQueue(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const sendBatch = async () => {
    if (fileQueue.length === 0 || isSending) return;
    setIsSending(true); 
    try {
      for (let i = 0; i < fileQueue.length; i++) {
        const file = fileQueue[i];
        setStatus(`Streaming [${i + 1}/${fileQueue.length}]: ${file.name}...`);
        await sendFile(file);
      }
      setStatus("All Transfers Complete.");
      setFileQueue([]); 
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (error) {
      console.error("Transfer failed", error);
      setStatus("Transfer Interrupted.");
    } finally {
      setIsSending(false); 
    }
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
  const [isImageScanning, setIsImageScanning] = useState(false); // NEW STATE FOR ANIMATION
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HELPER FUNCTIONS ---
  const copyToClipboard = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!roomId) return;
    try {
        if (qrRef.current) {
            const svg = qrRef.current.querySelector("svg");
            if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const img = new Image();
                const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
                const url = URL.createObjectURL(svgBlob);

                img.onload = async () => {
                    canvas.width = 200;
                    canvas.height = 200;
                    if (ctx) {
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 10, 10, 180, 180);
                    }
                    URL.revokeObjectURL(url);
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            const file = new File([blob], `ghost_drop_${roomId}.png`, { type: "image/png" });
                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    files: [file],
                                    title: "GhostDrop Access Code",
                                    text: `Scan this QR to join my secure channel. Code: ${roomId}`
                                });
                                return;
                            }
                        }
                        shareTextFallback();
                    });
                };
                img.src = url;
                return;
            }
        }
        shareTextFallback();
    } catch (err) {
        shareTextFallback();
    }
  };

  const shareTextFallback = async () => {
      if (navigator.share) {
          await navigator.share({ title: "GhostDrop Access Code", text: roomId });
      } else {
          copyToClipboard();
      }
  };

  const downloadFile = (file: {name: string, data: string}) => {
    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  const handleDisconnect = async (showModal = false) => {
    if (!showModal) isSelfDisconnecting.current = true;
    if (roomId) {
      await destroyRoom(roomId);
      setRoomId("");
    }
    setStatus("Idle");
    setIsConnected(false);
    setReceivedFiles([]); 
    setFileQueue([]);     
    setTransferMode("IDLE");
    if (showModal) setShowExitModal(true);
  };

  useEffect(() => {
    const handleTabClose = () => { if (roomId) destroyRoom(roomId); };
    window.addEventListener("beforeunload", handleTabClose);
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      if (roomId) destroyRoom(roomId);
    };
  }, [roomId]);

  useEffect(() => {
    if (isScanning && transferMode === "RECEIVE") {
      const html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          handleScanSuccess(decodedText);
          html5QrCode.stop().catch(err => console.error(err));
        },
        () => {}
      ).catch(err => console.error("Error starting scanner", err));

      return () => {
        if(html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error("Stop failed", err));
        }
      };
    }
  }, [isScanning]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    setRoomId(decodedText);
    tuneFrequency(decodedText);
  };

  const handleScanFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const html5QrCode = new Html5Qrcode("reader");
    try {
      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result);
    } catch (err) {
      alert("Could not find a valid QR code in this image.");
    }
  };

  const startBroadcast = async () => {
    setTransferMode("SEND");
    setStatus("Generating Secure Frequency...");
    isSelfDisconnecting.current = false;
    try {
      const id = await createRoom(
        () => {
          setStatus("Peer Connected. Tunnel Open.");
          setIsConnected(true);
        },
        (blob, name) => console.log("Received back:", name),
        () => {
           if (!isSelfDisconnecting.current) handleDisconnect(true);
        }
      );
      setRoomId(id);
      setStatus("Waiting for Receiver...");
    } catch (e) {
      setStatus("Connection Error");
    }
  };

  const tuneFrequency = async (manualId?: string) => {
    const targetId = manualId || roomId;
    if (!targetId) return;
    setStatus(`Connecting to ${targetId}...`);
    isSelfDisconnecting.current = false;
    try {
      await joinRoom(
        targetId,
        () => {
          setStatus("Secure Tunnel Established. Listening...");
          setIsConnected(true);
        },
        (blob, fileName) => {
          setStatus("Data Fragment Received.");
          const url = URL.createObjectURL(blob);
          setReceivedFiles(prev => [...prev, { name: fileName, data: url }]);
        },
        () => {
           if (!isSelfDisconnecting.current) handleDisconnect(true);
        }
      );
    } catch (err) {
      alert("Invalid Room ID or Room no longer exists.");
      setStatus("Connection Failed");
    }
  };

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

  // --- UPDATED PROCESSING LOGIC WITH ANIMATION ---
  const processSteganography = async () => {
    if (!selectedImage) return;
    
    // START ANIMATION
    setIsProcessing(true);
    setDecodedMessage(""); // Clear previous

    // If decoding, we wait for the scan effect
    if (stegMode === "DECODE") {
        setIsImageScanning(true);
        // Wait 2 seconds for "scanning" effect
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsImageScanning(false);
    }

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
             setIsProcessing(false);
        } else {
             // DECODE LOGIC
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
             setIsProcessing(false);
        }
    };
  };

  // --- RENDER ---
  return (
    <div 
      className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative group"
      onMouseMove={handleMouseMove}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* --- BACKGROUND EFFECTS --- */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition duration-500 group-hover:opacity-100 opacity-50"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(79, 70, 229, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* --- SCANNER MODAL --- */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-neutral-900 border border-violet-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
             <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/50">
               <h3 className="text-white font-medium flex items-center gap-2">
                 <QrCode className="text-violet-500" /> Scan QR Code
               </h3>
               <button onClick={() => setIsScanning(false)} className="text-neutral-500 hover:text-white transition-colors">
                 <X size={20} />
               </button>
             </div>
             <div className="relative bg-black h-[300px] flex items-center justify-center overflow-hidden">
                <div id="reader" className="w-full h-full"></div>
                <div className="absolute inset-0 border-2 border-violet-500/30 pointer-events-none"></div>
             </div>
             <div className="p-6 flex flex-col gap-3 bg-neutral-900">
               <p className="text-center text-xs text-neutral-500 mb-2">Align the QR code within the frame.</p>
               <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-neutral-700"
                 >
                   <ImageIcon size={18} /> Upload from Gallery
               </button>
               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleScanFileUpload} className="hidden" />
             </div>
          </div>
        </div>
      )}

      {/* --- DISCONNECT MODAL --- */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Connection Terminated</h3>
              <p className="text-neutral-400 text-sm">The connection was terminated by the peer.</p>
              <button onClick={() => setShowExitModal(false)} className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS TOAST --- */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-neutral-900 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-3">
             <div className="bg-emerald-500 rounded-full p-1"><Check size={14} className="text-black stroke-[3]" /></div>
             <span className="font-medium tracking-wide text-sm">Payload Delivered</span>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12 space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between pb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg flex items-center justify-center border border-white/10">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Ghost Dashboard</h1>
              <p className="text-sm text-neutral-500">Secure Communications Suite v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            ENCRYPTED
          </div>
        </header>

        {/* --- TABS --- */}
        <div className="flex justify-center">
          <div className="inline-flex bg-neutral-900/40 backdrop-blur-md p-1 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab("GHOST_DROP")} className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "GHOST_DROP" ? "bg-neutral-800 text-white shadow-sm border border-white/5" : "text-neutral-400 hover:text-white"}`}>GhostDrop</button>
            <button onClick={() => setActiveTab("STEGANOGRAPHY")} className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "STEGANOGRAPHY" ? "bg-neutral-800 text-white shadow-sm border border-white/5" : "text-neutral-400 hover:text-white"}`}>Steganography</button>
          </div>
        </div>

        <main className="transition-all duration-300 ease-in-out">
          {activeTab === "GHOST_DROP" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {transferMode === "IDLE" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.button whileHover={{ scale: 1.02 }} onClick={startBroadcast} className="group relative overflow-hidden rounded-3xl bg-neutral-900/40 border border-white/5 p-8 text-left hover:border-indigo-500/30 transition-all backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-neutral-800/80 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 border border-white/5 shadow-inner"><Radio className="w-6 h-6" /></div>
                      <h3 className="text-xl font-bold text-white mb-2">Broadcast Signal</h3>
                      <p className="text-neutral-400 text-sm">Create a secure P2P tunnel.</p>
                    </div>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => setTransferMode("RECEIVE")} className="group relative overflow-hidden rounded-3xl bg-neutral-900/40 border border-white/5 p-8 text-left hover:border-violet-500/30 transition-all backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-neutral-800/80 rounded-2xl flex items-center justify-center mb-6 text-violet-400 border border-white/5 shadow-inner"><Signal className="w-6 h-6" /></div>
                      <h3 className="text-xl font-bold text-white mb-2">Tune Frequency</h3>
                      <p className="text-neutral-400 text-sm">Connect using a room code.</p>
                    </div>
                  </motion.button>
                </div>
              )}

              {/* --- SENDER UI --- */}
              {transferMode === "SEND" && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-neutral-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md min-h-[600px] flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <button onClick={() => handleDisconnect(false)} className="flex items-center text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider"><ArrowLeft className="w-4 h-4 mr-1" /> Terminate</button>
                    </div>

                    {!isConnected && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in relative z-10">
                            <h2 className="text-2xl font-bold text-white animate-pulse">Waiting for Receiver...</h2>
                            {roomId && (
                                <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                                    <QRCode value={roomId} size={180} />
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4 w-full max-w-sm">
                                <button onClick={copyToClipboard} className="flex-1 group flex items-center justify-between bg-neutral-950/80 px-6 py-4 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all cursor-pointer">
                                  <span className="text-2xl font-mono tracking-widest text-indigo-400 font-bold drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{roomId}</span>
                                  <div className="text-neutral-600 group-hover:text-indigo-400 transition-colors">{isCopied ? <Check size={20} /> : <Copy size={20} />}</div>
                                </button>
                                <button onClick={handleShare} className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/50"><Share2 size={24} /></button>
                            </div>
                        </div>
                    )}

                    {isConnected && (
                        <div className="flex-1 grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 relative z-10">
                            <div className="bg-neutral-950/30 rounded-2xl border border-white/5 p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                                    <h3 className="text-white font-bold flex items-center gap-2"><FileUp size={18} className="text-indigo-400"/> Upload Queue</h3>
                                    <span className="text-xs font-mono text-neutral-500">{fileQueue.length} FILES</span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-2 custom-scrollbar">
                                    {fileQueue.length === 0 && <p className="text-neutral-600 text-sm text-center mt-10">Queue is empty</p>}
                                    {fileQueue.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-colors">
                                            <span className="text-sm text-neutral-300 truncate max-w-[150px]">{file.name}</span>
                                            <span className="text-xs text-neutral-600 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <button onClick={() => removeFile(idx)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="relative group flex-1">
                                    <input type="file" multiple onChange={handleQueueFiles} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                        <div className="p-4 bg-neutral-800/50 rounded-full mb-3 group-hover:bg-indigo-500/20 transition-colors"><FileUp className="w-6 h-6 text-neutral-400 group-hover:text-indigo-400" /></div>
                                        <p className="text-sm text-neutral-300 font-medium">Drop files here</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={sendBatch}
                                    disabled={fileQueue.length === 0 || isSending}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                      fileQueue.length > 0 && !isSending ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5"
                                    }`}
                                >
                                    {isSending ? <><Loader2 size={18} className="animate-spin" /> SENDING...</> : <><Zap size={18} /> SEND BATCH</>}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
              )}

              {/* --- RECEIVER UI --- */}
              {transferMode === "RECEIVE" && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-neutral-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md max-w-xl mx-auto min-h-[500px] flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <button onClick={() => handleDisconnect(false)} className="flex items-center text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-wider"><ArrowLeft className="w-4 h-4 mr-1" /> Terminate</button>
                        <p className="text-violet-400 font-mono text-xs animate-pulse">{status}</p>
                    </div>

                    {!isConnected ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in relative z-10">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white">Tune Frequency</h2>
                                <p className="text-neutral-500 text-sm mt-2">Enter 6-digit secure access code.</p>
                            </div>
                            
                            <div className="w-full space-y-4">
                                <div className="relative">
                                  <input type="text" placeholder="000 000" onChange={(e) => setRoomId(e.target.value)} value={roomId} className="w-full bg-neutral-950/80 border border-white/10 rounded-xl p-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-neutral-800" />
                                  <button onClick={() => setIsScanning(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-violet-400 transition-colors border border-white/10"><QrCode size={20} /></button>
                                </div>
                                <button onClick={() => tuneFrequency()} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"><Zap className="w-4 h-4 fill-current" /> ESTABLISH LINK</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                                <h3 className="text-white font-bold flex items-center gap-2"><Download className="text-emerald-500" size={18}/> Incoming Stream</h3>
                                <span className="text-xs font-mono text-neutral-500">{receivedFiles.length} FILES</span>
                            </div>

                            <div className="flex-1 bg-neutral-950/30 rounded-2xl border border-white/5 p-2 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2">
                                {receivedFiles.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-3 opacity-60">
                                        <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center"><Signal className="animate-pulse" size={20}/></div>
                                        <p className="text-sm">Listening for data...</p>
                                    </div>
                                )}
                                {receivedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900/50 border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/10 transition-colors"><CheckCircle2 size={20} /></div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm text-white font-medium truncate w-full">{file.name}</span>
                                                <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider">Received</span>
                                            </div>
                                        </div>
                                        <button onClick={() => downloadFile(file)} className="p-2 bg-white text-black rounded-lg hover:bg-emerald-400 transition-colors shadow-lg"><Download size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </motion.div>
              )}
            </motion.div>
          )}

          {/* --- STEGANOGRAPHY TAB (UPGRADED) --- */}
          {activeTab === "STEGANOGRAPHY" && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
               <div className="border-b border-white/5 px-6 py-4 flex gap-6">
                 <button onClick={() => { setStegMode("ENCODE"); setSelectedImage(null); setFileName("") }} className={`text-sm font-bold transition-colors ${stegMode === "ENCODE" ? "text-indigo-400" : "text-neutral-500 hover:text-white"}`}>ENCODE (HIDE)</button>
                 <button onClick={() => { setStegMode("DECODE"); setSelectedImage(null); setFileName("") }} className={`text-sm font-bold transition-colors ${stegMode === "DECODE" ? "text-indigo-400" : "text-neutral-500 hover:text-white"}`}>DECODE (REVEAL)</button>
               </div>
               <div className="p-6 md:p-8 grid md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                   
                   {/* IMAGE UPLOAD SECTION */}
                   <div className="space-y-3">
                     <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stegMode === "ENCODE" ? "1. Source Image" : "1. Encrypted Image"}</label>
                     <div className="relative group">
                       <input type="file" accept="image/*" onChange={handleStegUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"/>
                       <div className={`border border-dashed rounded-2xl p-8 text-center transition-all overflow-hidden relative ${selectedImage ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 bg-neutral-900/50 hover:bg-neutral-800/50"}`}>
                         
                         {/* --- SCANNER OVERLAY --- */}
                         <ImageScanner isScanning={isImageScanning} />
                         
                         {selectedImage ? <div className="flex flex-col items-center gap-2 relative z-10"><ImageIcon className="w-8 h-8 text-indigo-400" /><span className="text-sm font-medium text-white">{fileName}</span></div> : <div className="flex flex-col items-center gap-2 text-neutral-500 relative z-10"><Upload className="w-8 h-8 mb-2" /><span className="text-sm font-medium">Drop image here</span></div>}
                       </div>
                     </div>
                   </div>

                   {stegMode === "ENCODE" && (
                     <div className="space-y-3">
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">2. Secret Payload</label>
                       <textarea value={secretMessage} onChange={(e) => setSecretMessage(e.target.value)} placeholder="Enter secret text..." className="w-full bg-neutral-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]" />
                     </div>
                   )}
                   
                   <button onClick={processSteganography} disabled={isProcessing || !selectedImage} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isProcessing || !selectedImage ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"}`}>
                     {isProcessing ? <Zap className="w-4 h-4 animate-spin" /> : stegMode === "ENCODE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                     {isProcessing ? "PROCESSING..." : stegMode === "ENCODE" ? "ENCRYPT & DOWNLOAD" : "DECRYPT IMAGE"}
                   </button>
                 </div>
                 
                 {/* RESULT DISPLAY */}
                 <div className="relative bg-neutral-950/50 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[300px]">
                   {decodedMessage ? (
                     <div className="w-full animate-in zoom-in-95 duration-300">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2 text-emerald-500"><ScanLine className="w-5 h-5" /><span className="text-sm font-bold">DECRYPTED DATA</span></div>
                       </div>
                       <div className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                          <p className="text-emerald-400 text-lg leading-relaxed font-mono relative z-10">
                              {/* --- SCRAMBLE TEXT EFFECT --- */}
                              <ScrambleText text={decodedMessage} />
                          </p>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center opacity-40 max-w-xs">
                        <Terminal className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
                        <p className="text-sm text-neutral-500">Awaiting decryption sequence...</p>
                     </div>
                   )}
                 </div>
               </div>
             </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

// --- 2. EXPORT DEFAULT WRAPPED IN SUSPENSE ---
export default function GhostPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
        </div>
    }>
        <GhostContent />
    </Suspense>
  );
}