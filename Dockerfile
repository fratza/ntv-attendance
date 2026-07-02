# Production image for hosts like Render: builds a standard Node server
# (nitro "node-server" preset, see vite.config.ts) rather than the
# Cloudflare Worker bundle this stack defaults to.

FROM node:22-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
