"use client"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Upload, FileText, Search, Eye, MessageSquare,
  Trash2, X, CheckCircle, AlertCircle,
  CloudUpload, Grid, List, BookOpen, Users, Target, Map
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function PapersPage() {
  const router = useRouter()
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [dragOver, setDragOver] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedPapers, setSelectedPapers] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchPapers() }, [])

  const fetchPapers = async () => {
    const { data } = await supabase
      .from("papers")
      .select("*")
      .order("created_at", { ascending: false })
    setPapers(data || [])
    setLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setUploadError("Please upload a valid PDF file")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size must be less than 20MB")
      return
    }
    setUploading(true)
    setUploadError("")
    setUploadProgress(0)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      const fileName = `${userId}/${Date.now()}_${file.name}`

      setUploadStep("Uploading PDF...")
      setUploadProgress(20)
      const { error: storageError } = await supabase.storage
        .from("papers").upload(fileName, file)
      if (storageError) throw storageError

      setUploadStep("Saving paper...")
      setUploadProgress(50)
      const { error: dbError } = await supabase
        .from("papers")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          title: file.name.replace(".pdf", ""),
          status: "processing",
        })
      if (dbError) throw dbError

      setUploadStep("Done!")
      setUploadProgress(100)
      setUploadSuccess(true)
      await fetchPapers()

      setTimeout(() => {
        setUploading(false)
        setUploadSuccess(false)
        setUploadProgress(0)
        setUploadStep("")
      }, 2000)
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.")
      setUploading(false)
      setUploadProgress(0)
      setUploadStep("")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from("papers").remove([filePath])
    await supabase.from("papers").delete().eq("id", id)
    setPapers(prev => prev.filter(p => p.id !== id))
    setSelectedPapers(prev => prev.filter(pid => pid !== id))
  }

  const toggleSelect = (id: string) => {
    setSelectedPapers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const filtered = papers.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Papers</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {papers.length === 0
              ? "Upload research papers to get started"
              : `${papers.length} paper${papers.length > 1 ? "s" : ""} uploaded`}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-4 py-2.5 rounded-lg transition"
        >
          <Upload className="w-4 h-4" />
          Upload Paper
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${dragOver ? "border-[#00C853] bg-[#00C853]/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]"}
          ${uploading ? "cursor-not-allowed" : ""}`}
      >
        {uploading ? (
          <div className="space-y-4">
            {uploadSuccess ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex flex-col items-center gap-3">
                <CheckCircle className="w-10 h-10 text-[#00C853]" />
                <p className="text-[#00C853] font-medium">Upload Successful!</p>
              </motion.div>
            ) : (
              <>
                <CloudUpload className="w-10 h-10 text-[#00C853] animate-pulse mx-auto" />
                <p className="text-white text-sm font-medium">{uploadStep}</p>
                <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div className="h-full bg-[#00C853] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }} />
                </div>
                <p className="text-gray-500 text-xs">{uploadProgress}%</p>
              </>
            )}
          </div>
        ) : (
          <>
            <CloudUpload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">Drag & drop your PDF here</p>
            <p className="text-gray-500 text-xs">
              or <span className="text-[#00C853]">browse files</span> — Max 20MB
            </p>
          </>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm flex-1">{uploadError}</p>
            <button onClick={() => setUploadError("")}><X className="w-4 h-4 text-red-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi Select Action Bar */}
      <AnimatePresence>
        {selectedPapers.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
          >
            <span className="text-[#00C853] text-sm font-medium">
              {selectedPapers.length} papers selected
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button
                onClick={() => {
                  const ids = selectedPapers.join(",")
                  router.push(`/dashboard/studio/chat?papers=${ids}`)
                }}
                className="flex items-center gap-2 bg-[#00C853] hover:bg-[#00a844] text-black text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat with Selected
              </button>
              <button
  onClick={() => {
    const ids = selectedPapers.join(",")
    router.push(`/dashboard/studio/literature?papers=${ids}`)
  }}
  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold px-3 py-2 rounded-lg transition border border-purple-500/30"
>
  <BookOpen className="w-3.5 h-3.5" />
  Literature Review
</button>
<button
  onClick={() => {
    const ids = selectedPapers.join(",")
    router.push(`/dashboard/studio/gap?papers=${ids}`)
  }}
  className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold px-3 py-2 rounded-lg transition border border-orange-500/30"
>
  <Target className="w-3.5 h-3.5" />
  Research Gap
</button>
<button
  onClick={() => {
    const ids = selectedPapers.join(",")
    router.push(`/dashboard/studio/roadmap?papers=${ids}`)
  }}
  className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-bold px-3 py-2 rounded-lg transition border border-yellow-500/30"
>
  <Map className="w-3.5 h-3.5" />
  Roadmap
</button>
              <button
                onClick={() => setSelectedPapers([])}
                className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-white/10 transition"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + View */}
      {papers.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input type="text" placeholder="Search papers..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-gray-600" />
          </div>
          {selectedPapers.length > 0 && (
            <span className="text-xs text-gray-400">
              {selectedPapers.length} selected
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Papers */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No papers yet</p>
          <p className="text-gray-600 text-sm mt-1">Upload your first PDF to get started</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No papers found for "{searchQuery}"</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filtered.map((paper, i) => (
            <motion.div key={paper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-4 border rounded-xl transition group ${
                selectedPapers.includes(paper.id)
                  ? "bg-[#00C853]/5 border-[#00C853]/30"
                  : "bg-white/[0.04] border-white/8 hover:border-white/15"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(paper.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                  selectedPapers.includes(paper.id)
                    ? "bg-[#00C853] border-[#00C853]"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                {selectedPapers.includes(paper.id) && (
                  <CheckCircle className="w-3 h-3 text-black" />
                )}
              </button>

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/papers/${paper.id}`}
                  className="text-sm font-medium text-white truncate block hover:text-[#00C853] transition">
                  {paper.title || paper.file_name}
                </Link>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-600">
                    {new Date(paper.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                  {paper.file_size && (
                    <span className="text-xs text-gray-600">
                      {(paper.file_size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    paper.status === "processed"
                      ? "bg-[#00C853]/10 text-[#00C853]"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {paper.status === "processed" ? "Analyzed" : "Processing"}
                  </span>
                </div>
              </div>

              {paper.novelty_score && (
                <div className="text-sm font-bold text-[#00C853] shrink-0">
                  {paper.novelty_score}%
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                <Link href={`/dashboard/papers/${paper.id}`}
                  className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition"
                  title="View">
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <Link href={`/dashboard/papers/${paper.id}/chat`}
                  className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-gray-400 hover:text-white transition"
                  title="Chat">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(paper.id, paper.file_path)}
                  className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 transition"
                  title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((paper, i) => (
            <motion.div key={paper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 border rounded-xl transition ${
                selectedPapers.includes(paper.id)
                  ? "bg-[#00C853]/5 border-[#00C853]/30"
                  : "bg-white/[0.04] border-white/8 hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelect(paper.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                      selectedPapers.includes(paper.id)
                        ? "bg-[#00C853] border-[#00C853]"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {selectedPapers.includes(paper.id) && (
                      <CheckCircle className="w-3 h-3 text-black" />
                    )}
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                {paper.novelty_score && (
                  <span className="text-xs font-bold text-[#00C853]">{paper.novelty_score}%</span>
                )}
              </div>
              <Link href={`/dashboard/papers/${paper.id}`}>
                <h3 className="text-sm font-medium text-white hover:text-[#00C853] transition line-clamp-2 mb-2">
                  {paper.title || paper.file_name}
                </h3>
              </Link>
              <p className="text-xs text-gray-600 mb-3">
                {new Date(paper.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </p>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/papers/${paper.id}`}
                  className="flex-1 text-center text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white py-1.5 rounded-lg transition">
                  View
                </Link>
                <Link href={`/dashboard/papers/${paper.id}/chat`}
                  className="flex-1 text-center text-xs bg-[#00C853]/10 hover:bg-[#00C853]/20 text-[#00C853] py-1.5 rounded-lg transition">
                  Chat
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  )
}

