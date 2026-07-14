FROM node:24-slim
RUN corepack enable && mkdir -p /app
WORKDIR /app

COPY pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY artifacts/api-server ./artifacts/api-server

RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm --filter @workspace/api-server exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8082) + '/api/readyz', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
