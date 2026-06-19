"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim()) { setError("Please enter your email address"); return }
    if (!email.includes("@")) { setError("Please enter a valid email"); return }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="bg-[#111117] border border-white/10 rounded-2xl p-6">

          <div className="text-center mb-6">
            <a href="/" className="text-xl font-bold text-white">
              Scholar<span className="text-[#00C853]">AI</span>
            </a>
          </div>

          {!sent ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-lg font-bold text-white">Forgot Password?</h1>
                <p className="text-gray-400 text-xs mt-1">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-3">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-[#00C853]/50 transition">
                    <Mail className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00C853] hover:bg-[#00a844] disabled:opacity-60 text-black font-bold py-2.5 rounded-lg transition text-sm"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                Remember your password?{" "}
                <a href="/login" className="text-[#00C853] hover:underline font-medium">Log in</a>
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#00C853]/10 border-2 border-[#00C853] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#00C853]" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your email!</h2>
              <p className="text-gray-400 text-xs mb-6">
                We've sent a password reset link to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <a href="/login" className="w-full bg-[#00C853] hover:bg-[#00a844] text-black font-bold py-2.5 rounded-lg transition text-sm block text-center">
                Back to Login
              </a>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-gray-400 hover:text-white mt-3 transition"
              >
                Didn't receive? Try again
              </button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </main>
  )
}