"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Ghost } from "lucide-react"; 

// --- 1. NAVBAR COMPONENT (Mobile Responsive Fix Applied) ---
function Navbar() {
  const router = useRouter();
  
  // --- SECRET TRIGGER STATE ---
  const [clickCount, setClickCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle the Logo Click (The Trigger)
  const handleLogoClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setClickCount(0), 2000);

    if (clickCount + 1 >= 5) {
      setShowModal(true);
      setClickCount(0);
      setInputValue("");
      setError(false);
    }
  };

  // Handle Password Submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue === "ghost") {
        localStorage.setItem("ghost_token", "ACCESS_GRANTED");
        router.push("/uplink");
        setShowModal(false);
      } else {
        setError(true);
        setInputValue("");
      }
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-6xl">
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg shadow-inner" />
              <span className="font-semibold text-white tracking-tight">DevLog</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#work" className="text-sm text-neutral-400 hover:text-white transition-colors">Work</a>
              <a href="#blog" className="text-sm text-neutral-400 hover:text-white transition-colors">Blog</a>
              <a href="#about" className="text-sm text-neutral-400 hover:text-white transition-colors">About</a>
              <a href="#contact" className="px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MODERN GHOST AUTH MODAL (MOBILE FIXED) --- */}
      {showModal && (
        <div 
          // 🟢 FIX: 'items-start pt-24' keeps it at the top on mobile so keyboard doesn't hide it
          className="fixed inset-0 z-50 flex items-start pt-24 md:items-center md:pt-0 justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-[90%] max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
                <Ghost 
                  size={32} 
                  className={`${error ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]"} transition-all duration-300`} 
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Restricted Access</h3>
              <p className="text-neutral-500 text-sm mb-8 text-center">
                Authentication required. Enter passphrase to secure uplink.
              </p>

              <div className="w-full relative group">
                <input
                  autoFocus
                  type="password" // 🟢 Changed to text temporarily if you want to see what you type, but password is standard
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={handleKeyDown}
                  // 🟢 Added 'mb-2' to ensure spacing on mobile
                  className={`w-full bg-neutral-950/50 border ${error ? "border-red-500/50 focus:border-red-500" : "border-neutral-800 focus:border-indigo-500"} rounded-xl px-4 py-4 text-center text-white outline-none transition-all placeholder:text-neutral-700 tracking-widest`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
              </div>

              {error && (
                <p className="mt-4 text-red-500 text-xs font-medium tracking-wide animate-pulse">
                  INCORRECT PASSPHRASE
                </p>
              )}
            </div>
            
            <div className="bg-neutral-950 p-4 text-center border-t border-neutral-800">
               <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium">
                  Press ESC to Cancel
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- 2. HERO COMPONENT ---
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden pt-20">
      {/* Glowing gradient blob background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-indigo-600/30 via-cyan-500/20 to-purple-600/30 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6">
          Building the future of the web.
        </h1>
        <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Exploring distributed systems, cryptography, and UI engineering.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4">
          <a href="#blog" className="px-6 py-3 bg-white text-neutral-950 font-medium rounded-lg hover:bg-neutral-200 transition-colors">
            Read my blog
          </a>
          <a href="#work" className="px-6 py-3 border border-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-900 transition-colors">
            View projects
          </a>
        </div>
      </div>
    </section>
  );
}

// --- 3. BLOG GRID COMPONENT ---
const POSTS = [
  {
    id: 1,
    title: "Building Scalable React Applications",
    excerpt: "A deep dive into architectural patterns that help React applications grow without pain.",
    date: "Dec 10, 2023",
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Understanding Event-Driven Architecture",
    excerpt: "How event-driven patterns can decouple services and improve system reliability.",
    date: "Nov 25, 2023",
    category: "Distributed Systems",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", 
  },
  {
    id: 3,
    title: "Contributing to Your First OSS Project",
    excerpt: "A practical guide to making meaningful contributions to open source software.",
    date: "Jan 8, 2024",
    category: "Open Source",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Building Distributed Systems with Rust",
    excerpt: "An exploration of building fault-tolerant distributed systems using Rust and its async ecosystem.",
    date: "Feb 15, 2024",
    category: "Rust",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Zero-Knowledge Proofs Explained",
    excerpt: "Understanding ZK-SNARKs and their applications in modern cryptography.",
    date: "Jan 28, 2024",
    category: "Cryptography",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "React Server Components Deep Dive",
    excerpt: "A comprehensive guide to React Server Components and their impact on web performance.",
    date: "Mar 01, 2024",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
  },
];

function BlogGrid() {
  return (
    <section id="blog" className="py-24 px-4 md:px-6 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">Latest Posts</h2>
          <p className="text-neutral-400 hidden md:block">Technical deep dives and engineering insights.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Link
              key={post.id}
              href={`#`} // Just a placeholder link for the decoy
              className="group relative flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden transition-all hover:border-neutral-700 hover:bg-neutral-900"
            >
              {/* IMAGE SECTION */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* CONTENT SECTION */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                    {post.category}
                  </span>
                  <span className="text-xs text-neutral-500">{post.date}</span>
                </div>
                
                <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h3>
                <p className="mb-6 flex-1 text-sm text-neutral-400 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center text-sm font-medium text-indigo-400">
                  Read article
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 4. FOOTER COMPONENT ---
function Footer() {
  return (
    <footer className="border-t border-neutral-800 py-12 px-4 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500">© 2025 Full Stack Engineer. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-neutral-500 hover:text-white transition-colors"><span className="sr-only">GitHub</span>GitHub</a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors"><span className="sr-only">Twitter</span>Twitter</a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors"><span className="sr-only">LinkedIn</span>LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- 5. MAIN PAGE EXPORT ---
export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main>
        <Hero />
        <BlogGrid />
      </main>
      <Footer />
    </div>
  );
}