FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy shared and api package sources
COPY shared/ shared/
COPY api/ api/
COPY migrations/ migrations/

RUN npm ci --workspace=@job-queue/shared --workspace=@job-queue/api
RUN npm run build --workspace=@job-queue/shared
RUN npm run build --workspace=@job-queue/api

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json /app/tsconfig.json ./
COPY --from=builder /app/shared/package.json shared/package.json
COPY --from=builder /app/shared/dist/ shared/dist/
COPY --from=builder /app/api/package.json api/package.json
COPY --from=builder /app/api/dist/ api/dist/
COPY --from=builder /app/migrations/ migrations/

RUN npm ci --workspace=@job-queue/shared --workspace=@job-queue/api --omit=dev

EXPOSE 4000

CMD ["node", "api/dist/index.js"]
