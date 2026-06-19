"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import * as d3 from "d3"
import { FileText, Loader, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Node {
  id: string
  title: string
  novelty_score: number
  created_at: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link {
  source: string | Node
  target: string | Node
  strength: "strong" | "weak"
}

export default function ResearchGraphPage() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [error, setError] = useState("")

  const fetchGraph = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graph-data`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setNodes(data.nodes || [])
      setLinks(data.links || [])
    } catch {
      setError("Failed to load research graph")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGraph()
  }, [])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0 || loading) return

    const container = containerRef.current
    const width = container?.clientWidth || 800
    const height = 600

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg.append("g")

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })
    svg.call(zoom)
    zoomBehaviorRef.current = zoom

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any)
        .id((d: any) => d.id)
        .distance((d: any) => d.strength === "strong" ? 100 : 180)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(45))

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => d.strength === "strong" ? "#00C853" : "#4B5563")
      .attr("stroke-opacity", (d: any) => d.strength === "strong" ? 0.6 : 0.3)
      .attr("stroke-width", (d: any) => d.strength === "strong" ? 2 : 1)

    // Node groups
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )
      .on("click", (event, d: any) => {
        setSelectedNode(d)
      })
      .on("dblclick", (event, d: any) => {
        router.push(`/dashboard/papers/${d.id}`)
      })

    // Node circles (size based on novelty score)
    nodeGroup.append("circle")
      .attr("r", (d: any) => 20 + (d.novelty_score || 50) / 5)
      .attr("fill", (d: any) => {
        const score = d.novelty_score || 50
        if (score >= 80) return "#00C853"
        if (score >= 60) return "#FFA726"
        return "#EF5350"
      })
      .attr("fill-opacity", 0.2)
      .attr("stroke", (d: any) => {
        const score = d.novelty_score || 50
        if (score >= 80) return "#00C853"
        if (score >= 60) return "#FFA726"
        return "#EF5350"
      })
      .attr("stroke-width", 2)

    // Icon in center
    nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "16px")
      .text("📄")

    // Labels below
    nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => 35 + (d.novelty_score || 50) / 5)
      .attr("font-size", "10px")
      .attr("fill", "#D1D5DB")
      .text((d: any) => {
        const t = d.title || "Untitled"
        return t.length > 25 ? t.slice(0, 25) + "..." : t
      })

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => { simulation.stop() }
  }, [nodes, links, loading])

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 1.3)
  }

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 0.7)
  }

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Graph</h1>
          <p className="text-gray-500 text-sm mt-1">
            Visualize connections between your research papers
          </p>
        </div>
        <button
          onClick={fetchGraph}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-20 text-center">
          <Loader className="w-8 h-8 text-[#00C853] animate-spin mx-auto mb-4" />
          <p className="text-white font-medium text-sm">Analyzing paper relationships...</p>
          <p className="text-gray-500 text-xs mt-2">AI is mapping connections between your papers</p>
        </div>
      ) : error ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-20 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : nodes.length < 2 ? (
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-16 text-center">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h2 className="text-white font-semibold mb-2">Not Enough Papers Yet</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Upload and analyze at least 2 papers to see how they connect in the research graph.
          </p>
          <Link href="/dashboard/papers"
            className="bg-[#00C853] hover:bg-[#00a844] text-black text-sm font-bold px-5 py-2.5 rounded-lg transition">
            Go to My Papers
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Graph */}
          <div ref={containerRef}
            className="lg:col-span-3 bg-white/[0.02] border border-white/8 rounded-xl overflow-hidden relative">

            {/* Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button onClick={handleZoomIn}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg flex items-center justify-center text-gray-300 transition">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg flex items-center justify-center text-gray-300 transition">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleReset}
                className="w-8 h-8 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg flex items-center justify-center text-gray-300 transition">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-[#0D0D13]/90 border border-white/10 rounded-lg px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
                <span className="text-xs text-gray-400">High novelty (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-xs text-gray-400">Medium (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-400">Lower (&lt;60)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-white/8">
                <div className="w-4 h-0.5 bg-[#00C853]" />
                <span className="text-xs text-gray-400">Strong link</span>
              </div>
            </div>

            <svg ref={svgRef} width="100%" height="600" className="select-none" />
          </div>

          {/* Sidebar - Selected Node Info */}
          <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4 h-fit lg:sticky lg:top-4">
            {selectedNode ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white leading-snug mb-2">
                  {selectedNode.title}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">Novelty Score:</span>
                  <span className="text-xs font-bold text-[#00C853]">
                    {selectedNode.novelty_score}%
                  </span>
                </div>
                <Link href={`/dashboard/papers/${selectedNode.id}`}
                  className="block text-center bg-[#00C853] hover:bg-[#00a844] text-black text-xs font-bold py-2.5 rounded-lg transition">
                  View Paper Details
                </Link>
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-gray-400 text-xs font-medium">No paper selected</p>
                <p className="text-gray-600 text-xs mt-1">
                  Click any node to see details.<br />Double-click to open paper.
                </p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-white/8 space-y-2">
              <p className="text-xs text-gray-500">
                {nodes.length} papers • {links.length} connections
              </p>
              <p className="text-xs text-gray-600">
                Drag nodes to rearrange. Scroll to zoom.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}