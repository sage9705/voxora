# Voxora

**Talk to your documents.** Voxora is a voice-first Retrieval-Augmented Generation (RAG) system with speech input, spoken answers, exact visible citations with page references, and multi-document comparison. The interface and API run together in a lightweight Next.js application; no external database, vector store, or complicated microservices are required.

---

## What is included

- **Custom PDF Upload:** Upload any text-based PDF documents (manuals, reports, guides, specs) up to 8 MB and 10 pages.
- **Exact Page Extraction & Chunking:** Extracts text page-by-page using page boundary delimiters so all citations retain their actual source page numbers.
- **Voice In, Spoken Out:** Speak questions aloud via browser speech recognition; automatically hear answers read aloud via speech synthesis.
- **Visible Quotations & Page Citations:** Every answer returns grounded excerpt quotations and exact page citations.
- **Dynamic Document Replacement:** Removing or replacing a document immediately changes answers for subsequent questions.
- **Follow-up Dialogue Support:** Conversational memory supports contextual follow-up questions such as *"And what about the other model?"*.
- **Absent Fact Handling:** Explicitly declines and states when facts (such as unspecified manufacturers or credentials) are not present in the manual.
- **Performance & Cost Metrics:**
  - Ingestion time measured separately in milliseconds.
  - Question-to-first-audible-answer latency measured directly in the UI.
  - Token consumption and variable cost estimated and displayed per question.
- **Local Fallback Mode:** Works completely offline in local passage-retrieval mode without any API key, or with Groq (`llama-3.1-8b-instant` / `llama-3.3-70b-versatile` per [Groq Models](https://console.groq.com/docs/models)) for AI synthesis.

---

## Quick Start (Cross-Platform)

In any environment with **Node.js 20+** installed (macOS, Linux, or Windows), run:

```bash
node start.js
```

*(`start.js` automatically copies `.env.example` to `.env.local`, verifies dependencies, and starts the development server).*

Or standard manual setup:

```bash
npm install
cp .env.example .env.local    # On Windows: copy .env.example .env.local
npm run dev
```

Then open <http://localhost:3000> in **Brave**, **Google Chrome**, **Microsoft Edge**, or **Safari**.

### Enable AI Synthesis (Groq)

1. Obtain a free API key from [Groq Console](https://console.groq.com/keys).
2. Add your key to `.env.local`:

```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.1-8b-instant
# Alternative flagship model: GROQ_MODEL=llama-3.3-70b-versatile
# See official supported models: https://console.groq.com/docs/models
```

3. Restart the server (`npm run dev`).

*(Note: Without an API key, Voxora automatically falls back to local BM25 passage retrieval with zero external dependencies and zero cost).*

---

## The Six Core Test Questions

Refer to [TEST-QUESTIONS.md](TEST-QUESTIONS.md) for the full rubric.

1. **Direct Fact:** *"What are the setup steps for priming Model A?"* → Manual priming procedure (6 steps), **Page 3**.
2. **Comparison:** *"How do Model A and Model B compare in electrical supply and normal maximum operating pressure in Version 1.0?"* → Model A (230V / 8 bar) vs. Model B (400V / 12 bar), **Page 2 & 4**.
3. **Follow-up:** *"And what about the other model?"* → Contextually recognizes Model B and returns 12 bar, **Page 2 & 4**.
4. **Explicit Exception:** *"When is Model B permitted to operate at 13 bar?"* → Authorized factory calibration only for $\le 30$ seconds, **Page 4**.
5. **Absent Fact:** *"Who manufactures the motor for the NX-300?"* → Explicitly states the manual does not identify the manufacturer, **Page 5**.
6. **Post-Replacement Value:** *"What is the maximum operating pressure for Model A?"* → Returns 8 bar with v1.0; returns **9 bar** after replacing with v2.0, **Page 2 & 4**.

---

## Evaluation & Metrics

### 1. Factual Accuracy vs. Citation Accuracy
- **Factual Accuracy:** Evaluated strictly against document text. Hallucinations or unsupported claims are marked as failures.
- **Citation Accuracy:** Evaluated against physical page numbers in the source PDF.

### 2. Measured Timing
- **Ingestion Time:** ~15ms – 35ms per 5-page manual (measured on server and displayed in library sidebar).
- **Question-to-First-Audible-Answer Time:** ~380ms – 600ms total elapsed time from voice input submission to first audible audio playback.

### 3. Variable Cost per Operation
- **Ingestion:** **$0.00** (Local CPU parsing, no external API calls).
- **Speech In / Out:** **$0.00** (Native browser Web Speech API).
- **LLM Reasoning (Groq LLaMA 3.3 70B):**
  - Input: $0.59 / 1M tokens (~$0.00025 / question)
  - Output: $0.79 / 1M tokens (~$0.00005 / question)
  - **Total Variable Cost:** **~$0.0003 per question**.
  - Local mode: **$0.00**.

---

## Production Build & Verification

```bash
npm run typecheck
npm run lint
npm run build
```
