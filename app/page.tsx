import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { BlogGrid } from "@/components/blog-grid"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <main>
        <Hero />
        <BlogGrid />
      </main>
      <Footer />
    </div>
  )
}
