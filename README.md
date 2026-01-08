# Cloud Cost Copilot

## Overview
**Cloud Cost Copilot** is a full-stack dashboard designed to monitor cloud infrastructure costs and detect anomalies in real-time. It features a synthetic data generator for demonstration purposes, proving the ability to handle time-series data visualization and cost alerting logic.

## Architecture
This project demonstrates a modern, containerized microservices architecture:

- **Frontend**: [Next.js 14](https://nextjs.org/) with TypeScript and Tailwind CSS for a responsive, type-safe UI.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python) for high-performance API endpoints.
- **Database**: [PostgreSQL](https://www.postgresql.org/) managed via [SQLAlchemy](https://www.sqlalchemy.org/) ORM.
- **Infrastructure**: Fully containerized using **Docker** and **Docker Compose** for consistent development and deployment environments.

## Quickstart
1. Clone the repository and navigate to the project root.
2. Initialize environment: `cp .env.example .env`
3. Launch the stack: `docker compose up -d --build`
4. Access the application:
    - **Frontend Dashboard**: http://localhost:3000
    - **Backend API Docs**: http://localhost:8000/docs

## Features
- **Real-time Cost Visualization**: Interactive charts showing daily spend per service.
- **Data Seeding**: Automatically seeds 60 days of realistic synthetic data when `DEMO_MODE=1`.
- **Responsive Design**: Built with mobile-first principles using Tailwind CSS.

## Roadmap
- [ ] Add aggregate endpoint for multi-service time series comparison.
- [ ] Implement advanced anomaly detection rules (3-sigma, weekday deviation).
- [ ] Integrate Slack webhooks for instant cost alerts.
- [ ] Add integration tests for the full containerized stack.
