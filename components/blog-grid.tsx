import Link from "next/link"
import { ArrowRight } from "lucide-react"

// Updated Data with High-Quality Tech Images
const POSTS = [
  {
    id: 1,
    title: "Building Scalable React Applications",
    excerpt: "A deep dive into architectural patterns that help React applications grow without pain.",
    date: "Dec 10, 2023",
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop", // React/Code image
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
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop", // Collaboration
  },
  {
    id: 4,
    title: "Building Distributed Systems with Rust",
    excerpt: "An exploration of building fault-tolerant distributed systems using Rust and its async ecosystem.",
    date: "Feb 15, 2024",
    category: "Rust",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop", // Chip/Hardware
  },
  {
    id: 5,
    title: "Zero-Knowledge Proofs Explained",
    excerpt: "Understanding ZK-SNARKs and their applications in modern cryptography.",
    date: "Jan 28, 2024",
    category: "Cryptography",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop", // Matrix/Security
  },
  {
    id: 6,
    title: "React Server Components Deep Dive",
    excerpt: "A comprehensive guide to React Server Components and their impact on web performance.",
    date: "Mar 01, 2024",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop", // Coding Screen
  },
]

export function BlogGrid() {
  return (
    <section className="py-24 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">Latest Posts</h2>
          <p className="text-neutral-400 hidden md:block">Technical deep dives and engineering insights.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
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
  )
}