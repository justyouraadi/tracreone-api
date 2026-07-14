# Build from the monorepo root: docker build -f artifacts/api-server/Dockerfile .
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY artifacts/api-server ./artifacts/api-server
RUN pnpm install --no-frozen-lockfile --ignore-scripts

FROM deps AS build
RUN pnpm --filter @workspace/api-server exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @workspace/api-server run build

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/prisma ./prisma
COPY --from=build /repo/node_modules ./node_modules
# Run as the non-root "node" user baked into the base image, rather than
# root, to limit blast radius if the process is ever compromised.
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/readyz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
