# backend/scripts/reingest.py
import os, sys
# add the parent directory of this script (the "backend" folder) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from search import ingest_docs_to_json

import argparse

def main():
    parser = argparse.ArgumentParser(description="Reingest GSOS docs into JSON index.")
    parser.add_argument("--only-file", dest="only_file", default=None, help="Reindex only this filename")
    parser.add_argument("--force-openai", dest="force_openai", action="store_true", help="Require OpenAI embeddings")
    args = parser.parse_args()

    if args.force_openai:
        os.environ["EMBED_BACKEND"] = "openai"
        if not os.getenv("OPENAI_API_KEY"):
            raise SystemExit("ERROR: OPENAI_API_KEY not set but --force-openai passed.")

    payload = ingest_docs_to_json(only_file=args.only_file, force_openai=args.force_openai)
    meta = payload.get("meta", {})
    print("OK:", meta)

if __name__ == "__main__":
    main()
