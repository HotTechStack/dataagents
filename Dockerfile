# *****************************************************************************
# 1) Base image with PNPM installed
# *****************************************************************************
FROM node:20-alpine AS base

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# *****************************************************************************
# 2) Dependencies stage - just install
# *****************************************************************************
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# *****************************************************************************
# 3) Builder stage
#    - Provide all required environment variables as build args
#    - Mark them as ENV so Next.js can inject them into your client code
# *****************************************************************************
FROM base AS builder

# Declare all build args (including any that are NOT prefixed with NEXT_PUBLIC_,
# e.g. your database or secrets). The ones that you want to appear in the client
# must be NEXT_PUBLIC_ so that Next.js includes them in the browser build.
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# n8n
ARG NEXT_PUBLIC_AGENT_API_URL
ARG NEXT_PUBLIC_AGENT_API_KEY

ARG NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW
ARG NEXT_PUBLIC_N8N_OPENAI_WORKFLOW
ARG NEXT_PUBLIC_N8N_OLLAMA_WORKFLOW
ARG NEXT_PUBLIC_N8N_CLAUDE_WORKFLOW
ARG NEXT_PUBLIC_N8N_GEMINI_WORKFLOW

# OpenAI / Ollama / Claude / Azure / Gemini
ARG NEXT_PUBLIC_OPENAI_API_KEY
ARG NEXT_PUBLIC_OLLAMA_API_URL
ARG NEXT_PUBLIC_ANTHROPIC_API_KEY
ARG NEXT_PUBLIC_AZURE_OPENAI_API_KEY
ARG NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT
ARG NEXT_PUBLIC_GEMINI_API_KEY

# Make them ENV so that Next.js sees them during build
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

ENV NEXT_PUBLIC_AGENT_API_URL=$NEXT_PUBLIC_AGENT_API_URL
ENV NEXT_PUBLIC_AGENT_API_KEY=$NEXT_PUBLIC_AGENT_API_KEY

ENV NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW=$NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW
ENV NEXT_PUBLIC_N8N_OPENAI_WORKFLOW=$NEXT_PUBLIC_N8N_OPENAI_WORKFLOW
ENV NEXT_PUBLIC_N8N_OLLAMA_WORKFLOW=$NEXT_PUBLIC_N8N_OLLAMA_WORKFLOW
ENV NEXT_PUBLIC_N8N_CLAUDE_WORKFLOW=$NEXT_PUBLIC_N8N_CLAUDE_WORKFLOW
ENV NEXT_PUBLIC_N8N_GEMINI_WORKFLOW=$NEXT_PUBLIC_N8N_GEMINI_WORKFLOW

ENV NEXT_PUBLIC_OPENAI_API_KEY=$NEXT_PUBLIC_OPENAI_API_KEY
ENV NEXT_PUBLIC_OLLAMA_API_URL=$NEXT_PUBLIC_OLLAMA_API_URL
ENV NEXT_PUBLIC_ANTHROPIC_API_KEY=$NEXT_PUBLIC_ANTHROPIC_API_KEY
ENV NEXT_PUBLIC_AZURE_OPENAI_API_KEY=$NEXT_PUBLIC_AZURE_OPENAI_API_KEY
ENV NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=$NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Create a public directory if you don't already have one
RUN mkdir -p public

# If you use Prisma, generate client
RUN pnpm prisma generate

# Verify standalone config
RUN grep -q "output.*standalone" next.config.js || \
    (echo "Error: Your next.config.js must have 'output: standalone' set" && exit 1)

# Build the Next.js app
RUN pnpm build

# *****************************************************************************
# 4) Production runner stage
#    - Copies the compiled output and sets up the final container
# *****************************************************************************

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create the non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create the .next directory (and cache subfolder)
RUN mkdir -p .next/cache
RUN mkdir -p public

# Copy your build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# If you also need to copy other subfolders like .next/cache, do so here:
# COPY --from=builder /app/.next/cache ./.next/cache

# Ensure the .next folder is owned by nextjs
RUN chown -R nextjs:nodejs .next
RUN chown -R nextjs:nodejs public

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

CMD ["node", "server.js"]
