# ScholarAI

AI-powered research intelligence platform that helps researchers, students, and academics analyze papers, generate literature reviews, find research gaps, and speed up their research workflow.

## Why I built this

Reading and analyzing research papers manually takes a lot of time. I built ScholarAI to automate that process — upload a paper, and AI extracts the summary, key findings, methodology, limitations, and more in seconds. From there, you can chat with the paper, get an AI peer review, generate citations, find research gaps, and even build a literature review across multiple papers, all from one platform.

## Features

| Feature | What it does | Works with |
|---|---|---|
| AI Paper Analysis | Extracts title, abstract, summary, key findings, methodology, limitations, and future scope from any uploaded PDF | Single paper |
| Chat with Paper | Ask questions and get answers grounded in the paper's actual content | Single paper |
| Multi-Paper Chat | Compare and query across multiple papers at once | Multiple papers |
| Citation Generator | Generates citations in APA, IEEE, MLA, and Chicago formats | Single paper |
| Research Gap Finder | Identifies unexplored research opportunities, including gaps that emerge only when comparing multiple papers | Single & multiple |
| AI Peer Review | A structured review covering strengths, weaknesses, technical comments, and a final accept/revise/reject decision | Single paper |
| Novelty Analyzer | Scores originality across four weighted dimensions (problem novelty, methodology, results, knowledge contribution) | Single paper |
| Literature Review Generator | Produces an academic literature review with numbered in-text citations and a references section | Single & multiple |
| Research Roadmap | Generates a phase-wise, week-by-week research plan for any topic, optionally grounded in your existing papers | Single, multiple, or topic-only |
| Semantic Search | Searches external papers via arXiv and saves them directly into your library | External papers |
| Research Graph | Visualizes AI-detected relationships between your uploaded papers as an interactive network | Whole library |
| Analytics Dashboard | Tracks novelty trends, upload activity, and research quality over time | Whole library |

## Tech stack

**Frontend**
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS + shadcn/ui for components
- Framer Motion for animations
- Recharts for analytics charts
- D3.js for the research graph visualization
- Lucide for icons

**Backend**
- FastAPI (Python)
- PyMuPDF for PDF text extraction
- Groq API (Llama 3.3 70B) for all AI generation
- httpx for calling external APIs

**Database, Auth & Storage**
- Supabase — PostgreSQL database, authentication, and file storage all in one

**External data**
- arXiv API for semantic paper search

**Deployment**
- Vercel for the frontend
- Render for the backend
- Supabase Cloud for the database

## Architecture

```
                        ┌──────────────────────┐
                        │        User           │
                        └───────────┬───────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      Next.js Frontend          │
                    │      (Vercel)                  │
                    │                                 │
                    │  • Dashboard, papers, studio    │
                    │  • Auth pages                   │
                    │  • Research graph (D3.js)       │
                    │  • Analytics (Recharts)         │
                    └─────────┬──────────────┬────────┘
                              │              │
              Auth, DB reads, │              │ AI feature
              file storage    │              │ requests
                              ▼              ▼
                ┌────────────────────┐  ┌──────────────────────┐
                │     Supabase        │  │   FastAPI Backend     │
                │                      │  │   (Render)             │
                │  • PostgreSQL DB    │  │                        │
                │  • Auth             │  │  • PDF text extraction │
                │  • Storage (PDFs)   │  │  • Prompt orchestration│
                └──────────┬──────────┘  │  • arXiv integration   │
                           │             └───────────┬────────────┘
                           │                          │
                           │                          ▼
                           │              ┌────────────────────────┐
                           └─────────────▶│      Groq API           │
                              writes      │   (Llama 3.3 70B)        │
                              results     └────────────────────────┘
                              back
```

**How a paper analysis flows end to end:**

1. User uploads a PDF from the frontend → file goes straight to Supabase Storage.
2. A row is created in the `papers` table with status `processing`.
3. Frontend calls `POST /analyze/{paper_id}` on the FastAPI backend.
4. Backend downloads the PDF from Supabase Storage, extracts text with PyMuPDF.
5. Backend sends a series of structured prompts to Groq (title, summary, key findings, methodology, limitations, future scope, novelty score, journal recommendation).
6. Backend writes all the results back into the `papers` row and sets status to `processed`.
7. Frontend reflects the updated paper in real time via Supabase.

