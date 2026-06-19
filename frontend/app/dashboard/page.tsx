"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  FileText, Sparkles, TrendingUp, Clock,
  Upload, ArrowRight, ChevronRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      const { data: p } = await supabase
        .from("papers")
        .select("id, title, file_name, created_at, novelty_score, status")
        .order("created_at", { ascending: false })
      setPapers(p || [])
      setLoading(false)
    }
    load()
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Researcher"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const analyzed = papers.filter(p => p.status === "processed")
  const avgNovelty = analyzed.length > 0
    ? Math.round(analyzed.reduce((sum, p) => sum + (p.novelty_score || 0), 0) / analyzed.length)
    : null

  // Real estimate: ~2 hours saved per analyzed paper (reading + summarizing manually)
  const hoursSaved = analyzed.length * 2

  const recentPapers = papers.slice(0, 5)

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {papers.length === 0
            ? "Upload your first paper to get started."
            : "Here's an overview of your research activity."}
        </p>
      </motion.div>

      {/* Stats - Sirf Real Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Papers",
            value: papers.length,
            sub: papers.length === 0 ? "no papers yet" : "uploaded",
            icon: FileText,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-400/10",
          },
          {
            label: "Analyzed",
            value: analyzed.length,
            sub: analyzed.length === 0 ? "no papers analyzed" : `of ${papers.length} papers`,
            icon: Sparkles,
            iconColor: "text-purple-400",
            iconBg: "bg-purple-400/10",
          },
          {
            label: "Avg Novelty",
            value: avgNovelty !== null ? `${avgNovelty}%` : "—",
            sub: avgNovelty !== null ? "across analyzed papers" : "available after AI analysis",
            icon: TrendingUp,
            iconColor: "text-[#00C853]",
            iconBg: "bg-[#00C853]/10",
          },
          {
            label: "Hours Saved",
            value: hoursSaved > 0 ? `${hoursSaved}h` : "—",
            sub: hoursSaved > 0 ? "est. reading time saved" : "available after AI analysis",
            icon: Clock,
            iconColor: "text-orange-400",
            iconBg: "bg-orange-400/10",
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-4 hover:border-white/15 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 ${s.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* No Papers State */}
      {papers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.04] border border-white/8 rounded-2xl p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7 text-[#00C853]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Upload Your First Paper</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
            Upload a research paper and our AI will automatically analyze it — summaries, gaps, scores and more.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            {["Upload PDF", "AI Analysis", "Get Insights"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center text-[#00C853] text-xs font-bold">
                  {i + 1}
                </div>
                {s}
                {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/papers"
            className="inline-flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-6 py-2.5 rounded-lg transition text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Your First Paper
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Papers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white/[0.04] border border-white/8 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Recent Papers</h2>
              <Link href="/dashboard/papers" className="flex items-center gap-1 text-xs text-[#00C853] hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentPapers.map((paper, i) => (
                <Link
                  key={i}
                  href={`/dashboard/papers/${paper.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate group-hover:text-[#00C853] transition">
                      {paper.title || paper.file_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {new Date(paper.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </div>
                  </div>
                  {paper.status === "processed" && paper.novelty_score && (
                    <span className="text-xs font-bold text-[#00C853] shrink-0">
                      {paper.novelty_score}%
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#00C853] transition shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* AI Insights - real, derived from analyzed papers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">AI Insights</h2>
            </div>

            {analyzed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-gray-400 text-xs font-medium">No insights yet</p>
                <p className="text-gray-600 text-xs mt-1 max-w-[160px]">
                  Analyze a paper with AI to see insights here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {analyzed.slice(0, 4).map((paper, i) => (
                  <Link
                    key={i}
                    href={`/dashboard/papers/${paper.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-white/5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#00C853]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 group-hover:text-white truncate transition">
                        {paper.title || paper.file_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {paper.novelty_score}% novelty
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      )}
    </div>
  )
}