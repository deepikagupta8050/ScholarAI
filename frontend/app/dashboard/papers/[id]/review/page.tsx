"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, FileText, Shield, Loader,
  RefreshCw, Copy, Check, CheckCircle2,
  AlertTriangle, XCircle, MessageCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function PeerReviewPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<any>(null)
  const [review, setReview] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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

  const generateReview = async () => {
    setLoading(true)
    setReview("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/peer-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_id: id })
      })
      const data = await res.json()
      setReview(data.review)
    } catch {
      setReview("Failed to generate review. Please try again.")
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
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">AI Peer Review</h1>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {paper?.title || paper?.file_name}
              </p>
            </div>
          </div>
          {review && (
            <div className="flex items-center gap-2">
              <button onClick={copy}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition ${
                  copied
                    ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                    : "text-gray-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button onClick={generateReview}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <Loader className="w-8 h-8 text-[#00C853] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium text-sm">Conducting peer review...</p>
          <p className="text-gray-500 text-xs mt-2">
            Analyzing strengths, weaknesses, and technical accuracy
          </p>
        </div>
      ) : review ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PeerReviewFormatted text={review} />
        </motion.div>
      ) : (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-white font-semibold mb-2">Get AI Peer Review</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            AI will conduct a rigorous peer review like a senior reviewer at a top-tier journal — covering strengths, weaknesses, and recommendations.
          </p>
          <button
            onClick={generateReview}
            className="bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-6 py-2.5 rounded-lg transition"
          >
            Generate Peer Review
          </button>
        </div>
      )}

    </div>
  )
}

function PeerReviewFormatted({ text }: { text: string }) {
  const sections = text.split(/(?=##\s)/g).filter(s => s.trim())

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n")
        const headerLine = lines[0]
        const headerMatch = headerLine.match(/^##\s*(.+)/)
        const header = headerMatch ? headerMatch[1].trim() : ""
        const body = lines.slice(1).join("\n").trim()

        // Decision section gets special card
        if (header.toLowerCase().includes("decision")) {
          const recMatch = body.match(/\*{0,2}Recommendation:?\*{0,2}\s*:?\s*([^\n]+)/i)
          const confMatch = body.match(/\*{0,2}Confidence:?\*{0,2}\s*:?\s*([^\n]+)/i)
          const scoreMatch = body.match(/\*{0,2}Overall Score:?\*{0,2}\s*:?\s*([^\n]+)/i)
          const rec = recMatch ? recMatch[1].trim() : ""
          const isPositive = /accept/i.test(rec) && !/reject/i.test(rec)
          const isReject = /reject/i.test(rec)

          return (
            <div key={idx} className={`rounded-xl p-5 border ${
              isReject ? "bg-red-500/5 border-red-500/30" :
              isPositive ? "bg-[#00C853]/5 border-[#00C853]/30" :
              "bg-yellow-500/5 border-yellow-500/30"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                {isReject ? <XCircle className="w-5 h-5 text-red-400" /> :
                 isPositive ? <CheckCircle2 className="w-5 h-5 text-[#00C853]" /> :
                 <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                <h3 className="text-sm font-bold text-white">Editorial Decision</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Recommendation</p>
                  <p className={`text-sm font-bold ${
                    isReject ? "text-red-400" : isPositive ? "text-[#00C853]" : "text-yellow-400"
                  }`}>{rec || "Pending"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Confidence</p>
                  <p className="text-sm font-bold text-white">{confMatch ? confMatch[1].trim() : "—"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Overall Score</p>
                  <p className="text-sm font-bold text-white">{scoreMatch ? scoreMatch[1].trim() : "—"}</p>
                </div>
              </div>
            </div>
          )
        }

        // Determine icon/color by section type
        let icon = <FileText className="w-4 h-4 text-gray-400" />
        let color = "text-white"
        if (header.toLowerCase().includes("strength")) {
          icon = <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
          color = "text-[#00C853]"
        } else if (header.toLowerCase().includes("weakness")) {
          icon = <AlertTriangle className="w-4 h-4 text-orange-400" />
          color = "text-orange-400"
        } else if (header.toLowerCase().includes("recommendation")) {
          icon = <MessageCircle className="w-4 h-4 text-blue-400" />
          color = "text-blue-400"
        } else if (header.toLowerCase().includes("comment")) {
          icon = <MessageCircle className="w-4 h-4 text-purple-400" />
          color = "text-purple-400"
        }

        return (
          <div key={idx} className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            {header && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/8">
                {icon}
                <h3 className={`text-sm font-bold ${color}`}>{header}</h3>
              </div>
            )}
            <div className="space-y-2">
              {body.split("\n").map((line, i) => {
                const trimmed = line.trim()
                if (!trimmed) return null
                const numbered = trimmed.match(/^\d+\.\s*\*{0,2}(.+?)\*{0,2}:\s*(.*)/)
                if (numbered) {
                  return (
                    <div key={i} className="flex gap-2">
                      <span className={`text-xs font-bold shrink-0 mt-0.5 ${color}`}>•</span>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="text-white font-medium">{numbered[1]}</span>
                        {numbered[2] && `: ${numbered[2]}`}
                      </p>
                    </div>
                  )
                }
                return (
                  <p key={i} className="text-sm text-gray-300 leading-relaxed">
                    {trimmed.replace(/^\d+\.\s*/, "")}
                  </p>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}