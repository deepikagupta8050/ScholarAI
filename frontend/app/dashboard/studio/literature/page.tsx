"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, BookOpen, Loader,
  RefreshCw, Copy, Check, FileText
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LiteratureReviewPage() {
  const searchParams = useSearchParams()
  const preSelectedIds = searchParams.get("papers")?.split(",").filter(Boolean) || []

  const [papers, setPapers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedIds)
  const [topic, setTopic] = useState("")
  const [review, setReview] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPapers = async () => {
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name, status, novelty_score")
        .eq("status", "processed")
        .order("created_at", { ascending: false })
      setPapers(data || [])
      setPageLoading(false)
    }
    fetchPapers()
  }, [])

  const togglePaper = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev
    )
  }

  const generate = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least 1 paper")
      return
    }
    if (!topic.trim()) {
      setError("Please enter a research topic")
      return
    }
    setError("")
    setLoading(true)
    setReview("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/literature-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_ids: selectedIds,
          topic: topic.trim()
        })
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setReview(data.review)
    } catch {
      setError("Failed to generate. Please try again.")
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(review)
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      <Link href="/dashboard/papers"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
        <ArrowLeft className="w-4 h-4" />
        Back to My Papers
      </Link>

      {/* Header */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Literature Review Generator</h1>
            <p className="text-xs text-gray-500">
              Select 1-10 analyzed papers and enter your topic
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left - Setup */}
        <div className="space-y-4">

          {/* Topic Input */}
          <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Research Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Deep Learning in Healthcare, RNA Polymerase..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
            />
          </div>

          {/* Paper Selection */}
          <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Select Papers ({selectedIds.length} selected • max 10)
              </label>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-gray-500 hover:text-white transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {papers.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No analyzed papers found</p>
                <p className="text-gray-600 text-xs mt-1">
                  Upload and analyze papers first
                </p>
                <Link href="/dashboard/papers"
                  className="text-[#00C853] text-xs hover:underline mt-2 inline-block">
                  Go to My Papers →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {papers.map(paper => (
                  <button
                    key={paper.id}
                    onClick={() => togglePaper(paper.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition text-left ${
                      selectedIds.includes(paper.id)
                        ? "bg-[#00C853]/10 border-[#00C853]/40"
                        : "bg-white/5 border-white/8 hover:border-white/20"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedIds.includes(paper.id)
                        ? "bg-[#00C853] border-[#00C853]"
                        : "border-white/20"
                    }`}>
                      {selectedIds.includes(paper.id) && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {paper.title || paper.file_name}
                      </p>
                    </div>
                    {paper.novelty_score && (
                      <span className="text-xs font-bold text-[#00C853] shrink-0">
                        {paper.novelty_score}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              ⚠ {error}
            </p>
          )}

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading || selectedIds.length === 0 || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
              : <><BookOpen className="w-4 h-4" /> Generate Literature Review</>
            }
          </button>
        </div>

        {/* Right - Result */}
        <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
              <Loader className="w-8 h-8 text-purple-400 animate-spin mb-4" />
              <p className="text-white font-medium text-sm">Generating literature review...</p>
              <p className="text-gray-500 text-xs mt-2">
                AI is analyzing {selectedIds.length} paper{selectedIds.length > 1 ? "s" : ""} on "{topic}"
              </p>
              <p className="text-gray-600 text-xs mt-1">This may take 30-60 seconds</p>
            </div>
          ) : review ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Generated Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={generate}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition">
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                  <button onClick={copy}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition ${
                      copied
                        ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                        : "text-gray-400 hover:text-white border border-white/10 hover:border-white/20"
                    }`}>
                    {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {review}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
              <BookOpen className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-400 font-medium text-sm">No review generated yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Select papers, enter topic and click generate
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}