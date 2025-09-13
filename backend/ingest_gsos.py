from search import ingest_docs_to_json

if __name__ == "__main__":
    payload = ingest_docs_to_json()
    print(f"Wrote {payload['meta']['count']} chunks to data/gsos_chunks.json (openai={payload['meta']['openai']})")
