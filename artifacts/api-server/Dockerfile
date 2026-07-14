# Build from the monorepo root: docker build -f artifacts/api-server/Dockerfile .
FROM node:24-slim AS base
WORKDIR /repo

FROM base AS build-deps
COPY artifacts/api-server/package.json ./
RUN npm install

FROM base AS runtime-deps
COPY artifacts/api-server/package.json ./
RUN npm install --omit=dev --ignore-scripts

FROM base AS build
COPY --from=build-deps /repo/node_modules ./node_modules
COPY artifacts/api-server ./artifacts/api-server
RUN node node_modules/prisma generate --schema=artifacts/api-server/prisma/schema.prisma
RUN node artifacts/api-server/build.mjs

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/prisma ./prisma
COPY --from=runtime-deps /repo/node_modules ./node_modules
RUN node node_modules/prisma generate --schema=prisma/schema.prisma
USER node
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8082) + '/api/readyz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
