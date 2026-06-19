"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, Map, Loader, RefreshCw, Copy, Check,
  FileText, Calendar, Target, BookOpen, AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const LEVELS = ["Undergraduate", "Masters", "PhD", "Postdoc"]
const DURATIONS = [3, 6, 9, 12]

export default function RoadmapPage() {
  const searchParams = useSearchParams()
  const preSelectedIds = searchParams.get("papers")?.split(",").filter(Boolean) || []

  const [papers, setPapers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedIds)
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState(6)
  const [level, setLevel] = useState("PhD")
  const [roadmap, setRoadmap] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPapers = async () => {
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name, status")
        .eq("status", "processed")
        .order("created_at", { ascending: false })
      setPapers(data || [])
      setPageLoading(false)
    }
    fetchPapers()
  }, [])

  const togglePaper = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const generate = async () => {
    if (!topic.trim()) {
      setError("Please enter a research topic")
      return
    }
    setError("")
    setLoading(true)
    setRoadmap("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          duration_months: duration,
          level,
          paper_ids: selectedIds
        })
      })
      const data = await res.json()
      setRoadmap(data.roadmap)
    } catch {
      setError("Failed to generate roadmap. Please try again.")
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(roadmap)
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Map className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Research Roadmap Generator</h1>
            <p className="text-xs text-gray-500">
              Create a step-by-step plan — optionally based on your papers
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left - Setup */}
        <div className="space-y-4">

          {/* Topic */}
          <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Research Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Biomolecular Condensates in Bacteria"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#00C853]/50 transition placeholder:text-gray-600"
            />
          </div>

          {/* Duration + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Duration
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      duration === d
                        ? "bg-[#00C853] text-black"
                        : "bg-white/5 text-gray-400 hover:text-white"
                    }`}>
                    {d}mo
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Level
              </label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Optional Paper Selection */}
          <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Base on Papers (Optional)
              </label>
              <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Select papers to make the roadmap reference your existing research
            </p>
            {papers.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">No analyzed papers found</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {papers.map(paper => (
                  <button key={paper.id} onClick={() => togglePaper(paper.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition text-left ${
                      selectedIds.includes(paper.id)
                        ? "bg-[#00C853]/10 border-[#00C853]/40"
                        : "bg-white/5 border-white/8 hover:border-white/20"
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedIds.includes(paper.id) ? "bg-[#00C853] border-[#00C853]" : "border-white/20"
                    }`}>
                      {selectedIds.includes(paper.id) && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-xs text-gray-300 truncate flex-1">
                      {paper.title || paper.file_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
              : <><Map className="w-4 h-4" /> Generate Roadmap</>
            }
          </button>
        </div>

        {/* Right - Result */}
        <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
              <Loader className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
              <p className="text-white font-medium text-sm">Creating your roadmap...</p>
              <p className="text-gray-500 text-xs mt-2">
                Planning {duration} months for "{topic}"
              </p>
            </div>
          ) : roadmap ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{duration}-Month Roadmap</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={generate}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition">
                    <RefreshCw className="w-3 h-3" /> Regenerate
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
                <RoadmapFormatted text={roadmap} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
              <Map className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-400 font-medium text-sm">No roadmap generated yet</p>
              <p className="text-gray-600 text-xs mt-1">
                Enter topic and click generate
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function RoadmapFormatted({ text }: { text: string }) {
  const sections = text.split(/(?=##\s)/g).filter(s => s.trim())

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n")
        const headerMatch = lines[0].match(/^##\s*(.+)/)
        const header = headerMatch ? headerMatch[1].trim() : ""
        const body = lines.slice(1).join("\n").trim()

        let icon = <BookOpen className="w-4 h-4 text-gray-400" />
        if (/phase/i.test(header)) icon = <Target className="w-4 h-4 text-yellow-400" />
        if (/resource/i.test(header)) icon = <FileText className="w-4 h-4 text-blue-400" />
        if (/risk/i.test(header)) icon = <AlertCircle className="w-4 h-4 text-red-400" />
        if (/metric|success/i.test(header)) icon = <Check className="w-4 h-4 text-[#00C853]" />

        return (
          <div key={idx} className="bg-white/5 border border-white/8 rounded-lg p-4">
            {header && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/8">
                {icon}
                <h3 className="text-sm font-bold text-white">{header}</h3>
              </div>
            )}
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
          </div>
        )
      })}
    </div>
  )
}