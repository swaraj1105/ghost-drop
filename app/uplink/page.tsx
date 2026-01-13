"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ghost, Fingerprint, Lock, ChevronRight } from "lucide-react";

export default function UplinkPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing Ghost Protocol...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Progress Bar Simulation
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 1; 
      });
    }, 150);

    // 2. Status Text Updates (Themed for "Ghost")
    const timeouts = [
      setTimeout(() => setStatus("Dissolving Digital Footprint..."), 800),
      setTimeout(() => setStatus("Establishing Secure Handshake..."), 1500),
      setTimeout(() => setStatus("Encrypting Tunnel (AES-256)..."), 2200),
      setTimeout(() => setStatus("GHOST MODE: ACTIVE"), 3000),
    ];

    // 3. FINAL REDIRECT
    const redirect = setTimeout(() => {
      router.replace("/home"); 
    }, 3500);

    return () => {
      clearInterval(timer);
      timeouts.forEach(clearTimeout);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        
        {/* Central Icon Animation */}
        <div className="relative mb-12">
           {/* Rotating Rings */}
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-20px] border border-indigo-500/30 rounded-full w-32 h-32 border-t-transparent border-l-transparent"
           />
           <motion.div 
             animate={{ rotate: -360 }}
             transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-10px] border border-violet-500/30 rounded-full w-[108px] h-[108px] border-b-transparent border-r-transparent"
           />
           
           {/* Glowing Center */}
           <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-indigo-500/50 relative overflow-hidden">
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {progress < 100 ? <Fingerprint size={32} className="text-indigo-400" /> : <Ghost size={32} className="text-white" />}
              </motion.div>
              
              {/* Scan Line Effect */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-indigo-400 shadow-[0_0_10px_#818cf8]"
              />
           </div>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-3 mb-8 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {progress < 100 ? "AUTHENTICATING" : "ACCESS GRANTED"}
            <span className="flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
            </span>
          </h1>
          <p className="text-indigo-300/70 text-sm font-mono tracking-wide uppercase">{status}</p>
        </div>

        {/* Loading Bar */}
        <div className="w-full space-y-2">
           <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <span>Encryption Level</span>
              <span>{Math.min(progress, 100)}%</span>
           </div>
           <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-12 flex items-center gap-2 text-xs text-neutral-600 border border-white/5 px-3 py-1.5 rounded-full bg-neutral-900/50 backdrop-blur-sm">
            <Lock size={10} />
            <span>SECURE CONNECTION ESTABLISHED</span>
        </div>
      </div>
    </div>
  );
}