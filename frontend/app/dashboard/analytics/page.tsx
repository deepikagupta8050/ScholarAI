"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, FileText, Award, Calendar,
  BarChart3, PieChart as PieChartIcon
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts"
import { supabase } from "@/lib/supabase"

const COLORS = ["#00C853", "#FFA726", "#42A5F5", "#AB47BC", "#EF5350", "#26C6DA"]

export default function AnalyticsPage() {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("papers")
        .select("id, title, novelty_score, status, created_at")
        .order("created_at", { ascending: true })
      setPapers(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const analyzed = papers.filter(p => p.status === "processed")
  const avgNovelty = analyzed.length > 0
    ? Math.round(analyzed.reduce((sum, p) => sum + (p.novelty_score || 0), 0) / analyzed.length)
    : 0
  const topPaper = analyzed.length > 0
    ? analyzed.reduce((max, p) => (p.novelty_score || 0) > (max.novelty_score || 0) ? p : max, analyzed[0])
    : null

  // Novelty distribution
  const noveltyDistribution = [
    { name: "High (80+)", value: analyzed.filter(p => (p.novelty_score || 0) >= 80).length, color: "#00C853" },
    { name: "Medium (60-79)", value: analyzed.filter(p => (p.novelty_score || 0) >= 60 && (p.novelty_score || 0) < 80).length, color: "#FFA726" },
    { name: "Lower (<60)", value: analyzed.filter(p => (p.novelty_score || 0) < 60).length, color: "#EF5350" },
  ].filter(d => d.value > 0)

  // Upload trend by date (cumulative, sorted chronologically)
  const dateGroups: Record<string, { date: Date; count: number }> = {}
  papers.forEach(p => {
    const d = new Date(p.created_at)
    const key = d.toISOString().split("T")[0]
    if (!dateGroups[key]) {
      dateGroups[key] = { date: d, count: 0 }
    }
    dateGroups[key].count += 1
  })
  const sortedDates = Object.values(dateGroups).sort((a, b) => a.date.getTime() - b.date.getTime())
  let cumulative = 0
  const trendData = sortedDates.map(({ date, count }) => {
    cumulative += count
    return {
      day: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      papers: cumulative
    }
  })

  // Novelty per paper (top 8)
  const noveltyBarData = analyzed
    .slice(-8)
    .map(p => ({
      name: (p.title || "Untitled").slice(0, 15) + "...",
      score: p.novelty_score || 0
    }))

  const stats = [
    { label: "Total Papers", value: papers.length, icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Analyzed", value: analyzed.length, icon: TrendingUp, color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
    { label: "Avg Novelty", value: analyzed.length > 0 ? `${avgNovelty}%` : "—", icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "This Month", value: papers.filter(p => {
        const d = new Date(p.created_at)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length, icon: Calendar, color: "text-orange-400", bg: "bg-orange-400/10" },
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Insights into your research activity and paper quality
        </p>
      </div>

      {papers.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-16 text-center">
          <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h2 className="text-white font-semibold mb-2">No Data Yet</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Upload and analyze papers to see your research analytics here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Upload Trend */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00C853]" />
                Upload Trend
              </h2>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={11} />
                    <YAxis stroke="#6B7280" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line type="monotone" dataKey="papers" stroke="#00C853" strokeWidth={2} dot={{ fill: "#00C853", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-xs text-center py-12">Not enough data</p>
              )}
            </motion.div>

            {/* Novelty Distribution */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                Novelty Distribution
              </h2>
              {noveltyDistribution.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie data={noveltyDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {noveltyDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {noveltyDistribution.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-gray-400 flex-1">{d.name}</span>
                        <span className="text-xs font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center py-12">Analyze papers to see distribution</p>
              )}
            </motion.div>
          </div>

          {/* Novelty Scores Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Recent Papers - Novelty Scores
            </h2>
            {noveltyBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={noveltyBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis stroke="#6B7280" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {noveltyBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 80 ? "#00C853" : entry.score >= 60 ? "#FFA726" : "#EF5350"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-xs text-center py-12">No analyzed papers yet</p>
            )}
          </motion.div>

          {/* Top Paper */}
          {topPaper && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-r from-[#00C853]/10 to-transparent border border-[#00C853]/20 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00C853]/20 border border-[#00C853]/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#00C853]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Highest Novelty Paper</p>
                  <p className="text-sm font-bold text-white truncate">{topPaper.title}</p>
                </div>
                <div className="text-xl font-bold text-[#00C853] shrink-0">
                  {topPaper.novelty_score}%
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

    </div>
  )
}