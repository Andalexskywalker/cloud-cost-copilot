# Cloud Cost Copilot (Template)

## Quickstart
1. `cp .env.example .env`
2. `docker compose up -d --build`
3. Frontend: http://localhost:3000 — Backend: http://localhost:8000/docs

## Stack
- FastAPI + SQLAlchemy + Postgres
- Next.js + TS + Tailwind
- Docker Compose

## Demo Mode
- With `DEMO_MODE=1`, the backend creates tables and **seeds 60 days** of synthetic data.

## Next Steps
- Add aggregate endpoint for day/service series.
- Implement anomaly rules (3σ, % weekday) and `alerts` table writes.
- Add Slack webhook with deep link to frontend filters.
- Add integration tests with DB container.
