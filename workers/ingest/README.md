\# GSOS Re-ingest Worker (Railway)



Runs embeddings for docs under `GSOS\_DATA\_DIR` (or local `./data`) and upserts into MongoDB `chunks` collection.



\## Env (set on Railway Service)

\- `MONGODB\_URI` = your Atlas URI (no DB name required)

\- `MONGODB\_DB` = gsos        # or any DB name you prefer

\- `OPENAI\_API\_KEY` = sk-...

\- `EMBEDDING\_MODEL` = text-embedding-3-small

\- `GSOS\_DATA\_DIR` = /data     # optional; mount a volume or point to a checked-in folder



\## Start command

The Dockerfile runs `npm start` ⇒ `node ingest.mjs`



\## One-off run (Railway “Deploy once”)

Triggers the worker to run then exit.



\## Scheduled runs

Use Railway’s Scheduler / Cron to run the service periodically (e.g., hourly, daily). The container runs `node ingest.mjs` and exits.



\## Data source options

1\) \*\*Bind a volume\*\* (preferred for large corpora). Mount your documents directory as `/data` and set `GSOS\_DATA\_DIR=/data`.

2\) \*\*Bake files into image\*\*: COPY a `data/` folder in Dockerfile (good for baseline docs; requires rebuild to update).

3\) \*\*Remote storage\*\*: extend `readAllTextFiles()` to fetch from S3/Azure/GCS and stream content.



