"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, FileText, Target, Loader, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResearchGapPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<any>(null)
  const [gaps, setGaps] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const fetchPaper = async () => {
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name")
        .eq("id", id)
        .single()
      setPaper(data)
      setPageLoading(false)
    }
    fetchPaper()
  }, [id])

  const findGaps = async () => {
    setLoading(true)
    setGaps("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/research-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: id })
      })
      const data = await res.json()
      setGaps(data.gaps)
    } catch {
      setGaps("Failed to identify research gaps. Please try again.")
    }
    setLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      <Link href={`/dashboard/papers/${id}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Paper
      </Link>

      {/* Header */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Research Gap Finder</h1>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {paper?.title || paper?.file_name}
              </p>
            </div>
          </div>
          {gaps && (
            <button
              onClick={findGaps}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <Loader className="w-8 h-8 text-[#00C853] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium text-sm">Analyzing research gaps...</p>
          <p className="text-gray-500 text-xs mt-2">
            AI is deeply analyzing the paper to find unexplored opportunities
          </p>
        </div>
      ) : gaps ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.04] border border-white/8 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/8">
            <Target className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Identified Research Gaps</h2>
          </div>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {gaps}
          </div>
        </motion.div>
      ) : (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
            <Target className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-white font-semibold mb-2">Find Research Gaps</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            AI will analyze this paper and identify unexplored research opportunities and missing areas in the field.
          </p>
          <button
            onClick={findGaps}
            className="bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-6 py-2.5 rounded-lg transition"
          >
            Find Research Gaps
          </button>
        </div>
      )}

    </div>
  )
}