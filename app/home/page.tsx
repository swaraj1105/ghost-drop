"use client";

import { useRef, useEffect } from "react";
import Link from "next/link"; 
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { Ghost, ArrowRight, Zap, Shield, Globe, Cpu, Lock, Fingerprint, Wifi, Github, ExternalLink } from "lucide-react";

// ============================================================
// GHOSTDROP LANDING PAGE 
// ============================================================

export default function LandingPage() {
  useEffect(() => {
    // Inject styles dynamically so you don't need to touch global.css
    const style = document.createElement('style');
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans antialiased selection:bg-indigo-500/30">
      {/* Film grain noise overlay */}
      <div className="noise-overlay" />
      
      <Navbar />
      <GhostHero />
      <ParallaxStats />
      <FeatureSection />
      <GhostFooter />
    </div>
  );
}

// ============================================================
// NAVBAR COMPONENT
// ============================================================
function Navbar() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"]
  );
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.nav
      style={{ backgroundColor }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
      />
      
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-800 rounded-xl flex items-center justify-center border border-white/10">
              <Ghost className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-xl">GhostDrop</span>
        </motion.div>

        {/* CTA Button - FIXED LINK */}
        <Link href="/dashboard/ghost">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex h-11 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black cursor-pointer"
          >
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#666_0%,#fff_50%,#666_100%)]" />
            <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-black px-6 py-1 text-sm font-semibold text-white backdrop-blur-3xl transition-all group-hover:bg-neutral-900">
              Launch App
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  );
}

// ============================================================
// GHOST HERO COMPONENT (MOBILE LAYOUT FIX)
// ============================================================
function GhostHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const blurValue = useTransform(scrollYProgress, [0, 0.5], [0, 10]);
  const blur = useMotionTemplate`blur(${blurValue}px)`;
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  return (
    <section ref={containerRef} className="relative min-h-[150vh] flex flex-col items-center justify-start">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center overflow-hidden">
        
        {/* Grid background */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />

        {/* 1. TEXT CONTAINER 
            Using 'flex-1' makes this expand to fill all empty space.
            'justify-center' keeps the GHOST text perfectly in the middle of that space.
        */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 p-6">
          <motion.div
            className="flex flex-col items-center"
            style={{ filter: blur, opacity, scale }}
          >
            <motion.h1 className="text-[20vw] md:text-[18vw] font-black leading-none text-glow select-none">
              GHOST
            </motion.h1>
            
            <motion.p className="text-neutral-500 text-sm md:text-xl tracking-[0.3em] uppercase mt-4 text-center">
              Leave No Trace
            </motion.p>
          </motion.div>
        </div>

        {/* 2. BUTTON CONTAINER
            This sits naturally at the bottom because the text container above pushed it down.
            'pb-32' adds the breathing room you see in your mobile screenshot.
        */}
        <motion.div
          className="relative z-50 flex flex-col items-center gap-6 pb-32 md:pb-20" 
          initial={{ opacity: 1, y: 0 }}
        >
          <Link href="/dashboard/ghost?action=broadcast">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-12 py-5 bg-white text-black rounded-full font-bold text-xl overflow-hidden glow-indigo cursor-pointer shadow-2xl shadow-indigo-500/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-3">
                <Zap className="w-6 h-6 fill-current" />
                Start Transfer
              </span>
            </motion.button>
          </Link>
          
          <p className="text-neutral-500 text-sm tracking-wide">
            Zero-knowledge P2P transfer
          </p>
        </motion.div>
      </div>
    </section>
  );
}
// ============================================================
// PARALLAX STATS COMPONENT
// ============================================================
const stats = [
  { value: "0", label: "Data Stored" },
  { value: "0", label: "Logs Kept" },
  { value: "∞", label: "Privacy" },
  { value: "256", label: "Bit Encryption" },
];

function ParallaxStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-48 px-6 overflow-hidden">
      {/* Parallax background text */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="text-[30vw] font-black text-white/[0.02] tracking-tighter">
          ZERO
        </span>
      </motion.div>

      <motion.div style={{ y: y2, opacity }} className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-glow">
                {stat.value}
              </div>
              <div className="text-neutral-500 text-sm tracking-[0.3em] uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-24"
        />

        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-24"
        >
          <p className="text-2xl md:text-4xl font-light text-neutral-500 italic max-w-4xl mx-auto leading-relaxed">
            "The best way to keep a secret is to pretend there isn't one."
          </p>
          <cite className="block mt-8 text-sm text-neutral-600 tracking-wide uppercase not-italic">
            — Margaret Atwood
          </cite>
        </motion.blockquote>
      </motion.div>
    </section>
  );
}

