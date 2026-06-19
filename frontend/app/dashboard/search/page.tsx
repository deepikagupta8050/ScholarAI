"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Loader, ExternalLink, Users, Calendar,
  Quote, Download, BookmarkPlus, Check, AlertCircle, FileText
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  year: number | null
  venue: string
  citations: number
  url: string
  pdf_url: string | null
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("")
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError("")
    setSearched(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search-papers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), limit: 15 })
      })
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setPapers(data.papers || [])
    } catch {
      setError("Failed to search papers. Please try again.")
      setPapers([])
    }
    setLoading(false)
  }

  const saveToMyPapers = async (paper: Paper) => {
    if (!paper.pdf_url) {
      setError(`"${paper.title}" has no open-access PDF available to save.`)
      return
    }
    setSavingId(paper.id)
    setError("")
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      const pdfRes = await fetch(paper.pdf_url)
      if (!pdfRes.ok) throw new Error("Could not fetch PDF")
      const blob = await pdfRes.blob()
      const fileName = `${userId}/${Date.now()}_${paper.title.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`

      const { error: storageError } = await supabase.storage
        .from("papers")
        .upload(fileName, blob)
      if (storageError) throw storageError

      const { error: dbError } = await supabase.from("papers").insert({
        user_id: userId,
        file_name: `${paper.title}.pdf`,
        file_path: fileName,
        file_size: blob.size,
        title: paper.title,
        abstract: paper.abstract,
        status: "processing",
      })
      if (dbError) throw dbError

      setSavedIds(prev => [...prev, paper.id])
    } catch (e: any) {
      setError(`Failed to save "${paper.title}". ${e.message || ""}`)
    }
    setSavingId(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Semantic Search</h1>
        <p className="text-gray-500 text-sm mt-1">
          Discover research papers from across the web and save them to your library
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00C853]/50 transition">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search by topic, keyword, or research area..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-5 py-3 rounded-xl transition shrink-0"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !searched ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Search millions of research papers</p>
          <p className="text-gray-600 text-sm mt-1">
            Try "machine learning", "CRISPR gene editing", "climate change models"
          </p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No papers found</p>
          <p className="text-gray-600 text-sm mt-1">Try a different search query</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{papers.length} papers found</p>
          {papers.map((paper, i) => (
            <motion.div key={paper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/[0.04] border border-white/8 hover:border-white/15 rounded-xl p-5 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-white leading-snug flex-1">
                  {paper.title}
                </h3>
                {paper.url && (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white shrink-0 transition">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap mb-3 text-xs text-gray-500">
                {paper.authors.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                  </span>
                )}
                {paper.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Quote className="w-3 h-3" />
                  {paper.citations.toLocaleString()} citations
                </span>
                {paper.venue && paper.venue !== "Unknown venue" && (
                  <span className="text-gray-600">{paper.venue}</span>
                )}
              </div>

              <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4">
                {paper.abstract}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveToMyPapers(paper)}
                  disabled={savingId === paper.id || savedIds.includes(paper.id)}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition ${
                    savedIds.includes(paper.id)
                      ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30 cursor-default"
                      : paper.pdf_url
                      ? "bg-[#00C853] hover:bg-[#00a844] text-black"
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {savingId === paper.id ? (
                    <><Loader className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : savedIds.includes(paper.id) ? (
                    <><Check className="w-3.5 h-3.5" /> Saved to My Papers</>
                  ) : (
                    <><BookmarkPlus className="w-3.5 h-3.5" /> {paper.pdf_url ? "Save to My Papers" : "PDF Not Available"}</>
                  )}
                </button>
                {paper.pdf_url && (
                  <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition">
                    <Download className="w-3.5 h-3.5" />
                    View PDF
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  )
}