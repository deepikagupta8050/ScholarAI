"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, FileText, Target, Loader, RefreshCw, Copy, Check, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function MultiResearchGapPage() {
  const searchParams = useSearchParams()
  const paperIds = searchParams.get("papers")?.split(",").filter(Boolean) || []

  const [papers, setPapers] = useState<any[]>([])
  const [gaps, setGaps] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPapers = async () => {
      if (paperIds.length === 0) {
        setPageLoading(false)
        return
      }
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name")
        .in("id", paperIds)
      setPapers(data || [])
      setPageLoading(false)
    }
    fetchPapers()
  }, [])

  const findGaps = async () => {
    setLoading(true)
    setGaps("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/multi-research-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_ids: paperIds })
      })
      const data = await res.json()
      setGaps(data.gaps)
    } catch {
      setGaps("Failed to identify research gaps. Please try again.")
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(gaps)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (paperIds.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <Users className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-white font-semibold mb-2">Select Multiple Papers</h2>
        <p className="text-gray-500 text-sm mb-5">
          Please select at least 2 papers from My Papers to find combined research gaps
        </p>
        <Link href="/dashboard/papers"
          className="bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-5 py-2.5 rounded-lg transition text-sm">
          Go to My Papers
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      <Link href="/dashboard/papers"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to My Papers
      </Link>

      {/* Header */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">
                Combined Research Gap Finder
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Analyzing {papers.length} papers together
              </p>
            </div>
          </div>
          {gaps && (
            <div className="flex items-center gap-2">
              <button onClick={copy}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition ${
                  copied
                    ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                    : "text-gray-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button onClick={findGaps}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Paper Reference List */}
<div className="mt-4 pt-4 border-t border-white/8">
  <p className="text-xs text-gray-500 mb-2 font-medium">Papers Being Analyzed:</p>
  <div className="space-y-1.5">
    {papers.map((p, i) => (
      <div key={i}
        className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2">
        <span className="text-xs font-bold text-[#00C853] shrink-0 w-6">[{i + 1}]</span>
        <FileText className="w-3 h-3 text-red-400 shrink-0" />
        <span className="text-xs text-gray-300 truncate">
          {p.title || p.file_name}
        </span>
      </div>
    ))}
  </div>
</div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <Loader className="w-8 h-8 text-[#00C853] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium text-sm">Analyzing gaps across {papers.length} papers...</p>
          <p className="text-gray-500 text-xs mt-2">
            Finding patterns, contradictions, and missing connections
          </p>
        </div>
      ) : gaps ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.04] border border-white/8 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/8">
            <Target className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Combined Research Gaps</h2>
          </div>
          <ResearchGapFormatted text={gaps} />
        </motion.div>
      ) : (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
            <Target className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-white font-semibold mb-2">Find Combined Research Gaps</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            AI will analyze all {papers.length} papers together to find patterns, contradictions, and unexplored connections between them.
          </p>
          <button
            onClick={findGaps}
            className="bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-6 py-2.5 rounded-lg transition"
          >
            Find Combined Gaps
          </button>
        </div>
      )}

    </div>
  )
}

function ResearchGapFormatted({ text }: { text: string }) {
  const lines = text.split("\n")

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />

        if (/^\*\*Gap\s*\d+/i.test(trimmed) || /^##\s*Gap\s*\d+/i.test(trimmed)) {
          const clean = trimmed.replace(/\*\*/g, "").replace(/^##\s*/, "")
          return (
            <h3 key={i} className="text-white font-bold text-sm mt-5 mb-2 pb-2 border-b border-white/8">
              {clean}
            </h3>
          )
        }

        const labelMatch = trimmed.match(/^[-•]?\s*\*{0,2}(Description|Evidence|Impact|Opportunity)\*{0,2}:\s*(.*)/i)
        if (labelMatch) {
          return (
            <p key={i} className="text-sm leading-relaxed pl-3">
              <span className="text-orange-400 font-semibold">{labelMatch[1]}: </span>
              <span className="text-gray-300">{labelMatch[2]}</span>
            </p>
          )
        }

        if (/^\d+\./.test(trimmed)) {
          return (
            <p key={i} className="text-gray-300 text-sm leading-relaxed font-medium mt-4">
              {trimmed}
            </p>
          )
        }

        return (
          <p key={i} className="text-gray-300 text-sm leading-relaxed">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}