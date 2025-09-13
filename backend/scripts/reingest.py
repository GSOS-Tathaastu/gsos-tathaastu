import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))  # add backend/ to path

from search import ingest_docs_to_json

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Reingest GSOS docs into JSON index.")
    parser.add_argument("--only-file", type=str, help="Specific filename in backend/docs")
    parser.add_argument("--force-openai", action="store_true", help="Force using OpenAI embeddings")
    args = parser.parse_args()

    payload = ingest_docs_to_json(only_file=args.only_file, force_openai=args.force_openai)
    print("Ingested:", payload["meta"])
