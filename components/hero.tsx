export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Glowing gradient blob background */}
      <div className="absolute inset-0 flex items-center justify-center">
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
          <a
            href="#blog"
            className="px-6 py-3 bg-white text-neutral-950 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Read my blog
          </a>
          <a
            href="#work"
            className="px-6 py-3 border border-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-900 transition-colors"
          >
            View projects
          </a>
        </div>
      </div>
    </section>
  )
}
