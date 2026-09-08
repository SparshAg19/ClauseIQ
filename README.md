<div align="center">

# ClauseIQ

### AI-Powered Legal PDF Reviewer

Understand complicated legal documents in simpler language.

<br>

[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Python](https://img.shields.io/badge/Python-3-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)

</div>

---

## Overview

**ClauseIQ** is a local AI-powered legal document reviewer built to help people understand important clauses in legal PDFs without having to interpret complicated legal language on their own.

The application extracts text from an uploaded PDF, sends the relevant content to a locally running **Llama 3.2** model through **Ollama**, and returns structured findings that are displayed directly in the document.

ClauseIQ can identify potentially important clauses, classify their severity, explain them in simpler language, and show where they appear in the document.

> **Disclaimer:** ClauseIQ is an educational and experimental project. It is not a lawyer, does not provide legal advice, and should not replace professional legal counsel.

---

## What ClauseIQ Does

<table>
<tr>
<td width="50%">

### PDF Review

Upload a legal PDF or drag and drop it into the application.

### Clause Detection

The AI searches for clauses that may be important, restrictive, unusual, or easy to overlook.

### Plain-English Explanations

Each detected clause is explained in simpler language.

</td>
<td width="50%">

### Severity Classification

Findings are grouped into:

- 🔴 **HIGH**
- 🟡 **MEDIUM**
- 🟢 **LOW**

### PDF Highlighting

Detected clauses are highlighted directly on the original PDF.

### Clause View

Switch from the document to a clean card-based view of all detected clauses.

</td>
</tr>
</table>

---

## Preview

The main workflow is designed around the original document rather than hiding it behind generated summaries.

```text
             ┌───────────────────────┐
             │       Legal PDF       │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │     React Frontend    │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │    FastAPI Backend    │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │   PDF Text Extraction │
             │        (pypdf)        │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  Ollama + Llama 3.2   │
             │       Local AI        │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │   Structured Results  │
             └───────────┬───────────┘
                         │
                 ┌───────┴───────┐
                 ▼               ▼
        ┌────────────────┐ ┌────────────────┐
        │ Highlighted PDF│ │  Clause View   │
        └────────────────┘ └────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| PDF Rendering | `react-pdf` |
| Backend | Python, FastAPI, Uvicorn |
| PDF Extraction | `pypdf` |
| HTTP Communication | `requests` |
| Local AI Runtime | Ollama |
| AI Model | Llama 3.2 3B |
| Styling | CSS |

---

# Getting Started

## Requirements

Before running ClauseIQ, install:

- Python 3
- Node.js
- npm
- Ollama
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/SparshAg19/ClauseIQ.git
cd ClauseIQ
```

---

## 2. Install Ollama

ClauseIQ uses **Ollama** to run the AI model locally.

Download and install Ollama:

https://ollama.com/

Verify the installation:

```bash
ollama --version
```

Then download the model used by the project:

```bash
ollama pull llama3.2:3b
```

You can test the model directly:

```bash
ollama run llama3.2:3b
```

For example:

```text
Explain indemnification in simple English.
```

If the model responds, Ollama is ready.

> **Important:** Anyone testing ClauseIQ must install Ollama and download `llama3.2:3b` first. The application depends on the locally running Ollama model for AI analysis.

---

# Backend Setup

## 3. Create a Virtual Environment

From the project root:

```bash
python -m venv .venv
```

### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

---

## 4. Install Backend Dependencies

Move into the backend directory:

```powershell
cd backend
```

Install the required packages:

```powershell
pip install fastapi uvicorn pypdf requests python-multipart
```

---

## 5. Start the Backend

Run:

```powershell
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive documentation:

```text
http://127.0.0.1:8000/docs
```

The Swagger interface can also be used to test the `/review` endpoint independently of the frontend.

---

# Frontend Setup

## 6. Install Frontend Dependencies

Open another terminal and move into the frontend directory:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

---

## 7. Start the Frontend

Run:

```powershell
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# Running the Full Application

ClauseIQ uses three local components:

| Component | Address |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://127.0.0.1:8000` |
| Ollama | `http://localhost:11434` |

Once all three are running:

1. Open the frontend in your browser.
2. Upload a legal PDF.
3. Start the review.
4. The backend extracts the document text.
5. Ollama analyzes the content.
6. The backend returns structured results.
7. ClauseIQ highlights detected clauses and displays their explanations.

---

# How the AI Pipeline Works

ClauseIQ currently follows a simple and transparent pipeline:

```text
PDF
 │
 ├── Extract text using pypdf
 │
 ├── Process pages individually
 │
 ├── Send page content to local Llama model
 │
 ├── Receive structured JSON
 │
 ├── Attach page numbers
 │
 └── Display results in React
```

The model is instructed to identify relevant clauses and return structured data rather than an unstructured paragraph.

Example:

```json
{
  "clauses": [
    {
      "type": "INDEMNIFICATION",
      "severity": "HIGH",
      "original": "Example clause text...",
      "explanation": "This means...",
      "why_it_matters": "This is important because..."
    }
  ]
}
```

---

# Severity System

| Level | Meaning |
|---|---|
| 🔴 **HIGH** | Important clause that may have significant consequences |
| 🟡 **MEDIUM** | Clause that deserves careful attention |
| 🟢 **LOW** | Comparatively less concerning clause |

The same severity system is reflected visually inside the PDF.

---

# Key Features

### 1. Original PDF First

The application keeps the original legal document visible instead of presenting only an AI-generated summary.

### 2. Clickable Highlights

Detected clauses are highlighted directly in the PDF and can be clicked to open their explanation.

### 3. Page-Level References

Every detected clause is associated with the page from which it was extracted.

### 4. Local AI

The language model runs through Ollama on the user's own machine.

### 5. Separate Clause View

Users can switch from the document view to a structured list of detected clauses.

### 6. Light and Dark Themes

The interface supports both light and dark modes.

---

# Project Structure

```text
ClauseIQ/
│
├── backend/
│   ├── main.py
│   └── test_pdf.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   │
│   ├── package.json
│   └── ...
│
├── .venv/
│
└── README.md
```

---

# Why Local AI?

Using Ollama makes ClauseIQ especially useful for experimentation with legal documents because the AI model can run locally without requiring a paid cloud LLM API.

### Advantages

- No paid AI API required
- No external LLM API key required
- Local inference
- Useful for experimenting with document privacy
- Can continue working without internet access after installation

### Limitations

- Local inference depends on available hardware
- Larger models require more system resources
- AI-generated interpretations can be inaccurate
- Scanned image-only PDFs may require OCR before reliable text extraction

---

# Troubleshooting

## Ollama is not responding

Check:

```bash
ollama --version
```

Then test:

```bash
ollama run llama3.2:3b
```

---

## Model not found

Run:

```bash
ollama pull llama3.2:3b
```

---

## Backend is not reachable

Start the backend:

```powershell
uvicorn main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend cannot connect to the backend

Make sure these are running:

```text
Frontend -> http://localhost:5173
Backend  -> http://127.0.0.1:8000
Ollama   -> http://localhost:11434
```

---

## PDF highlights are missing

ClauseIQ relies on selectable PDF text for its current highlighting mechanism.

Scanned or image-only PDFs may not contain an extractable text layer and may therefore require OCR support.

---

# Future Improvements

Potential future improvements include:

- Document-wide context
- RAG-based document retrieval
- More accurate clause ranking
- Improved severity classification
- AI result verification
- OCR support for scanned PDFs
- Better handling of tables and complex PDF layouts
- Exporting review results as a report
- User-defined review categories
- Clause comparison
- Support for larger legal-focused models
- Production deployment

---

# Disclaimer

ClauseIQ is an experimental software project built for educational, research, and demonstration purposes.

AI-generated explanations can be incomplete, inaccurate, or dependent on the context of the document.

ClauseIQ should **not** be considered a lawyer, legal advisor, or authoritative source of legal interpretation.

For contracts, disputes, legal obligations, or other important legal decisions, consult a qualified legal professional.

---

## Author

**Sparsh Agarwal**

[GitHub Repository](https://github.com/SparshAg19/ClauseIQ)

---

<div align="center">

### ClauseIQ

**Understand the clause before you sign it.**

</div>
