# Build from the monorepo root: docker build -f artifacts/api-server/Dockerfile .
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY artifacts/api-server ./artifacts/api-server
RUN pnpm install --no-frozen-lockfile --ignore-scripts

FROM deps AS build
RUN pnpm --filter @workspace/api-server exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @workspace/api-server run build

FROM base AS runtime-deps
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
RUN pnpm install --prod --no-frozen-lockfile

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/prisma ./prisma
COPY --from=runtime-deps /repo/node_modules ./node_modules
COPY --from=build /repo/node_modules/.prisma ./node_modules/.prisma
USER node
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8082) + '/api/readyz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