// ============================================================
// FEATURE SECTION COMPONENT
// ============================================================
const features = [
  {
    icon: <Globe className="w-8 h-8 text-white" />,
    title: "P2P Mesh Network",
    description: "Data flows directly between devices using WebRTC. Your files never touch our servers. Pure peer-to-peer architecture.",
    direction: "left" as const,
  },
  {
    icon: <Shield className="w-8 h-8 text-white" />,
    title: "AES-256 Encryption",
    description: "Military-grade encryption generated client-side. Even we cannot see what you're sending. Zero-knowledge by design.",
    direction: "right" as const,
  },
  {
    icon: <Cpu className="w-8 h-8 text-white" />,
    title: "Steganography Suite",
    description: "Advanced tools to hide sensitive messages inside innocent-looking images. Invisible to the naked eye.",
    direction: "left" as const,
  },
  {
    icon: <Lock className="w-8 h-8 text-white" />,
    title: "Ephemeral Tunnels",
    description: "Connections exist only during transfer. Once complete, all traces are destroyed. No logs, no history, no evidence.",
    direction: "right" as const,
  },
  {
    icon: <Fingerprint className="w-8 h-8 text-white" />,
    title: "Zero Identity",
    description: "No accounts required. No personal data collected. You remain completely anonymous throughout the process.",
    direction: "left" as const,
  },
  {
    icon: <Wifi className="w-8 h-8 text-white" />,
    title: "Offline Capable",
    description: "Works on local networks without internet. Perfect for air-gapped environments and sensitive operations.",
    direction: "right" as const,
  },
];

function FeatureCard({ 
  icon, 
  title, 
  description, 
  direction, 
  index 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  direction: "left" | "right"; 
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [direction === "left" ? -200 : 200, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{ x, opacity, scale }}
      className="group relative p-8 md:p-12 rounded-3xl bg-neutral-950 border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-8 group-hover:border-white/20 transition-colors">
          {icon}
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
          {title}
        </h3>
        
        <p className="text-neutral-400 text-lg leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="absolute top-8 right-8 text-8xl font-black text-white/5 select-none">
        0{index + 1}
      </div>
    </motion.div>
  );
}

function FeatureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-48 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="text-center mb-24 md:mb-32">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full border border-white/10 text-sm text-neutral-500 tracking-[0.3em] uppercase mb-6"
          >
            Protocol Features
          </motion.span>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Built for
            <br />
            <span className="text-neutral-500">the paranoid.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER COMPONENT
// ============================================================
function GhostFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <footer ref={footerRef} className="relative py-32 md:py-48 px-6 border-t border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-50" />
      
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-12"
        >
          <Ghost className="w-12 h-12 text-neutral-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
        >
          GhostDrop
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-neutral-500 mb-12 max-w-2xl"
        >
          The protocol that doesn't exist.
          <br />
          For data that was never sent.
        </motion.p>

        <motion.a
          href="https://github.com/swaraj1105/ghost-drop"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.4 }}
          className="group inline-flex items-center gap-4 px-8 py-4 rounded-full border border-emerald-500/30 bg-emerald-500/5 glow-emerald transition-all duration-300"
        >
          <Github className="w-5 h-5 text-emerald-400" />
          <span className="text-lg font-medium text-white">Open Source</span>
          <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
        </motion.a>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-neutral-500"
        >
          <span>Protocol v2.0</span>
          <span className="w-1 h-1 rounded-full bg-neutral-500" />
          <span>MIT License</span>
          <span className="w-1 h-1 rounded-full bg-neutral-500" />
          <span>© 2026</span>
        </motion.div>

        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-[40vw] font-black text-white/[0.02] select-none pointer-events-none tracking-tighter">
          G
        </div>
      </motion.div>
    </footer>
  );
}

// ============================================================
// REQUIRED CSS STYLES
// ============================================================
const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #000;
  color: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Film grain noise overlay */
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Glow effects */
.glow-indigo {
  box-shadow: 0 0 60px -10px rgba(99, 102, 241, 0.5),
              0 0 100px -20px rgba(99, 102, 241, 0.3);
}

.glow-emerald {
  box-shadow: 0 0 40px -5px rgba(16, 185, 129, 0.6),
              0 0 80px -10px rgba(16, 185, 129, 0.4);
}

.text-glow {
  text-shadow: 0 0 80px rgba(255, 255, 255, 0.3),
               0 0 40px rgba(255, 255, 255, 0.2);
}
`;