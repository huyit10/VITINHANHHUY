# Giao diện tĩnh (thư mục gốc) + API Node trong server/
FROM node:20-bookworm-slim

WORKDIR /app

COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

COPY index.html css.css ./
COPY server ./server

WORKDIR /app/server

RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
