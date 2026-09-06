from fastapi import FastAPI, UploadFile, File
from pypdf import PdfReader
import requests as r
import tempfile
import os
import json
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

session = r.Session()
session.trust_env = False


def ask(text):

    prompt = """You are a legal document reviewer.

Read the following legal document and identify clauses that a normal person might misunderstand, overlook, or that could create important obligations.

For each important clause, provide:

1. type
2. page
3. original
4. explanation
5. why_it_matters

Return the answer as valid JSON.

Do not invent information that is not present in the document.

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

    return json.loads(data["response"])


@app.post("/review")
async def review_pdf(file: UploadFile = File(...)):

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as temp_file:

        contents = await file.read()

        temp_file.write(contents)

        temp_file_path = temp_file.name


    try:

        reader = PdfReader(temp_file_path)

        text = ""

        for page_number, page in enumerate(
            reader.pages,
            start=1
        ):

            text += f"\n--- PAGE {page_number} ---\n"

            page_text = page.extract_text() or ""

            text += page_text

        result = ask(text)

        return {
            "filename": file.filename,
            "review": result
        }

    finally:

        os.remove(temp_file_path)