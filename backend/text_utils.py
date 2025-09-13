import os, re, math
from typing import List
from bs4 import BeautifulSoup

def read_text_any(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext in [".txt", ".md"]:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    if ext in [".html", ".htm"]:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n")
    if ext == ".pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(path)
            return "\n".join([p.extract_text() or "" for p in reader.pages])
        except Exception:
            return ""
    if ext == ".docx":
        try:
            from docx import Document  # python-docx
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return ""
    # Unknown -> try text
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""

_WHITES = re.compile(r"[ \t\f\r]+")
def normalize_ws(s: str) -> str:
    return _WHITES.sub(" ", s).replace("\u00a0", " ").strip()

def chunk_text(s: str, target_chars: int = 900, overlap: int = 120) -> List[str]:
    s = normalize_ws(s)
    if not s:
        return []
    paras = [p.strip() for p in re.split(r"\n{2,}", s) if p.strip()]
    chunks: List[str] = []
    cur: List[str] = []
    cur_len = 0
    for p in paras:
        if cur_len + len(p) + 1 > target_chars and cur:
            chunks.append(" ".join(cur).strip())
            tail = chunks[-1][-overlap:]
            cur, cur_len = [tail], len(tail)
        cur.append(p)
        cur_len += len(p) + 1
    if cur:
        chunks.append(" ".join(cur).strip())
    if not chunks and s:
        chunks = [s[:target_chars]]
    return chunks