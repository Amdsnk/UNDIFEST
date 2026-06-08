FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN NODE_ENV=development npm install --legacy-peer-deps
COPY . .
RUN NODE_ENV=development npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/attached_assets ./attached_assets
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "dist/index.js"]
