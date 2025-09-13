# backend/text_utils.py
import os
import re
from typing import List
from pathlib import Path

# Optional imports for different file types
try:
    from docx import Document as _DocxDocument  # python-docx
except Exception:
    _DocxDocument = None

# --- Chunking controls via env ---
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "700"))         # default smaller chunks
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))   # default overlap
# Safety rails
CHUNK_SIZE = max(200, min(4000, CHUNK_SIZE))
CHUNK_OVERLAP = max(0, min(CHUNK_SIZE - 50, CHUNK_OVERLAP))


def _clean_text(s: str) -> str:
    # Normalize whitespace
    s = s.replace("\r", "\n")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _read_txt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="ignore")


def _read_md(path: str) -> str:
    return _read_txt(path)


def _read_html(path: str) -> str:
    # naive HTML stripper
    raw = Path(path).read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r"<script[\s\S]*?</script>", " ", raw, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return text


def _read_pdf(path: str) -> str:
    # lightweight fallback using pdftotext if available, else return empty
    # (You can swap in pypdf if you prefer.)
    try:
        import subprocess, tempfile
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
            tmp_name = tmp.name
        subprocess.run(["pdftotext", path, tmp_name], check=True)
        out = Path(tmp_name).read_text(encoding="utf-8", errors="ignore")
        Path(tmp_name).unlink(missing_ok=True)
        return out
    except Exception:
        return ""


def _read_docx(path: str) -> str:
    if _DocxDocument is None:
        return ""
    doc = _DocxDocument(path)
    parts = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            parts.append(txt)
    return "\n".join(parts)


def read_text_any(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext in [".txt"]:
        text = _read_txt(path)
    elif ext in [".md"]:
        text = _read_md(path)
    elif ext in [".htm", ".html"]:
        text = _read_html(path)
    elif ext in [".pdf"]:
        text = _read_pdf(path)
    elif ext in [".docx"]:
        text = _read_docx(path)
    else:
        text = ""
    return _clean_text(text)


def _split_paragraphs(text: str) -> List[str]:
    # Split by blank lines; keep paragraphs intact
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return paras


def chunk_text(text: str) -> List[str]:
    """
    Sliding-window chunking with character-based window and overlap.
    We soft-respect paragraph boundaries: build chunks by adding paragraphs
    until ~CHUNK_SIZE, then slide forward by (CHUNK_SIZE - CHUNK_OVERLAP).
    """
    text = _clean_text(text)
    if not text:
        return []

    paras = _split_paragraphs(text)
    if not paras:
        paras = [text]

    # Build a long string with paragraph markers we can split around
    sep = "\n\n"
    joined = sep.join(paras)

    chunks: List[str] = []
    start = 0
    step = max(50, CHUNK_SIZE - CHUNK_OVERLAP)

    while start < len(joined):
        end = min(len(joined), start + CHUNK_SIZE)

        # Try to end at a paragraph boundary within ±200 chars
        window = joined[start:end]
        if end < len(joined):
            # look backwards a bit for sep
            back = window.rfind(sep)
            if back != -1 and (end - (start + back)) <= 200:
                end = start + back

        chunk = joined[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(joined):
            break
        start = max(end - CHUNK_OVERLAP, start + step)

    return chunks
