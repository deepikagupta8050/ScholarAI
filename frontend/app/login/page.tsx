"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Please fill in all fields"); return }

    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    window.location.href = "/dashboard"
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
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
            <h1 className="text-lg font-bold text-white mt-3">Welcome back</h1>
            <p className="text-gray-400 text-xs mt-1">Log in to continue your research journey</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-[#00C853]/50 transition">
                <Mail className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                <input type="email" placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-gray-500" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-[#00C853]/50 transition">
                <Lock className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-gray-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 accent-[#00C853]" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-xs text-[#00C853] hover:underline">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#00C853] hover:bg-[#00a844] disabled:opacity-60 text-black font-bold py-2.5 rounded-lg transition text-sm mt-1">
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-gray-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 rounded-lg py-2.5 text-xs text-white transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-[#00C853] hover:underline font-medium">Sign up</a>
          </p>
        </div>
      </motion.div>
    </main>
  )
}