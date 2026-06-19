"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly, such as your name and email when you create an account, and the research papers you upload for analysis. We do not collect more than what's necessary to provide our services."
    },
    {
      title: "How We Use Your Information",
      content: "Your uploaded papers are processed using AI to generate summaries, citations, and insights. Your account information is used solely to manage your access to ScholarAI and is never sold to third parties."
    },
    {
      title: "Data Storage & Security",
      content: "All papers and account data are stored securely using industry-standard encryption via Supabase. Access to your data is restricted to your account only through row-level security policies."
    },
    {
      title: "Third-Party Services",
      content: "We use Groq for AI-powered analysis of your papers. Paper content may be sent to these services for processing but is not stored by them beyond the request."
    },
    {
      title: "Your Rights",
      content: "You can access, update, or delete your account and all associated data at any time from your Settings page. Deleting your account permanently removes all uploaded papers and analysis data."
    },
    {
      title: "Cookies",
      content: "We use minimal cookies necessary for authentication and session management. We do not use tracking cookies for advertising purposes."
    },
    {
      title: "Changes to This Policy",
      content: "We may update this privacy policy from time to time. Continued use of ScholarAI after changes constitutes acceptance of the updated policy."
    },
  ]

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <nav className="flex items-center px-6 md:px-12 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0F]/95 backdrop-blur z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Scholar<span className="text-[#00C853]">AI</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mb-5">
            <Shield className="w-6 h-6 text-[#00C853]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-xs mb-10">Last updated: June 2026</p>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="text-base font-semibold text-white mb-2">{s.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Questions about our privacy practices? <Link href="/contact" className="text-[#00C853] hover:underline">Contact us</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}