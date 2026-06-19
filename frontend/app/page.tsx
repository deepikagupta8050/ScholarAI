"use client"
import { motion } from "framer-motion"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Brain, Search, Target, FileText, MessageSquare,
  Network, Star, BookOpen, Shield, BookMarked,
  Map, TrendingUp, Bot, BarChart2, Clock, Lock,
  FlaskConical, GraduationCap, Building2, Newspaper,
  ChevronRight, Menu, X
} from "lucide-react"

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

  const tools = [
    { icon: Brain, title: "AI Paper Analysis", desc: "Extract key insights, summaries, and methodologies instantly." },
    { icon: Search, title: "Semantic Search", desc: "Search across papers using natural language queries." },
    { icon: Target, title: "Research Gap Finder", desc: "Identify unexplored areas and future opportunities." },
    { icon: FileText, title: "Literature Review", desc: "Generate comprehensive literature reviews in minutes." },
    { icon: MessageSquare, title: "Multi-Paper Chat", desc: "Chat with multiple papers and compare insights." },
    { icon: Network, title: "Research Graph", desc: "Visualize connections between papers and authors." },
    { icon: Star, title: "Novelty Score", desc: "Calculate originality and novelty score for your work." },
    { icon: BookOpen, title: "Citation Generator", desc: "Generate citations in APA, MLA, IEEE, Chicago formats." },
    { icon: Shield, title: "AI Peer Review", desc: "Get AI-powered peer review and improvement suggestions." },
    { icon: BookMarked, title: "Journal Recommendation", desc: "Find the best journals and conferences for your paper." },
    { icon: Map, title: "Research Roadmap", desc: "Get a step-by-step research plan with milestones." },
    { icon: TrendingUp, title: "Research Trends", desc: "Discover trending topics and future research directions." },
  ]

  const features = [
    { icon: Bot, title: "AI-Powered", desc: "Advanced models for better research insights" },
    { icon: BarChart2, title: "Evidence Based", desc: "Insights backed by actual research papers" },
    { icon: Clock, title: "Time Saving", desc: "Automate repetitive research tasks instantly" },
    { icon: Lock, title: "Secure & Private", desc: "Your research data is safe and confidential" },
  ]

  const solutions = [
    { icon: FlaskConical, title: "Researchers", desc: "Accelerate your research with AI-driven insights." },
    { icon: GraduationCap, title: "Students", desc: "Understand complex topics and improve academic writing." },
    { icon: Building2, title: "Institutions", desc: "Empower teams with advanced research intelligence." },
    { icon: Newspaper, title: "Publishers", desc: "Enhance discoverability and research impact." },
  ]

  const steps = [
    { num: "1", title: "Upload Papers", desc: "Upload your research papers in PDF format" },
    { num: "2", title: "AI Analysis", desc: "AI analyzes and extracts key insights automatically" },
    { num: "3", title: "Discover Insights", desc: "Uncover trends, gaps, and opportunities" },
    { num: "4", title: "Take Action", desc: "Write, cite, and publish better research" },
  ]

  const plans = [
    {
      name: "Free Forever", price: "₹0", period: "no credit card required",
      features: ["Unlimited Paper Uploads", "AI-Powered Analysis", "Chat with Papers", "Citation Generator", "Semantic Search", "Research Gap Finder", "Literature Review", "Research Graph"],
      cta: "Get Started Free", highlight: true
    },
  ]

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#0A0A0F]/95 backdrop-blur">
        <button onClick={() => scrollTo("hero")} className="text-2xl font-bold tracking-tight">
          Scholar<span className="text-[#00C853]">AI</span>
        </button>
        <div className="hidden md:flex items-center gap-8 text-gray-400 text-sm">
          <button onClick={() => scrollTo("features")} className="hover:text-white transition">Features</button>
          <button onClick={() => scrollTo("how")} className="hover:text-white transition">How it Works</button>
          <button onClick={() => scrollTo("tools")} className="hover:text-white transition">Research Tools</button>
          <button onClick={() => scrollTo("pricing")} className="hover:text-white transition">Pricing</button>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-400 hover:text-white transition px-4 py-2">Log in</a>
          <a href="/signup" className="text-sm bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-5 py-2 rounded-lg transition">Get Started</a>
        </div>
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-[#111117] border-b border-white/10 px-6 py-4 flex flex-col gap-4 text-sm text-gray-400">
          <button onClick={() => scrollTo("features")} className="text-left hover:text-white">Features</button>
          <button onClick={() => scrollTo("how")} className="text-left hover:text-white">How it Works</button>
          <button onClick={() => scrollTo("tools")} className="text-left hover:text-white">Research Tools</button>
          <button onClick={() => scrollTo("pricing")} className="text-left hover:text-white">Pricing</button>
          <a href="/login" className="hover:text-white">Log in</a>
          <a href="/signup" className="bg-[#00C853] text-black font-bold px-4 py-2 rounded-lg text-center">Get Started</a>
        </div>
      )}

      {/* HERO */}
      <section id="hero" className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="text-xs border border-[#00C853]/40 text-[#00C853] px-3 py-1 rounded-full mb-6 inline-block tracking-widest uppercase">
            ✦ AI-Powered Research Intelligence
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mt-4">
            AI-Powered<br />
            <span className="text-[#00C853]">Research Intelligence</span><br />
            for Smarter Discoveries
          </h1>
          <p className="text-gray-400 mt-6 text-lg md:text-xl max-w-2xl mx-auto">
            Discover insights, identify research gaps, and accelerate your research journey with advanced AI tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a href="/signup" className="bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-8 py-3 rounded-lg transition w-full sm:w-auto text-center flex items-center justify-center gap-2">
              Start Your Research <ChevronRight className="w-4 h-4" />
            </a>
            <button onClick={() => scrollTo("tools")} className="border border-white/20 hover:border-white/50 text-white px-8 py-3 rounded-lg transition w-full sm:w-auto text-center">
              Explore Research Tools
            </button>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Your Research Journey, <span className="text-[#00C853]">Simplified</span></h2>
          <p className="text-gray-400 text-center mb-12">4 simple steps to smarter research</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-[#00C853] flex items-center justify-center text-[#00C853] text-xl font-bold bg-[#00C853]/10">
                  {s.num}
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base">{s.title}</h3>
                <p className="text-gray-400 text-xs md:text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose <span className="text-[#00C853]">ScholarAI</span>?</h2>
          <p className="text-gray-400 text-center mb-12">Built for serious researchers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#00C853]/40 transition">
                <div className="w-10 h-10 rounded-lg bg-[#00C853]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#00C853]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEARCH TOOLS */}
      <section id="tools" className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Powerful <span className="text-[#00C853]">AI Tools</span> for Every Research Stage</h2>
        <p className="text-gray-400 text-center mb-12">Everything you need in one platform</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#00C853]/50 transition cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-[#00C853]/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#00C853]" />
              </div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-[#00C853] transition">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="px-6 py-20 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12"><span className="text-[#00C853]">Solutions</span> for Every Researcher</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {solutions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-white/10 hover:border-[#00C853]/30 transition">
                <div className="w-12 h-12 rounded-full bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-[#00C853]" />
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base">{s.title}</h3>
                <p className="text-gray-400 text-xs md:text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, <span className="text-[#00C853]">Transparent</span> Pricing</h2>
        <p className="text-gray-400 text-center mb-12">No hidden costs. No credit card. Just research.</p>
        <div className="grid grid-cols-1 gap-6">
          {plans.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-8 border border-[#00C853] bg-[#00C853]/5 text-center">
              <div className="text-xs text-[#00C853] font-bold mb-3 uppercase tracking-wider">100% Free</div>
              <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
              <div className="text-4xl font-bold text-white mb-1">{p.price}</div>
              <div className="text-gray-400 text-sm mb-6">{p.period}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-left max-w-md mx-auto">
                {p.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-[#00C853]">✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="/signup" className="inline-block text-center py-2.5 px-8 rounded-lg font-bold transition text-sm bg-[#00C853] text-black hover:bg-[#00a844]">
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-gray-400 mb-8">Join researchers worldwide using ScholarAI</p>
          <a href="/signup" className="bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-8 py-3 rounded-lg transition inline-flex items-center gap-2">
            Get Started Free <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-400">
          <div>
            <div className="text-white font-bold text-xl mb-3">Scholar<span className="text-[#00C853]">AI</span></div>
            <p className="text-gray-500 text-xs leading-relaxed">AI-powered research intelligence platform for researchers, students, and institutions.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => scrollTo("features")} className="text-left hover:text-white transition">Features</button>
              <button onClick={() => scrollTo("tools")} className="text-left hover:text-white transition">Research Tools</button>
              <button onClick={() => scrollTo("pricing")} className="text-left hover:text-white transition">Pricing</button>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <div className="flex flex-col gap-2">
              <a href="/about" className="hover:text-white transition">About</a>
              <a href="/contact" className="hover:text-white transition">Contact</a>
              <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Stay Updated</h4>
            <p className="text-xs text-gray-500 mb-3">Get the latest research insights straight to your inbox.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="text-center text-gray-600 text-xs mt-8 pt-8 border-t border-white/5">
          © 2026 ScholarAI. All rights reserved.
        </div>
      </footer>

    </main>
  )
}
function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const subscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      setStatus("error")
      setMessage("Please enter a valid email")
      return
    }
    setStatus("loading")
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() })

      if (error) {
        if (error.code === "23505") {
          setStatus("error")
          setMessage("You're already subscribed!")
        } else {
          throw error
        }
      } else {
        setStatus("success")
        setMessage("Subscribed successfully!")
        setEmail("")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Try again.")
    }
    setTimeout(() => setStatus("idle"), 3000)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && subscribe()}
          placeholder="Enter your email"
          disabled={status === "loading"}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white flex-1 outline-none focus:border-[#00C853]"
        />
        <button
          onClick={subscribe}
          disabled={status === "loading"}
          className="bg-[#00C853] text-black px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#00a844] transition disabled:opacity-50"
        >
          {status === "loading" ? "..." : "→"}
        </button>
      </div>
      {message && (
        <p className={`text-xs mt-2 ${status === "success" ? "text-[#00C853]" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  )
}