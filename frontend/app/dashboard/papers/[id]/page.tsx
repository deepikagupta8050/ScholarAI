"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, FileText, Download, Star,
  MessageSquare, BookOpen, Target, BookMarked,
  Map, Shield, ChevronRight, RefreshCw,
  CheckCircle, AlertCircle, Loader
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const tabs = ["Overview", "Summary", "Key Findings", "Methodology", "Limitations", "Future Scope"]

export default function PaperDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [paper, setPaper] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("Overview")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPaper()
  }, [id])

  const fetchPaper = async () => {
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      router.push("/dashboard/papers")
      return
    }
    setPaper(data)
    setLoading(false)
  }

  const analyzePaper = async () => {
    setAnalyzing(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze/${id}`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Analysis failed")
      await fetchPaper()
    } catch (e: any) {
      setError("Analysis failed. Please try again.")
    }
    setAnalyzing(false)
  }

  const getTabContent = () => {
    if (!paper) return ""
    switch (activeTab) {
      case "Overview": return paper.abstract || paper.summary
      case "Summary": return paper.summary
      case "Key Findings": return paper.key_findings
      case "Methodology": return paper.methodology
      case "Limitations": return paper.limitations
      case "Future Scope": return paper.future_scope
      default: return ""
    }
  }

  const actions = [
    { icon: MessageSquare, label: "Chat with Paper", href: `/dashboard/papers/${id}/chat`, color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: BookOpen, label: "Literature Review", href: `/dashboard/studio/literature?papers=${id}`, color: "text-purple-400", bg: "bg-purple-400/10" },
    { icon: Target, label: "Research Gap", href: `/dashboard/papers/${id}/gap`, color: "text-orange-400", bg: "bg-orange-400/10" },
    { icon: BookMarked, label: "Citation Generator", href: `/dashboard/papers/${id}/citation`, color: "text-green-400", bg: "bg-green-400/10" },
    { icon: Shield, label: "AI Peer Review", href: `/dashboard/papers/${id}/review`, color: "text-red-400", bg: "bg-red-400/10" },
    { icon: Map, label: "Research Roadmap", href: `/dashboard/studio/roadmap?papers=${id}`, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isProcessed = paper.status === "processed"
  const tabContent = getTabContent()

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Back */}
      <Link href="/dashboard/papers"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to My Papers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white leading-tight">
                  {paper.title || paper.file_name}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-gray-500">
                    {new Date(paper.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                  {paper.file_size && (
                    <span className="text-xs text-gray-500">
                      {(paper.file_size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    isProcessed
                      ? "bg-[#00C853]/10 text-[#00C853]"
                      : paper.status === "error"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {isProcessed && <CheckCircle className="w-3 h-3" />}
                    {paper.status === "error" && <AlertCircle className="w-3 h-3" />}
                    {isProcessed ? "Analyzed" : paper.status === "error" ? "Error" : "Processing"}
                  </span>
                </div>
              </div>
              <button
  onClick={async () => {
    const { data } = await supabase.storage
      .from("papers")
      .download(paper.file_path)
    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = paper.file_name
      a.click()
    }
  }}
  className="p-2 hover:bg-white/8 rounded-lg transition text-gray-400 hover:text-white shrink-0"
>
  <Download className="w-4 h-4" />
</button>
            </div>

            {/* Analyze Button */}
            {!isProcessed && (
              <div className="mt-4 pt-4 border-t border-white/8">
                {error && (
                  <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
                <button
                  onClick={analyzePaper}
                  disabled={analyzing}
                  className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-60 text-black text-sm font-bold px-4 py-2 rounded-lg transition"
                >
                  {analyzing
                    ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</>
                    : <><RefreshCw className="w-4 h-4" /> Analyze with AI</>
                  }
                </button>
                {analyzing && (
                  <p className="text-gray-500 text-xs mt-2">
                    This may take 30-60 seconds...
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">

            <div className="flex overflow-x-auto border-b border-white/8">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                    activeTab === tab
                      ? "text-[#00C853] border-[#00C853]"
                      : "text-gray-400 border-transparent hover:text-white"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5 min-h-[200px]">
              {!isProcessed ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {analyzing ? (
                    <>
                      <Loader className="w-8 h-8 text-[#00C853] animate-spin mb-4" />
                      <p className="text-white font-medium text-sm">AI is analyzing your paper...</p>
                      <p className="text-gray-500 text-xs mt-2">Extracting insights, findings, and more</p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-gray-600 mb-4" />
                      <p className="text-gray-400 text-sm font-medium">Paper not analyzed yet</p>
                      <p className="text-gray-600 text-xs mt-1">Click "Analyze with AI" to get insights</p>
                    </>
                  )}
                </div>
              ) : tabContent ? (
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {tabContent}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No content available for this section</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Novelty Score */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Novelty & Impact</h2>
            {paper.novelty_score ? (
              <div className="space-y-3">
                {[
                  { label: "Novelty Score", value: paper.novelty_score },
                  { label: "Impact Score", value: Math.round(paper.novelty_score * 0.95) },
                  { label: "Originality", value: Math.round(paper.novelty_score * 0.98) },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{s.label}</span>
                      <span className="text-xs font-bold text-[#00C853]">{s.value}%</span>
                    </div>
                    <div className="w-full bg-white/8 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.value}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                        className="bg-[#00C853] h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-xs">Available after AI analysis</p>
              </div>
            )}
          </motion.div>

          {/* Journal */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Journal Recommendation</h2>
            {paper.journal_recommendation ? (
              <div className="bg-[#00C853]/5 border border-[#00C853]/20 rounded-lg p-3">
                <p className="text-sm text-white font-medium">{paper.journal_recommendation}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-3">Available after AI analysis</p>
            )}
          </motion.div>

          {/* AI Tools */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">AI Tools</h2>
            <div className="space-y-1.5">
              {actions.map((action, i) => (
                <Link key={i} href={action.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition group">
                  <div className={`w-7 h-7 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                    <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition flex-1">
                    {action.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition" />
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}