# 👺 JobGoblin

A self-hosted distributed job queue with priority processing, retries, dead-letter handling, and a live dashboard — all in one `docker-compose up`.

Built with TypeScript, BullMQ, Redis, PostgreSQL, Express, and React. Zero cloud dependencies.

## Features

- Priority-based job processing (critical → high → normal → low)
- Automatic retries with exponential backoff
- Dead-letter queue for persistently failing jobs
- Live monitoring dashboard with charts, filters, and job submission
- Per-queue concurrency control
- Configurable job timeouts
- Delayed and scheduled job support
- Durable state in PostgreSQL (survives restarts)

## Quick Start

```bash
cp .env.example .env
docker-compose up --build
```

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

Submit jobs from the dashboard UI or via the API:

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"type": "send-email", "queue": "email", "priority": "high", "payload": {"to": "dev@example.com"}}'
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dashboard  │────▶│  API Server  │────▶│    Redis     │
│  React :3000 │     │ Express :4000│     │  BullMQ :6379│
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  PostgreSQL  │◀────│    Worker    │
                     │        :5432 │     │   BullMQ     │
                     └──────────────┘     └──────────────┘
```

| Service    | Port | Description                         |
|------------|------|-------------------------------------|
| Dashboard  | 3000 | React + Tailwind monitoring UI      |
| API Server | 4000 | Express REST API for job management |
| Worker     | —    | BullMQ job processors               |
| Redis      | 6379 | In-memory message broker            |
| PostgreSQL | 5432 | Durable job state persistence       |

## Project Structure

```
├── shared/      # Shared TypeScript types, Zod schemas, migrations
├── api/         # Express API server
├── worker/      # BullMQ worker with handler registry
├── ui/          # React + Tailwind + Recharts dashboard
├── migrations/  # PostgreSQL schema
└── docker-compose.yml
```

## API Endpoints

| Method | Path                  | Description                 |
|--------|-----------------------|-----------------------------|
| POST   | `/api/jobs`           | Submit a new job            |
| GET    | `/api/jobs`           | List jobs (filtered, paged) |
| GET    | `/api/jobs/:id`       | Get job by ID               |
| POST   | `/api/jobs/:id/retry` | Retry a failed job          |
| GET    | `/api/queues/stats`   | Queue statistics            |
| GET    | `/api/dlq`            | List dead-letter queue jobs |

## Sample Job Types

| Type              | Queue            | Simulated Duration |
|-------------------|------------------|--------------------|
| `send-email`      | email            | 1–3s               |
| `resize-image`    | video-processing | 2–5s               |
| `generate-report` | notifications    | 3–7s               |

## Local Development

```bash
npm install
npm run build --workspaces
```

## Environment Variables

See [`.env.example`](.env.example) for all configurable options: database credentials, Redis connection, worker concurrency, retry limits, and job timeouts.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ (for local dev only)

## License

[MIT](LICENSE)
