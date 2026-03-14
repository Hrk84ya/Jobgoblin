FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY shared/ shared/
COPY ui/ ui/

RUN npm ci --workspace=@job-queue/shared --workspace=@job-queue/ui
RUN npm run build --workspace=@job-queue/shared
RUN npm run build --workspace=@job-queue/ui

FROM nginx:alpine

COPY --from=builder /app/ui/dist /usr/share/nginx/html
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
