from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader

import requests as r
import tempfile
import os
import json


app = FastAPI()


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"


# Session used to communicate with Ollama
session = r.Session()
session.trust_env = False


def ask(text):
    prompt = """
You are a legal document reviewer.

Read the following page of a legal document and identify clauses that a normal person might misunderstand, overlook, or that could create important obligations.

For each important clause, provide:

1. type
2. original
3. explanation
4. why_it_matters

Return the answer as valid JSON in exactly this format:

{
    "clauses": [
        {
            "type": "OBLIGATION",
            "original": "exact clause text",
            "explanation": "plain English explanation",
            "why_it_matters": "why this matters to the person signing the agreement"
        }
    ]
}

Important rules:

- Do NOT provide a page number.
- Do NOT invent information.
- Only identify clauses that actually appear in the provided text.
- Keep the original clause as close to the document text as possible.
- If there are no important clauses on this page, return:
  {
      "clauses": []
  }

Page content:

""" + text

    response = session.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options" : {
                "temperature": 0,
                "seed" : 42
            }
        }
    )

    response.raise_for_status()

    data = response.json()

    return json.loads(data["response"])


@app.post("/review")
async def review_pdf(file: UploadFile = File(...)):

    # Save uploaded PDF temporarily
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as temp_file:

        contents = await file.read()
        temp_file.write(contents)
        temp_file_path = temp_file.name


    try:
        # Read PDF
        reader = PdfReader(temp_file_path)

        all_clauses = []


        # Analyze each page separately
        for page_number, page in enumerate(reader.pages, start=1):

            page_text = page.extract_text() or ""

            # Skip completely empty pages
            if not page_text.strip():
                continue


            # Send only this page to AI
            result = ask(page_text)


            # Get clauses returned by AI
            clauses = result.get("clauses", [])


            # Python assigns the REAL page number
            for clause in clauses:

                clause["page"] = page_number

                all_clauses.append(clause)


        # Return final result
        return {
            "filename": file.filename,
            "review": {
                "clauses": all_clauses
            }
        }


    finally:
        # Delete temporary PDF
        os.remove(temp_file_path)