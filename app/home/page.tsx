"use client";

import React from "react";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { 
  Zap, Ghost, ArrowRight, Shield, Cpu, Globe, Terminal 
} from "lucide-react";

export default function LandingPage() {
  // Mouse spotlight logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative group"
      onMouseMove={handleMouseMove}
    >
      {/* SPOTLIGHT BACKGROUND */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(79, 70, 229, 0.10),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* GRID MESH */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center border border-white/10">
                  <Ghost className="w-5 h-5 text-white" />
                </div>
            </div>
            <span className="font-bold tracking-tight text-xl">GhostDrop</span>
          </div>
          
          <Link 
            href="/dashboard/ghost"
            className="group relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-6 py-1 text-sm font-bold text-white backdrop-blur-3xl transition-all group-hover:bg-neutral-900">
              Launch App <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </nav>

      {/* HERO CONTENT */}
      <main className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Online: V2.0 Stable
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-neutral-600 drop-shadow-2xl"
        >
          Share Data.<br />
          Leave No Trace.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12 leading-relaxed"
        >
          Zero-knowledge P2P file transfer. 
          No servers. No logs. No history. 
          <span className="text-white font-medium"> Just an ephemeral tunnel between devices.</span>
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
        >
          <Link 
            href="/dashboard/ghost?action=broadcast"
            className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="flex items-center justify-center gap-2 relative z-10">
              <Zap className="fill-current" size={20} /> Start Transfer
            </span>
          </Link>
          
        <a 
            href="https://github.com/swaraj1105/ghost-drop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-neutral-900/50 border border-neutral-800 text-neutral-300 rounded-xl font-medium text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
            >
                <Terminal size={20} /> Documentation
        </a>
        </motion.div>
      </main>

      {/* FEATURE CARDS */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="text-indigo-400" />}
              title="P2P Mesh Network"
              desc="Data flows directly between devices using WebRTC. Your files never touch our servers."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-400" />}
              title="AES-256 Encryption"
              desc="Military-grade encryption generated on the client-side. Even we cannot see what you are sending."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Cpu className="text-pink-400" />}
              title="Steganography Suite"
              desc="Advanced tools to hide sensitive text messages inside innocent-looking images."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <footer className="py-12 text-center border-t border-white/5 bg-black relative z-10">
        <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-500">
                <Ghost size={16} />
            </div>
            <p className="text-neutral-500 text-sm">© 2026 GhostDrop Protocol. Open Source.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="relative p-8 rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-neutral-400 leading-relaxed text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}