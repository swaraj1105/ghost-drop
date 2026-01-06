"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  
  // --- SECRET TRIGGER STATE ---
  const [clickCount, setClickCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState(false)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Handle the Logo Click (The Trigger)
  const handleLogoClick = () => {
    setClickCount((prev) => prev + 1)

    // Clear existing timeout to reset the 2-second window
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    // Reset count if user stops clicking for 2 seconds
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0)
    }, 2000)

    // If 5 clicks reached
    if (clickCount + 1 >= 5) {
      setShowModal(true)
      setClickCount(0)
      setInputValue("")
      setError(false)
    }
  }

  // 2. Handle Password Submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue === "ghost") {
        // SUCCESS
        localStorage.setItem("ghost_token", "ACCESS_GRANTED")
        router.push("/uplink") // <--- NEW DESTINATION (The Landing Page)
        setShowModal(false)
      } else {
        // FAILURE
        setError(true)
        setInputValue("") // Clear input
      }
    }
  }

  // 3. Handle Closing (Escape Key)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

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
              <a href="#work" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Work
              </a>
              <a href="#blog" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Blog
              </a>
              <a href="#about" className="text-sm text-neutral-400 hover:text-white transition-colors">
                About
              </a>
              <a
                href="#contact"
                className="px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Contact
              </a>
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
                type="password" // Or "text" if you want to see the letters
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError(false)
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
  )
}