## Project structure

```
ScholarAI/
├── backend/
│   ├── main.py                  # FastAPI app — all AI endpoints live here
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── papers/          # My Papers + paper detail page
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── chat/
│   │   │   │   │       ├── citation/
│   │   │   │   │       ├── gap/
│   │   │   │   │       └── review/
│   │   │   │   ├── studio/          # Multi-paper tools
│   │   │   │   │   ├── chat/
│   │   │   │   │   ├── literature/
│   │   │   │   │   ├── gap/
│   │   │   │   │   └── roadmap/
│   │   │   │   ├── search/          # Semantic search (arXiv)
│   │   │   │   ├── research-graph/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   ├── privacy/
│   │   │   └── page.tsx             # Landing page
│   │   ├── components/
│   │   └── lib/
│   │       └── supabase.ts
│   ├── package.json
│   └── .env.local                   # not committed
│
└── README.md
```

## Database schema (Supabase)

**`papers` table**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | References `auth.users`, cascades on delete |
| title | text | AI-extracted or original filename |
| file_name | text | Original uploaded filename |
| file_path | text | Path inside the `papers` storage bucket |
| file_size | bigint | In bytes |
| status | text | `processing`, `processed`, or `error` |
| abstract | text | AI-extracted |
| summary | text | AI-generated |
| key_findings | text | AI-generated |
| methodology | text | AI-generated |
| limitations | text | AI-generated |
| future_scope | text | AI-generated |
| novelty_score | int | 0–100 |
| journal_recommendation | text | AI-generated |
| extracted_text | text | Full text pulled from the PDF |
| created_at | timestamptz | Defaults to `now()` |

Row-level security is enabled so each user can only read, update, and delete their own papers.

**`contact_messages` table** — stores messages submitted through the public contact form.

**`newsletter_subscribers` table** — stores email signups from the landing page footer.

**Storage bucket: `papers`** — stores the original PDFs, organized as `{user_id}/{timestamp}_{filename}.pdf`. Access is restricted per user through storage policies.

## Running it locally

You'll need Node.js 18+, Python 3.11+, a free [Supabase](https://supabase.com) project, and a free [Groq](https://console.groq.com) API key.

**1. Clone the repo**

```bash
git clone https://github.com/deepikagupta8050/ScholarAI.git
cd ScholarAI
```

**2. Backend setup**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Run it:

```bash
uvicorn main:app --reload --port 8000
```

**3. Frontend setup**

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run it:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/analyze/{paper_id}` | Runs full AI analysis on an uploaded paper |
| POST | `/chat` | Chat with a single paper |
| POST | `/multi-chat` | Chat across multiple selected papers |
| POST | `/citation` | Generate a citation in a chosen format |
| POST | `/research-gap` | Find research gaps in a single paper |
| POST | `/multi-research-gap` | Find combined research gaps across selected papers |
| POST | `/peer-review` | Generate a structured AI peer review |
| POST | `/literature-review` | Generate a citation-backed literature review |
| POST | `/roadmap` | Generate a phase-wise research roadmap |
| POST | `/novelty` | Run a detailed 4-dimension novelty analysis |
| POST | `/search-papers` | Search external papers via arXiv |
| GET | `/graph-data` | Get AI-computed relationships between a user's papers |

## Deployment

- **Frontend** — deployed on Vercel, pointed at the `frontend/` directory, with the Supabase and backend API URLs set as environment variables.
- **Backend** — deployed on Render as a Python web service, pointed at the `backend/` directory, with `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_KEY` set as environment variables.
- **Database, Auth & Storage** — fully managed by Supabase, no separate deployment needed.

## What's next

- Add JWT verification on the backend endpoints so they aren't publicly callable
- Add rate limiting on the AI endpoints
- Export literature reviews and reports as PDF/DOCX
- Team workspaces for collaborative research

## Author

Built by Deepika Gupta as a portfolio project.