"use client"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Send, Bot, User, Loader, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED = [
  "What is the main contribution of this paper?",
  "Explain the methodology in simple terms",
  "What are the key findings?",
  "What are the limitations of this research?",
  "What future work is suggested?",
  "How does this compare to existing work?",
]

export default function ChatPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: id,
          message: msg,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!res.ok) throw new Error("Failed to get response")
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }])
    } catch (e) {
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

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-white/8 bg-[#0D0D13] shrink-0">
        <Link
          href={`/dashboard/papers/${id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Paper
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">
              {paper?.title || paper?.file_name}
            </h1>
            <p className="text-xs text-gray-500">Chat with this paper</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">

        {/* Welcome */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-[#00C853]" />
            </div>
            <h2 className="text-white font-semibold mb-1">AI Research Assistant</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Ask me anything about this paper. I'll answer based on the paper's content.
            </p>

            {/* Suggested Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-xl">
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-lg px-3 py-2.5 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
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

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start"
          >
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
              placeholder="Ask anything about this paper..."
              rows={1}
              className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder:text-gray-600 max-h-32"
              style={{ minHeight: "24px" }}
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