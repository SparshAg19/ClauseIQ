from pypdf import PdfReader
import requests as r


# -----------------------------
# Ollama settings
# -----------------------------

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"


# -----------------------------
# Create session
# -----------------------------

session = r.Session()

# Important:
# Windows ke proxy settings ko ignore karega
# so Python directly Ollama se connect karega
session.trust_env = False


# -----------------------------
# Ask AI
# -----------------------------

def ask(text):

    prompt = """You are a legal document reviewer.

Read the following legal document and identify clauses that a normal person might misunderstand, overlook, or that could create important obligations.

For each important clause, provide:

1. Clause type
2. Page number
3. Original clause
4. Plain English explanation
5. Why it matters

Do not invent information that is not present in the document.

Legal document:

""" + text

    response = session.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False
        }
    )

    # If Ollama returns an error, show it properly
    response.raise_for_status()

    # Convert Ollama JSON response into Python dictionary
    data = response.json()

    # Return only the AI's actual answer
    return data["response"]


# -----------------------------
# Read PDF
# -----------------------------

reader = PdfReader("contract.pdf")

text = ""


for page_number, page in enumerate(reader.pages, start=1):

    text += f"\n--- PAGE {page_number} ---\n"

    page_text = page.extract_text() or ""

    text += page_text


# -----------------------------
# Send PDF text to AI
# -----------------------------

result = ask(text)

print("\n")
print("=" * 60)
print("LEGAL DOCUMENT REVIEW")
print("=" * 60)

print(result)

print("=" * 60)