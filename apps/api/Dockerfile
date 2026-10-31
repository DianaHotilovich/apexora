FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @apexora/api --workspace @apexora/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @apexora/shared && npm run build -w @apexora/api
ENV PORT=4000
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
