"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// --- 1. NAVBAR COMPONENT (Contains Secret Logic) ---
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

    // Clear existing timeout to reset the 2-second window
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Reset count if user stops clicking for 2 seconds
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    // If 5 clicks reached
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
        // SUCCESS
        localStorage.setItem("ghost_token", "ACCESS_GRANTED");
        router.push("/uplink"); // <--- Redirects to your REAL app
        setShowModal(false);
      } else {
        // FAILURE
        setError(true);
        setInputValue(""); // Clear input
      }
    }
  };

  // Handle Closing (Escape Key)
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
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* LOGO - CLICK THIS 5 TIMES */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg" />
              <span className="font-semibold text-white">DevLog</span>
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

      {/* --- THE SECRET MODAL (THE RABBIT HOLE) --- */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setShowModal(false)} // Close on background click
        >
          <div 
            className="w-full max-w-2xl p-8 font-mono text-green-500"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
          >
            <div className="mb-4 text-lg animate-pulse">
              {">"} INITIALIZING SECURE CONNECTION...
            </div>
            
            <div className="flex items-center gap-3 text-xl">
              <span className="shrink-0">{">"} ENTER PASSPHRASE:</span>
              <input
                autoFocus
                type="password"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(false);
                }}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-b border-green-500/50 outline-none text-green-500 w-full focus:border-green-500 transition-colors placeholder-green-900"
                placeholder="_"
              />
            </div>

            {error && (
              <div className="mt-4 text-red-500 font-bold tracking-widest animate-bounce">
                {">"} ACCESS DENIED
              </div>
            )}
            
            <div className="mt-12 text-xs text-neutral-600">
              Press ESC to abort connection.
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