"use client"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Send, Bot, User, Loader, FileText, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED = [
  "Compare the methodologies of these papers",
  "What are the common findings across papers?",
  "What are the key differences between these papers?",
  "Which paper has the most significant contribution?",
  "What research gaps exist across all papers?",
  "Summarize all papers in one paragraph",
]

export default function MultiChatPage() {
  const searchParams = useSearchParams()
  const paperIds = searchParams.get("papers")?.split(",") || []
  const [papers, setPapers] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPapers = async () => {
      if (paperIds.length === 0) return
      const { data } = await supabase
        .from("papers")
        .select("id, title, file_name, status")
        .in("id", paperIds)
      setPapers(data || [])
      setPageLoading(false)
    }
    fetchPapers()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput("")

    const userMsg: Message = { role: "user", content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/multi-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_ids: paperIds,
          message: msg,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again."
      }])
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

  if (paperIds.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <Users className="w-12 h-12 text-gray-600 mb-4" />
        <h2 className="text-white font-semibold mb-2">Select Multiple Papers</h2>
        <p className="text-gray-500 text-sm mb-5">
          Please select at least 2 papers from My Papers to use Multi Paper Chat
        </p>
        <Link href="/dashboard/papers"
          className="bg-[#00C853] hover:bg-[#00a844] text-black font-bold px-5 py-2.5 rounded-lg transition text-sm">
          Go to My Papers
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-white/8 bg-[#0D0D13] shrink-0">
        <Link href="/dashboard/papers"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to My Papers
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[#00C853]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white">
              Multi Paper Chat ({papers.length} papers)
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {papers.map(p => p.title || p.file_name).join(" • ")}
            </p>
          </div>
        </div>

        {/* Paper chips */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {papers.map((p, i) => (
            <div key={i}
              className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1">
              <FileText className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-xs text-gray-300 truncate max-w-[150px]">
                {p.title || p.file_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">

        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-[#00C853]" />
            </div>
            <h2 className="text-white font-semibold mb-1">Multi Paper AI Assistant</h2>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              Ask me to compare, analyze, or find patterns across all {papers.length} selected papers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-lg px-3 py-2.5 transition">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#00C853]" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#00C853]/15 text-white border border-[#00C853]/20"
                  : "bg-white/[0.06] text-gray-200 border border-white/8"
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#00C853]" />
            </div>
            <div className="bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[#00C853] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-[#00C853] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-[#00C853] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4 border-t border-white/8 bg-[#0D0D13] shrink-0">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#00C853]/40 transition">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={`Ask about all ${papers.length} papers...`}
              rows={1}
              className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600 max-h-32"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-[#00C853] hover:bg-[#00a844] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition shrink-0"
          >
            {loading
              ? <Loader className="w-4 h-4 text-black animate-spin" />
              : <Send className="w-4 h-4 text-black" />
            }
          </button>
        </div>
        <p className="text-center text-gray-700 text-xs mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>

    </div>
  )
}