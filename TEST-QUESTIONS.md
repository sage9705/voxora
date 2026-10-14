# Voxora Test Suite & Evaluation Guide

This test suite evaluates the core requirements on the fictional two-model equipment manuals (`NexGen NX-300 Manual v1.0` and `v2.0`, 5 pages each, 10 pages total).

---

## 1. The Six Required Core Questions

| # | Question Type | Input Question | Expected Answer | Source Pages & Document | Factual Accuracy Pass Criteria | Citation Accuracy Pass Criteria |
|---|---|---|---|---|---|---|
| **1** | **Direct Fact** | *"What are the setup steps for priming Model A?"* | Model A uses a 6-step manual priming procedure: 1. Disconnect and lock out electrical supply. 2. Confirm inlet/outlet connections. 3. Open manual priming valve. 4. Fill inlet chamber until water appears at outlet inspection point. 5. Close valve and check for leaks. 6. Restore power only after inspection. | **Page 3**, Section 3.2 (in both v1.0 & v2.0) | Mentions manual priming valve and key steps (e.g., closing valve before restoring power). | Cites **Page 3** of the active manual. |
| **2** | **Comparison** | *"How do Model A and Model B compare in electrical supply and normal maximum operating pressure in Version 1.0?"* | In Version 1.0, Model A requires 230 V AC (50 Hz) with an 8 bar limit, while Model B requires 400 V AC (50 Hz) with a 12 bar limit. | **Page 2**, Section 1.1 & Section 2; **Page 4**, Section 4.1 (`v1.0`) | Correctly distinguishes 230V/8 bar for Model A vs 400V/12 bar for Model B. | Cites **Page 2** and/or **Page 4** of `NexGen NX-300 Manual v1.0`. |
| **3** | **Follow-up** | *"And what about the other model?"* *(Asked immediately after asking: "What is the normal operating limit for Model A?")* | Model B has a normal maximum operating pressure of 12 bar. | **Page 2** (Section 1.1, 2) & **Page 4** (Section 4.1) | Identifies "the other model" as Model B and states 12 bar. | Cites **Page 2** or **Page 4**. |
| **4** | **Explicit Exception** | *"When is Model B permitted to operate at 13 bar?"* | Model B is permitted at 13 bar only during authorized factory calibration for a maximum duration of 30 seconds. This exception does not apply to Model A and does not permit continuous operation. | **Page 4**, Section 4.1 (Explicit Exception box) | Mentions factory calibration only, 30 seconds maximum, and notes it is not continuous or for Model A. | Cites **Page 4** of the manual. |
| **5** | **Absent Fact** | *"Who manufactures the motor for the NX-300?"* | The manual explicitly states that the motor manufacturer is not identified and directs the user to consult the equipment nameplate or supplier records. | **Page 5**, Section 5.3 (Service information & Document Limitation) | Explicitly declines to invent a manufacturer; states the manual does not contain this information. | Cites **Page 5** or states no source passage contains the fact. Plausible invented name = **FAIL**. |
| **6** | **Post-Replacement (Revised Value)** | *"What is the maximum operating pressure for Model A?"* *(Asked after replacing v1.0 with v2.0)* | Under Version 2.0, Model A's maximum operating pressure is 9 bar (revised upward from 8 bar in v1.0). | **Page 2**, Section 1.1 & Section 2; **Page 4**, Section 4.1 (`v2.0`) | Returns **9 bar** (not 8 bar). Answers must dynamically reflect the active document. | Cites **Page 2** and/or **Page 4** of `NexGen NX-300 Manual v2.0`. |

---

## 2. Evaluation Criteria: Factual vs. Citation Accuracy

Factual accuracy and citation accuracy are scored separately:

1. **Factual Accuracy (0 or 1 per question)**
   - **Pass (1):** The answer is strictly grounded in the uploaded PDF text.
   - **Fail (0):** Any hallucination, incorrect number, or failure to state absence of an absent fact. *A plausible answer without support is a failure.*

2. **Citation Accuracy (0 or 1 per question)**
   - **Pass (1):** Visible quote passage corresponds to the exact page number (e.g. Page 2, Page 3, Page 4, Page 5) in the source PDF.
   - **Fail (0):** Missing citation, wrong page number, or fabricated citation label.

---

## 3. Measured Timing & Benchmark Methodology

Voxora measures and displays two distinct time intervals directly in the UI:

1. **Document Ingestion Time ($T_{\text{ingest}}$):**
   - Measured on the server from file receipt through PDF text extraction, page delimitation, and lexical chunking.
   - Displayed in the document list (e.g., `5 pages · 39 KB · 18ms ingest`).
   - Benchmark: **~15ms – 35ms** per 5-page PDF document.

2. **Question-to-First-Audible-Answer Time ($T_{\text{audible}}$):**
   - Measured on the client from submit/voice recognition completion to the exact moment `window.speechSynthesis.speak()` is initiated.
   - Displayed on the assistant response card (e.g., `⚡ 410ms latency`, `🔊 425ms to audio`).
   - Components:
     - Network roundtrip (client ↔ server): ~30ms
     - Passage ranking (BM25 lexical retrieval): ~2ms
     - Groq LLM inference (time to first chunk/completion on LLaMA 3.3 70B): ~350ms – 550ms
     - Speech synthesis dispatch: ~5ms – 10ms
     - **Total Question-to-Speech:** **~380ms – 600ms**.

---

## 4. Cost Breakdown & Official Pricing Structure

### A. Ingestion Cost
- **Variable Cost per Ingestion:** **$0.00**
- *Reasoning:* PDF parsing and passage chunking run on local Node.js server resources (memory + CPU) without calling paid third-party OCR or embedding APIs.

### B. Question-Answering Cost (Inference)
- **Model:** `llama-3.3-70b-versatile` hosted on GroqCloud.
- **Official GroqCloud Published Rates (https://groq.com/pricing):**
  - Input tokens: **$0.59 per 1,000,000 tokens** ($0.00000059 / token).
  - Output tokens: **$0.79 per 1,000,000 tokens** ($0.00000079 / token).
  - Alternative `llama-3.1-8b-instant`: **$0.05 / 1M input**, **$0.08 / 1M output**.
- **Average Token Consumption per Question:**
  - System prompt + conversation history + retrieved passages context: ~350–550 input tokens ($0.00021 – $0.00032).
  - Generated concise spoken answer: ~40–90 output tokens ($0.00003 – $0.00007).
  - **Estimated Variable Cost per Question:** **~$0.00024 – $0.00039** (< $0.0004).
- **Speech Recognition & Speech Playback:**
  - Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`): **$0.00** (client-side native browser engine).

### C. Local Mode (No API Key)
- If `GROQ_API_KEY` is omitted, Voxora executes BM25 passage ranking locally:
  - Variable cost: **$0.00 / question**.
