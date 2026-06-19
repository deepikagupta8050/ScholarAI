"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Sparkles, Target, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <nav className="flex items-center px-6 md:px-12 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0F]/95 backdrop-blur z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Scholar<span className="text-[#00C853]">AI</span>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            About <span className="text-[#00C853]">ScholarAI</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-12">
            ScholarAI is an AI-powered research intelligence platform built to help researchers, students, and academics work smarter — not harder.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-[#00C853]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Our Mission</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Reading and analyzing research papers takes hours. ScholarAI uses AI to extract summaries, key findings, methodology, and research gaps in seconds — so you can spend more time thinking and less time skimming.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#00C853]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">What We Offer</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  From AI-powered paper analysis and citation generation to literature reviews and research roadmaps, ScholarAI brings together the tools researchers need in one clean, easy-to-use platform — completely free.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#00C853]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Built With Care</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  ScholarAI was built as a passion project to make academic research more accessible. We believe powerful research tools shouldn't be locked behind expensive subscriptions.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-6 py-3 rounded-lg transition">
              Get Started Free
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}