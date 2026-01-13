"use client"; // <--- 1. FIXED: Added this directive

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // <--- 2. FIXED: Switched to Next.js router
import { motion } from "framer-motion";
import { Ghost, Fingerprint, Lock } from "lucide-react";

export default function UplinkPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing Ghost Protocol...");
  const [progress, setProgress] = useState(0);

  // --- 3. ADDED: Style Injection so visuals work immediately ---
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .noise-overlay {
        position: fixed; inset: 0; pointer-events: none; z-index: 50; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }
      .glass-card {
        background: rgba(20, 20, 20, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      }
      .text-glow {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(99, 102, 241, 0.3);
      }
      .icon-glow {
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(99, 102, 241, 0.5));
      }
      .gradient-bar {
        background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ffffff 100%);
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
      }
      .grid-pattern {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

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

    // 2. Status Text Updates
    const timeouts = [
      setTimeout(() => setStatus("Dissolving Digital Footprint..."), 800),
      setTimeout(() => setStatus("Establishing Secure Handshake..."), 1500),
      setTimeout(() => setStatus("Encrypting Tunnel (AES-256)..."), 2200),
      setTimeout(() => setStatus("GHOST MODE: ACTIVE"), 3000),
    ];

    // 3. FINAL REDIRECT
    const redirect = setTimeout(() => {
      router.replace("/home"); // <--- FIXED: Used Next.js router
    }, 3500);

    return () => {
      clearInterval(timer);
      timeouts.forEach(clearTimeout);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Film grain noise overlay */}
      <div className="noise-overlay" />

      {/* Grid Background Pattern */}
      <div className="absolute inset-0 grid-pattern" />

      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Massive GHOST Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[40vw] font-black text-white/[0.02] tracking-tighter blur-[2px]">
          GHOST
        </span>
      </div>

      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 glass-card rounded-3xl p-10 md:p-14 max-w-md w-full flex flex-col items-center"
      >
        {/* Gradient Border Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-50 pointer-events-none" />

        {/* Central Icon Animation */}
        <div className="relative mb-10">
          {/* Rotating Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] border border-indigo-500/30 rounded-full w-32 h-32 border-t-transparent border-l-transparent"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10px] border border-purple-500/30 rounded-full w-[108px] h-[108px] border-b-transparent border-r-transparent"
          />

          {/* Glowing Center */}
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/50 relative overflow-hidden">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {progress < 100 ? (
                <Fingerprint size={32} className="text-indigo-500" />
              ) : (
                <Ghost size={32} className="text-white icon-glow" />
              )}
            </motion.div>

            {/* Scan Line Effect */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_10px_#6366f1]"
            />
          </div>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-3 mb-8 w-full relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 text-glow">
            {progress < 100 ? "AUTHENTICATING" : "ACCESS GRANTED"}
            {progress < 100 && (
              <span className="flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
              </span>
            )}
          </h1>
          <p className="text-indigo-400/70 text-sm font-mono tracking-[0.2em] uppercase">
            {status}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-full space-y-2 relative z-10">
          <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">
            <span>Encryption Level</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-bar rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Footer Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center gap-2 text-xs text-neutral-500 border border-white/10 px-4 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm"
        >
          <Lock size={10} className="text-indigo-500" />
          <span className="tracking-[0.2em] uppercase">Secure Connection</span>
        </motion.div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}