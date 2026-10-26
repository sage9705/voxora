# Voxora

**Talk to your documents.** Voxora is a voice-first Retrieval-Augmented Generation (RAG) system with speech input, spoken answers, exact visible citations with page references, and multi-document comparison. The interface and API run together in a lightweight Next.js application; no external database, vector store, or complicated microservices are required.

---

## Features

- **Custom PDF Upload:** Upload any text-based PDF documents (manuals, reports, guides, specs) up to 8 MB and 10 pages.
- **Exact Page Extraction & Chunking:** Extracts text page-by-page using page boundary delimiters so all citations retain their actual source page numbers.
- **Voice In, Spoken Out:** Speak questions aloud via browser speech recognition; automatically hear answers read aloud via speech synthesis.
- **Visible Quotations & Page Citations:** Every answer returns grounded excerpt quotations and exact page citations.
- **Dynamic Document Replacement:** Removing or replacing a document immediately changes answers for subsequent questions.
- **Follow-up Dialogue Support:** Conversational memory supports contextual follow-up questions such as *"And what about the other model?"*.
- **Absent Fact Handling:** Explicitly declines and states when facts are not present in the uploaded documents — no hallucinations.
- **Performance & Cost Metrics:**
  - Ingestion time measured separately in milliseconds.
  - Question-to-first-audible-answer latency measured directly in the UI.
  - Token consumption and variable cost estimated and displayed per question.
- **Local Fallback Mode:** Works completely offline in local passage-retrieval mode without any API key, or with Groq (`qwen/qwen3.8-27b` / `openai/gpt-oss-120b` per [Groq Models](https://console.groq.com/docs/models)) for AI synthesis.

---

## Quick Start

Requires **Node.js 20+** (macOS, Linux, or Windows):

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
GROQ_MODEL=qwen/qwen3.8-27b
# Alternative model: GROQ_MODEL=openai/gpt-oss-120b
# See official supported models: https://console.groq.com/docs/models
```

3. Restart the server (`npm run dev`).

*(Without an API key, Voxora automatically falls back to local BM25 passage retrieval with zero external dependencies and zero cost.)*

---

## Architecture

Voxora uses a streamlined pipeline:

1. **Ingestion** — PDF text is extracted page-by-page on the server with page boundary tagging, then chunked into passages.
2. **Retrieval** — BM25 lexical ranking scores passages against the user's query in under 2 ms.
3. **Generation** — Retrieved passages are sent as grounded context to the LLM (Groq-hosted Qwen 3.8 27B or GPT-OSS 120B) with strict anti-hallucination instructions.
4. **Voice I/O** — Browser Web Speech API handles speech recognition and synthesis with zero external audio API cost.

---

## Production Build

```bash
npm run typecheck
npm run lint
npm run build
```

---

## License

See [LICENSE](LICENSE) for details.
