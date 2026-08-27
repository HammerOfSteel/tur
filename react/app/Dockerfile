# Production image for the Phase 4 headless storefront (react/design-a's `nextjs` service).
#
# Build context is the MONOREPO ROOT (../.. from this file, i.e. `docker compose` is invoked
# from react/design-a/ with `context: ../..`), not react/app/, because two of this app's
# statically-prerendered pages (Om oss, Kontakt, Galleri — see next build's route list) read
# content/pages.sv.json via lib/content.ts AT BUILD TIME, and Docker's build step has no access
# to anything outside its context. CONTENT_DIR is set to a fixed in-image path so this works
# identically to local dev's monorepo-relative resolution.

FROM node:20-alpine AS deps
WORKDIR /app
COPY react/app/package.json react/app/package-lock.json* ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY react/app/ ./
COPY content/ /content
COPY design-system/ /design-system
ARG NEXT_PUBLIC_THEME_VARIANT=a
ENV NEXT_PUBLIC_THEME_VARIANT=${NEXT_PUBLIC_THEME_VARIANT}
ENV CONTENT_DIR=/content
ENV DESIGN_TOKENS_DIR=/design-system/tokens
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV CONTENT_DIR=/content
ENV PORT=3000
COPY --from=builder /content /content
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
