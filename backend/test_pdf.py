from pypdf import PdfReader
import requests as r

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

session = r.Session()
session.trust_env = False


def ask(text):

    prompt = """You are a legal document reviewer.

Read the following legal document and identify clauses that a normal person might misunderstand, overlook, or that could create important obligations.

For each important clause, provide:

1. Clause type
2. Page number
3. Original clause
4. Plain English explanation
5. Why it matters

Do not invent information that is not present in the document. Return the answer as valid JSON.

Legal document:

""" + text

    response = session.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
    )

    response.raise_for_status()

    data = response.json()
    return data["response"]


reader = PdfReader("contract.pdf")

text = ""


for page_number, page in enumerate(reader.pages, start=1):

    text += f"\n--- PAGE {page_number} ---\n"

    page_text = page.extract_text() or ""

    text += page_text


result = ask(text)

print("\n")
print("=" * 60)
print("LEGAL DOCUMENT REVIEW")
print("=" * 60)

print(result)

print("=" * 60)