# Dev image: vite's `vite` binary shebangs to `env node` and requires Node 20.19+/22.12+,
# so we need a real Node runtime alongside bun (bun run dev shells out, it doesn't just
# execute the script with the bun runtime).
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 8080
CMD ["bun", "run", "dev", "--", "--host"]
