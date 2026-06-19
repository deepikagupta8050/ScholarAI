"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, FileText, Copy, Check, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase"

const FORMATS = ["APA", "IEEE", "MLA", "Chicago"]

export default function CitationPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [citations, setCitations] = useState<Record<string, string>>({})
  const [activeFormat, setActiveFormat] = useState("APA")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPaper = async () => {
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name, status")
        .eq("id", id)
        .single()
      setPaper(data)
      setPageLoading(false)
    }
    fetchPaper()
  }, [id])

  const generateCitation = async (format: string) => {
    if (citations[format]) {
      setActiveFormat(format)
      return
    }
    setActiveFormat(format)
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/citation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: id, format })
      })
      const data = await res.json()
      setCitations(prev => ({ ...prev, [format]: data.citation }))
    } catch {
      setCitations(prev => ({ ...prev, [format]: "Failed to generate citation. Please try again." }))
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (citations[activeFormat]) {
      navigator.clipboard.writeText(citations[activeFormat])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

      {/* Paper Info */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Citation Generator</h1>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {paper?.title || paper?.file_name}
            </p>
          </div>
        </div>
      </div>

      {/* Format Tabs */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
        <div className="flex border-b border-white/8">
          {FORMATS.map(format => (
            <button
              key={format}
              onClick={() => generateCitation(format)}
              className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
                activeFormat === format
                  ? "text-[#00C853] border-[#00C853]"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {format}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[#00C853] animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Generating {activeFormat} citation...</p>
            </div>
          ) : citations[activeFormat] ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-gray-200 text-sm leading-relaxed font-mono">
                  {citations[activeFormat]}
                </p>
              </div>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  copied
                    ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                }`}
              >
                {copied
                  ? <><Check className="w-4 h-4" /> Copied!</>
                  : <><Copy className="w-4 h-4" /> Copy Citation</>
                }
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-white font-medium text-sm mb-2">
                Generate {activeFormat} Citation
              </p>
              <p className="text-gray-500 text-xs mb-5 max-w-xs">
                Click the button below to generate a properly formatted {activeFormat} citation for this paper.
              </p>
              <button
                onClick={() => generateCitation(activeFormat)}
                className="bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-5 py-2 rounded-lg transition"
              >
                Generate {activeFormat} Citation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* All Formats */}
      {Object.keys(citations).length > 0 && (
        <div className="mt-5 bg-white/[0.04] border border-white/8 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Generated Citations</h2>
          <div className="space-y-3">
            {Object.entries(citations).map(([format, citation]) => (
              <div key={format} className="bg-white/5 border border-white/8 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#00C853]">{format}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(citation)
                    }}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">{citation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}