"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Terminal, Wifi } from "lucide-react";

export default function UplinkPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing Handshake...");
  const [progress, setProgress] = useState(0);

// Auto-redirect logic
  useEffect(() => {
    // 1. Progress Bar Simulation (Keep existing code...)
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 10) + 1; 
      });
    }, 150);

    // 2. Status Text Updates (Keep existing code...)
    const timeouts = [
      setTimeout(() => setStatus("Bypassing Firewall..."), 800),
      setTimeout(() => setStatus("Encrypting Tunnel (AES-256)..."), 1600),
      setTimeout(() => setStatus("Masking IP Address..."), 2400),
      setTimeout(() => setStatus("ACCESS GRANTED"), 3200),
    ];

    // 3. FINAL REDIRECT - THE FIX
    const redirect = setTimeout(() => {
      router.replace("/home"); // <--- CHANGED FROM push() TO replace()
    }, 3500);

    return () => {
      clearInterval(timer);
      timeouts.forEach(clearTimeout);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-green-500/30">
      
      {/* Background Matrix Rain Effect (Simplified) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,1)_100%),linear-gradient(0deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />

      <div className="max-w-md w-full relative z-10 space-y-8">
        
        {/* Animated Icon */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-green-500 rounded-full w-20 h-20 opacity-50"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-b-2 border-green-500 rounded-full w-16 h-16 opacity-30"
            />
            <div className="w-20 h-20 flex items-center justify-center text-green-500">
               {progress < 100 ? <Wifi size={32} className="animate-pulse" /> : <ShieldCheck size={32} />}
            </div>
          </div>
        </div>

        {/* Text Terminal */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-widest uppercase text-center animate-pulse">
            {progress < 100 ? "Establishing Uplink" : "Connection Secure"}
          </h1>
          <div className="h-6 flex items-center justify-center gap-2 text-sm text-green-400/80">
             <Terminal size={14} />
             <span className="typing-effect">{status}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs uppercase tracking-widest opacity-70">
              <span>System Load</span>
              <span>{Math.min(progress, 100)}%</span>
           </div>
           <div className="h-2 bg-green-900/30 rounded-full overflow-hidden border border-green-500/20">
              <motion.div 
                className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {/* Decorative Hex Codes */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-20 text-[10px] opacity-20 hidden md:block text-right">
           <p>0x4A12B</p>
           <p>0x99C21</p>
           <p>0xFF01A</p>
        </div>
      </div>
    </div>
  );
}