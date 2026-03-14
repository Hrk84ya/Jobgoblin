FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy shared and worker package sources
COPY shared/ shared/
COPY worker/ worker/
COPY migrations/ migrations/

RUN npm ci --workspace=@job-queue/shared --workspace=@job-queue/worker
RUN npm run build --workspace=@job-queue/shared
RUN npm run build --workspace=@job-queue/worker

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json /app/tsconfig.json ./
COPY --from=builder /app/shared/package.json shared/package.json
COPY --from=builder /app/shared/dist/ shared/dist/
COPY --from=builder /app/worker/package.json worker/package.json
COPY --from=builder /app/worker/dist/ worker/dist/
COPY --from=builder /app/migrations/ migrations/

RUN npm ci --workspace=@job-queue/shared --workspace=@job-queue/worker --omit=dev

CMD ["node", "worker/dist/index.js"]
