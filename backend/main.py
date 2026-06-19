from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import tempfile
import fitz
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client
import json

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

app = FastAPI(title="ScholarAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scholar-ai-rust.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helper ──────────────────────────────────────────
def extract_text(pdf_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        tmp_path = f.name
    doc = fitz.open(tmp_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    os.unlink(tmp_path)
    return text[:8000]

def ask_groq(prompt: str, system: str = "", max_tokens: int = 2000) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.2
    )
    return response.choices[0].message.content

# ── Routes ──────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ScholarAI Backend Running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ── 1. Analyze Paper ────────────────────────────────
@app.post("/analyze/{paper_id}")
async def analyze_paper(paper_id: str):
    try:
        result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
        paper = result.data
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        pdf_bytes = supabase.storage.from_("papers").download(paper["file_path"])
        text = extract_text(pdf_bytes)
        print(f"Text extracted: {len(text)} chars")

        system = "You are an expert academic research analyst. Be concise and precise."

        title = ask_groq(
            f"Extract the exact title of this research paper. Return ONLY the title:\n\n{text[:2000]}",
            system, 100
        )

        abstract = ask_groq(
            f"Extract the abstract from this paper. Return ONLY the abstract text:\n\n{text[:3000]}",
            system, 300
        )

        summary = ask_groq(
            f"""Write a comprehensive summary of this research paper covering:
- What problem it solves
- Core contribution
- Methods used
- Main results
- Significance

Write 4-5 sentences in academic prose.

Paper:
{text}""",
            system, 500
        )

        key_findings = ask_groq(
            f"""List the 5 most important findings from this paper.
Each finding should be specific with numbers/results where available.

Format:
1. [Finding with specific details]
2. [Finding with specific details]
3. [Finding with specific details]
4. [Finding with specific details]
5. [Finding with specific details]

Paper:
{text}""",
            system, 500
        )

        methodology = ask_groq(
            f"""Describe the research methodology covering:
- Research design type
- Data collection methods
- Analysis techniques
- Evaluation metrics

3-4 sentences.

Paper:
{text}""",
            system, 400
        )

        limitations = ask_groq(
            f"""List 4 key limitations of this research.

Format:
1. [Limitation and its impact]
2. [Limitation and its impact]
3. [Limitation and its impact]
4. [Limitation and its impact]

Paper:
{text}""",
            system, 400
        )

        future_scope = ask_groq(
            f"""List 4 promising future research directions from this paper.

Format:
1. [Direction and why it matters]
2. [Direction and why it matters]
3. [Direction and why it matters]
4. [Direction and why it matters]

Paper:
{text}""",
            system, 400
        )

        novelty_raw = ask_groq(
            f"""Rate novelty of this paper 0-100. Return ONLY a number.

Paper:
{text[:3000]}""",
            system, 10
        )
        try:
            novelty_score = int(''.join(filter(str.isdigit, novelty_raw.strip()[:5])))
            novelty_score = min(100, max(0, novelty_score))
        except:
            novelty_score = 72

        journal = ask_groq(
            f"""Recommend the best journal for this paper.
Return in format: Journal Name | IF: X.X | Q1

Paper:
{text[:2000]}""",
            system, 100
        )

        supabase.table("papers").update({
            "title": title.strip(),
            "abstract": abstract.strip(),
            "summary": summary.strip(),
            "key_findings": key_findings.strip(),
            "methodology": methodology.strip(),
            "limitations": limitations.strip(),
            "future_scope": future_scope.strip(),
            "novelty_score": novelty_score,
            "journal_recommendation": journal.strip(),
            "extracted_text": text,
            "status": "processed"
        }).eq("id", paper_id).execute()

        return {"success": True, "paper_id": paper_id, "novelty_score": novelty_score}

    except Exception as e:
        print(f"ERROR: {str(e)}")
        supabase.table("papers").update({"status": "error"}).eq("id", paper_id).execute()
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Chat with Paper ──────────────────────────────
class ChatRequest(BaseModel):
    paper_id: str
    message: str
    history: Optional[List[dict]] = []

@app.post("/chat")
async def chat_with_paper(req: ChatRequest):
    try:
        result = supabase.table("papers").select(
            "title, extracted_text, summary, key_findings, methodology"
        ).eq("id", req.paper_id).single().execute()
        paper = result.data
        context = paper.get("extracted_text") or paper.get("summary") or ""

        messages = [{
            "role": "system",
            "content": f"""You are an expert AI research assistant analyzing this specific paper:

Title: {paper.get('title', '')}
Key Findings: {paper.get('key_findings', '')[:500]}
Methodology: {paper.get('methodology', '')[:300]}
Content: {context[:6000]}

Guidelines:
- Answer accurately based on paper content only
- If not in paper, clearly say so
- Use technical language appropriate for researchers
- Provide specific details, numbers, examples from paper
- Be concise but complete"""
        }]

        for h in req.history[-6:]:
            messages.append(h)
        messages.append({"role": "user", "content": req.message})

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=800,
            temperature=0.2
        )
        return {"response": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MultiChatRequest(BaseModel):
    paper_ids: List[str]
    message: str
    history: Optional[List[dict]] = []

@app.post("/multi-chat")
async def multi_paper_chat(req: MultiChatRequest):
    try:
        papers_context = ""
        paper_titles = []

        for pid in req.paper_ids[:10]:
            result = supabase.table("papers").select(
                "title, extracted_text, summary, key_findings"
            ).eq("id", pid).single().execute()
            p = result.data
            if p:
                paper_titles.append(p.get("title", "Unknown"))
                context = p.get("extracted_text") or p.get("summary") or ""
                papers_context += f"\n\n=== PAPER: {p.get('title')} ===\n"
                papers_context += f"Key Findings: {p.get('key_findings', '')[:500]}\n"
                papers_context += f"Content: {context[:2000]}\n"

        messages = [{
            "role": "system",
            "content": f"""You are an expert AI research assistant analyzing {len(req.paper_ids)} research papers simultaneously.

Papers available:
{chr(10).join(f"[{i+1}] {t}" for i, t in enumerate(paper_titles))}

Papers Content:
{papers_context[:10000]}

Guidelines:
- Answer based on ALL papers provided
- When comparing, clearly mention which paper says what using [Paper Title] or [1], [2] format
- Identify common themes and differences
- Be specific and cite paper titles in answers
- If asked to compare, provide detailed structured comparison"""
        }]

        for h in req.history[-6:]:
            messages.append(h)
        messages.append({"role": "user", "content": req.message})

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1000,
            temperature=0.2
        )

        return {
            "response": response.choices[0].message.content,
            "papers": paper_titles
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Citation Generator ───────────────────────────
class CitationRequest(BaseModel):
    paper_id: str
    format: str = "APA"

@app.post("/citation")
async def generate_citation(req: CitationRequest):
    try:
        result = supabase.table("papers").select(
            "title, extracted_text, abstract"
        ).eq("id", req.paper_id).single().execute()
        paper = result.data
        text = paper.get("extracted_text", "")[:3000]

        format_guides = {
            "APA": "Author, A. A., & Author, B. B. (Year). Title of article. Title of Journal, volume(issue), page–page. https://doi.org/xxxxx",
            "IEEE": "[1] A. Author, B. Author, \"Title,\" Journal Name, vol. X, no. X, pp. XX-XX, Month Year, doi: XXXXX.",
            "MLA": "Author Last, First, and Second Author. \"Title of Article.\" Journal Name, vol. X, no. X, Year, pp. XX-XX.",
            "Chicago": "Author Last, First, and Second Author. \"Title.\" Journal Name Volume, no. Issue (Year): Pages. https://doi.org/xxxxx"
        }

        response = ask_groq(
            f"""You are an expert academic citation specialist.

Generate a perfectly formatted {req.format} citation for this paper.

{req.format} format: {format_guides.get(req.format, '')}

Extract accurately:
- All author names in correct order
- Publication year
- Exact paper title
- Journal/Conference name
- Volume, issue, pages if available
- DOI if available

Return ONLY the formatted citation. No explanation. No extra text.

Paper:
{text}""",
            "You are a precise academic citation expert.", 200
        )
        return {"citation": response.strip(), "format": req.format}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Research Gap ─────────────────────────────────
class GapRequest(BaseModel):
    paper_id: str

@app.post("/research-gap")
async def find_research_gap(req: GapRequest):
    try:
        result = supabase.table("papers").select(
            "title, extracted_text, summary, limitations, future_scope"
        ).eq("id", req.paper_id).single().execute()
        paper = result.data
        text = paper.get("extracted_text", "")[:6000]

        response = ask_groq(
            f"""You are a world-class research strategist and gap analyst.

Perform a deep analysis of this paper to identify critical research gaps.

For each gap provide:
**Gap [N]: [Title]**
- Description: What is missing or unexplored
- Evidence: Specific evidence from the paper
- Impact: Why filling this gap matters
- Opportunity: Suggested research approach

Identify exactly 5 specific, actionable research gaps.

Paper Title: {paper.get('title')}
Paper: {text}""",
            "You are an expert at identifying unexplored research territories.", 1500
        )
        return {"gaps": response, "paper_title": paper.get("title")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. AI Peer Review ───────────────────────────────
class ReviewRequest(BaseModel):
    paper_id: str

@app.post("/peer-review")
async def peer_review(req: ReviewRequest):
    try:
        result = supabase.table("papers").select(
            "title, extracted_text, summary"
        ).eq("id", req.paper_id).single().execute()
        paper = result.data
        text = paper.get("extracted_text", "")[:6000]

        response = ask_groq(
            f"""You are a senior peer reviewer for a top-tier journal (Nature, Science, IEEE).

Conduct a thorough peer review following rigorous academic standards.

## Summary
[2-3 sentence overview]

## Strengths
1. [Strength]: [Detailed explanation]
2. [Strength]: [Detailed explanation]
3. [Strength]: [Detailed explanation]
4. [Strength]: [Detailed explanation]

## Weaknesses & Concerns
1. [Major Concern]: [Explanation and impact]
2. [Major Concern]: [Explanation and impact]
3. [Minor Issue]: [Explanation]
4. [Minor Issue]: [Explanation]

## Specific Technical Comments
- [Section/Line specific feedback]
- [Technical accuracy issues]
- [Missing comparisons or references]

## Recommendations for Authors
1. Must address before acceptance
2. Should address if possible
3. Optional improvements

## Decision
**Recommendation:** Accept / Major Revision / Minor Revision / Reject
**Confidence:** High / Medium / Low
**Overall Score:** X/10

Paper Title: {paper.get('title')}
Paper: {text}""",
            "You are a highly experienced peer reviewer with 20+ years in top-tier academic publishing.", 1500
        )
        return {"review": response, "paper_title": paper.get("title")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 7. Literature Review ────────────────────────────
class LiteratureRequest(BaseModel):
    paper_ids: List[str]
    topic: str

@app.post("/literature-review")
async def literature_review(req: LiteratureRequest):
    try:
        papers_data = []
        for pid in req.paper_ids[:10]:
            result = supabase.table("papers").select(
                "title, summary, key_findings, methodology, limitations"
            ).eq("id", pid).single().execute()
            if result.data:
                papers_data.append(result.data)

        if not papers_data:
            raise HTTPException(status_code=400, detail="No valid papers found")

        # Build numbered references
        references = "\n".join([
            f"[{i+1}] {p.get('title', 'Unknown')}"
            for i, p in enumerate(papers_data)
        ])

        papers_context = "\n\n".join([
            f"PAPER [{i+1}]: {p.get('title')}\n"
            f"Summary: {p.get('summary', '')[:400]}\n"
            f"Key Findings: {p.get('key_findings', '')[:400]}\n"
            f"Methodology: {p.get('methodology', '')[:200]}\n"
            f"Limitations: {p.get('limitations', '')[:200]}"
            for i, p in enumerate(papers_data)
        ])

        response = ask_groq(
            f"""You are a distinguished academic writer specializing in systematic literature reviews for top-tier journals.

Write a comprehensive, publication-ready literature review on: "{req.topic}"

Based on {len(papers_data)} research paper(s).

CRITICAL CITATION RULES:
- EVERY claim/statement MUST have a citation like [1], [2], [1,2]
- When mentioning specific paper findings, cite them: "Smith et al. showed... [1]"
- Multiple citations: "Several studies confirmed this [1,2,3]"
- Every paragraph must end with at least one citation
- Use author names when possible: "Ladouceur et al. [1] demonstrated..."

## Structure:

### 1. Introduction
Introduce the research area and importance. State scope of this review [X].

### 2. Background & Theoretical Framework  
Key concepts and definitions [X]. Historical development [X].

### 3. Review of Related Work
Synthesize findings - do NOT just summarize each paper separately.
Compare: "While [1] found X, [2] demonstrated Y..."
Group by themes. Highlight agreements [X,X] and contradictions [X] vs [X].

### 4. Critical Analysis & Research Trends
Emerging patterns across papers [X,X]. Methodological evolution [X].

### 5. Research Gaps & Open Problems
Gaps identified from [X]: what remains unexplored.
Contradictions between [X] and [X] that need resolution.

### 6. Conclusion
Synthesize insights from all {len(papers_data)} papers [X].
Future research directions based on [X,X].

### References
{references}

Write minimum 1000 words. Every paragraph must have citations. Use formal academic language.

Papers Data:
{papers_context}""",
            "You are a prolific academic author who writes literature reviews for Nature, IEEE, and Elsevier. You always cite every claim properly using numbered references.", 3000
        )

        return {
            "review": response,
            "topic": req.topic,
            "papers_used": [p.get("title") for p in papers_data],
            "references": references
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 8. Research Roadmap ─────────────────────────────
class RoadmapRequest(BaseModel):
    topic: str
    duration_months: int = 6
    level: str = "PhD"
    paper_ids: Optional[List[str]] = []

@app.post("/roadmap")
async def generate_roadmap(req: RoadmapRequest):
    try:
        context_text = ""
        papers_used = []

        if req.paper_ids:
            for pid in req.paper_ids[:10]:
                result = supabase.table("papers").select(
                    "title, summary, key_findings, limitations, future_scope"
                ).eq("id", pid).single().execute()
                p = result.data
                if p:
                    papers_used.append(p.get("title"))
                    context_text += f"\n\nPaper: {p.get('title')}\n"
                    context_text += f"Summary: {p.get('summary', '')[:300]}\n"
                    context_text += f"Future Scope: {p.get('future_scope', '')[:300]}"

        context_instruction = ""
        if context_text:
            context_instruction = f"""

IMPORTANT: Base this roadmap on insights from these {len(papers_used)} existing papers:
{context_text}

Use their future scope sections and limitations to inform realistic next steps. Reference specific papers where relevant."""

        response = ask_groq(
            f"""You are an elite research mentor who has guided hundreds of {req.level} students to successful publications.

Create a detailed, actionable {req.duration_months}-month research roadmap for: "{req.topic}"
Level: {req.level}
{context_instruction}

## Research Overview
- Primary research question
- Expected contributions
- Target venues (journals/conferences)

## Phase 1: Foundation (Month 1-{req.duration_months//3})
Week-by-week tasks with specific deliverables:
- Week 1: [Task] → Deliverable: [X]
- Week 2: [Task] → Deliverable: [X]
- Week 3: [Task] → Deliverable: [X]
- Week 4: [Task] → Deliverable: [X]
Milestone: [What must be ready]
Resources: [Key papers, tools, datasets]

## Phase 2: Core Research (Month {req.duration_months//3+1}-{2*req.duration_months//3})
[Same detailed breakdown]
Milestone: [Deliverable]

## Phase 3: Writing & Publication (Month {2*req.duration_months//3+1}-{req.duration_months})
[Same detailed breakdown]
Milestone: Paper submitted

## Essential Resources
- 5 key papers/tools to use
- Datasets or benchmarks
- Online courses if needed

## Success Metrics & Checkpoints
- Monthly progress indicators
- Warning signs of getting stuck

## Risk Mitigation
- Common pitfalls to avoid
- Backup plans if main approach fails

Be extremely specific and practical. Every task needs a concrete deliverable.""",
            "You are a world-renowned research mentor with expertise in guiding researchers to publication in top venues.", 2500
        )
        return {
            "roadmap": response,
            "topic": req.topic,
            "duration": req.duration_months,
            "level": req.level,
            "papers_used": papers_used
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 9. Novelty Analyzer ─────────────────────────────
class NoveltyRequest(BaseModel):
    paper_id: str

@app.post("/novelty")
async def analyze_novelty(req: NoveltyRequest):
    try:
        result = supabase.table("papers").select(
            "title, extracted_text, summary"
        ).eq("id", req.paper_id).single().execute()
        paper = result.data
        text = paper.get("extracted_text", "")[:6000]

        response = ask_groq(
            f"""You are an expert at evaluating research novelty and innovation potential.

Perform a comprehensive novelty analysis across 4 dimensions (0-25 each):

## 1. Problem Novelty (0-25)
- Is the problem itself new or uniquely framed?
- Score: X/25
- Justification: [Specific reasoning with evidence from paper]

## 2. Methodological Innovation (0-25)
- Are techniques new, adapted creatively, or combined uniquely?
- Score: X/25
- Justification: [Specific reasoning]

## 3. Results & Impact (0-25)
- Are results significantly better than prior work?
- Practical applicability and reproducibility?
- Score: X/25
- Justification: [Specific reasoning]

## 4. Knowledge Contribution (0-25)
- Does it advance field understanding?
- Generalizability of findings?
- Score: X/25
- Justification: [Specific reasoning]

## Overall Assessment
**Total Score: [Sum]/100**
**Category:** Highly Novel (80-100) / Novel (60-79) / Incremental (40-59) / Derivative (0-39)
**Summary:** [2-3 sentence overall assessment]

## Publication Potential
**Recommended Venue Tier:** Top-tier (Nature/Science/IEEE) / Mid-tier / Workshop/Conference
**Reasoning:** [Why this tier]

Paper Title: {paper.get('title')}
Paper: {text}""",
            "You are a leading expert in research evaluation and technology forecasting.", 1200
        )
        return {"analysis": response, "paper_title": paper.get("title")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Multi Paper Research Gap ────────────────────────
class MultiGapRequest(BaseModel):
    paper_ids: List[str]

@app.post("/multi-research-gap")
async def find_multi_research_gap(req: MultiGapRequest):
    try:
        papers_data = []
        for pid in req.paper_ids[:10]:
            result = supabase.table("papers").select(
                "title, extracted_text, summary, limitations, future_scope"
            ).eq("id", pid).single().execute()
            if result.data:
                papers_data.append(result.data)

        if not papers_data:
            raise HTTPException(status_code=400, detail="No valid papers found")

        papers_context = "\n\n".join([
            f"PAPER [{i+1}]: {p.get('title')}\n"
            f"Summary: {p.get('summary', '')[:400]}\n"
            f"Limitations: {p.get('limitations', '')[:300]}\n"
            f"Future Scope: {p.get('future_scope', '')[:300]}"
            for i, p in enumerate(papers_data)
        ])

        titles_list = "\n".join([f"[{i+1}] {p.get('title')}" for i, p in enumerate(papers_data)])

        response = ask_groq(
    f"""You are a world-class research strategist analyzing multiple papers together.

IMPORTANT: Papers are numbered as follows. ALWAYS refer to them by this number when citing:
{titles_list}

Identify 5-7 CROSS-PAPER research gaps by analyzing patterns, contradictions, and missing connections ACROSS all {len(papers_data)} papers together (not just individual paper gaps).

For each gap provide EXACTLY in this format:
**Gap [N]: [Title]**
- Description: What is missing across these papers collectively
- Evidence: Reference specific papers using [1], [2] format (use the paper numbers given above)
- Impact: Why filling this gap matters to the field
- Opportunity: Suggested research approach combining insights from multiple papers

CRITICAL RULES:
- ALWAYS use [1], [2], [3] etc. to refer to specific papers (matching the numbers given above)
- Example: "Paper [1] focuses on X while Paper [2] explores Y, leaving a gap in..."
- Highlight contradictions: "[1] suggests A, but [3] contradicts this with B"
- Mention common limitations across papers using their numbers
- Find unexplored connections between different papers' findings

At the very end, add:
### Papers Referenced
{titles_list}

Papers Data:
{papers_context}""",
    "You are an expert at identifying unexplored research territories by synthesizing multiple papers. You always cite papers using [1], [2] format.", 2000
)

        return {
            "gaps": response,
            "papers_used": [p.get("title") for p in papers_data]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── 10. Semantic Search (External Papers via arXiv) ──
import httpx
import xml.etree.ElementTree as ET

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

@app.post("/search-papers")
async def search_external_papers(req: SearchRequest):
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                "http://export.arxiv.org/api/query",
                params={
                    "search_query": f"all:{req.query}",
                    "start": 0,
                    "max_results": req.limit,
                    "sortBy": "relevance",
                    "sortOrder": "descending"
                }
            )

        print("RESPONSE STATUS:", response.status_code)
        print("RESPONSE TEXT (first 500 chars):", response.text[:500])

        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "arxiv": "http://arxiv.org/schemas/atom"
        }
        root = ET.fromstring(response.text)
        entries = root.findall("atom:entry", ns)

        papers = []
        for entry in entries:
            title = entry.find("atom:title", ns)
            summary = entry.find("atom:summary", ns)
            published = entry.find("atom:published", ns)
            arxiv_id = entry.find("atom:id", ns)

            authors = []
            for author in entry.findall("atom:author", ns):
                name = author.find("atom:name", ns)
                if name is not None:
                    authors.append(name.text)

            pdf_url = None
            paper_url = None
            for link in entry.findall("atom:link", ns):
                if link.get("title") == "pdf":
                    pdf_url = link.get("href")
                if link.get("rel") == "alternate":
                    paper_url = link.get("href")

            year = None
            if published is not None and published.text:
                year = int(published.text[:4])

            papers.append({
                "id": arxiv_id.text.split("/")[-1] if arxiv_id is not None else "",
                "title": title.text.strip().replace("\n", " ") if title is not None else "Untitled",
                "abstract": summary.text.strip().replace("\n", " ") if summary is not None else "No abstract available",
                "authors": authors[:5],
                "year": year,
                "venue": "arXiv",
                "citations": 0,
                "url": paper_url,
                "pdf_url": pdf_url,
            })

        return {"papers": papers, "total": len(papers)}

    except Exception as e:
        print("SEARCH ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    
    # ── 11. Research Graph Data ─────────────────────────
@app.get("/graph-data")
async def get_graph_data():
    try:
        result = supabase.table("papers").select(
            "id, title, novelty_score, status, summary, created_at"
        ).eq("status", "processed").execute()

        papers = result.data or []

        if len(papers) < 2:
            return {"nodes": papers, "links": []}

        # Build similarity links using AI based on summaries
        titles_summary = "\n".join([
            f"[{i}] {p.get('title', '')}: {p.get('summary', '')[:150]}"
            for i, p in enumerate(papers)
        ])

        links = []
        if len(papers) >= 2:
            try:
                connections_raw = ask_groq(
                    f"""Given these {len(papers)} research papers, identify which pairs are topically RELATED (share themes, methods, or domain).

Papers:
{titles_summary}

Return ONLY valid JSON array of connections using paper index numbers (0-based):
[{{"source": 0, "target": 1, "strength": "strong"}}, {{"source": 0, "target": 2, "strength": "weak"}}]

strength is either "strong" (very related) or "weak" (loosely related).
Only include genuinely related pairs. If papers are unrelated, don't connect them.
Return ONLY the JSON array, nothing else.""",
                    "You are an expert at identifying research relationships. Return only valid JSON.",
                    800
                )

                cleaned = connections_raw.strip()
                if "```json" in cleaned:
                    cleaned = cleaned.split("```json")[1].split("```")[0].strip()
                elif "```" in cleaned:
                    cleaned = cleaned.split("```")[1].split("```")[0].strip()

                start = cleaned.find("[")
                end = cleaned.rfind("]") + 1
                if start != -1 and end > start:
                    cleaned = cleaned[start:end]

                connections = json.loads(cleaned)

                for c in connections:
                    src_idx = c.get("source")
                    tgt_idx = c.get("target")
                    if (isinstance(src_idx, int) and isinstance(tgt_idx, int)
                        and 0 <= src_idx < len(papers) and 0 <= tgt_idx < len(papers)):
                        links.append({
                            "source": papers[src_idx]["id"],
                            "target": papers[tgt_idx]["id"],
                            "strength": c.get("strength", "weak")
                        })
            except Exception as link_err:
                print("Link generation error:", str(link_err))
                links = []

        nodes = [{
            "id": p["id"],
            "title": p.get("title", "Untitled"),
            "novelty_score": p.get("novelty_score", 50),
            "created_at": p.get("created_at")
        } for p in papers]

        return {"nodes": nodes, "links": links}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )