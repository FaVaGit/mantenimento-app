FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend ./frontend
COPY --from=build /app/app.js ./app.js
COPY --from=build /app/.env.example ./.env.example

EXPOSE 3000

CMD ["node", "backend/server.js"]