"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#111117] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#00C853]/10 border-2 border-[#00C853] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00C853]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Password Updated!</h2>
          <p className="text-gray-400 text-xs mb-6">You can now log in with your new password.</p>
          <a href="/login" className="block w-full bg-[#00C853] hover:bg-[#00a844] text-black font-bold py-2.5 rounded-lg transition text-sm text-center">
            Go to Login
          </a>
        </motion.div>
      </main>
    )
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
            <h1 className="text-lg font-bold text-white mt-3">Reset Your Password</h1>
            <p className="text-gray-400 text-xs mt-1">Enter your new password below</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-3">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">New Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-[#00C853]/50 transition">
                <Lock className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                <input type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-gray-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Confirm New Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-[#00C853]/50 transition">
                <Lock className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-gray-500" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#00C853] hover:bg-[#00a844] disabled:opacity-60 text-black font-bold py-2.5 rounded-lg transition text-sm mt-1">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  )
}