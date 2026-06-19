"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Mail, Send, Check, Loader, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error")
      setErrorMsg("Please fill in all fields")
      return
    }
    if (!email.includes("@")) {
      setStatus("error")
      setErrorMsg("Please enter a valid email")
      return
    }
    setStatus("loading")
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim()
        })
      if (error) throw error
      setStatus("success")
      setName("")
      setEmail("")
      setMessage("")
    } catch {
      setStatus("error")
      setErrorMsg("Failed to send message. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <nav className="flex items-center px-6 md:px-12 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0F]/95 backdrop-blur z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Scholar<span className="text-[#00C853]">AI</span>
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mb-5">
            <Mail className="w-6 h-6 text-[#00C853]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Get in Touch</h1>
          <p className="text-gray-400 text-sm mb-8">
            Have a question, feedback, or found a bug? We'd love to hear from you.
          </p>

          {status === "success" ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-xl p-8 text-center">
              <Check className="w-10 h-10 text-[#00C853] mx-auto mb-3" />
              <h2 className="text-white font-semibold mb-1">Message Sent!</h2>
              <p className="text-gray-400 text-sm">We'll get back to you as soon as possible.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600 resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={status === "loading"}
                className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-50 text-black font-bold py-3 rounded-lg transition"
              >
                {status === "loading"
                  ? <><Loader className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}