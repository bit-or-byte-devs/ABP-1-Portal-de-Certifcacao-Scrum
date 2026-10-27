# Imagem da aplicaÃ§Ã£o (API Node.js + front estÃ¡tico servido pelo mesmo processo).
# O backend referencia ../../frontend e ../../imagens, entÃ£o a estrutura
# /app/backend, /app/frontend e /app/imagens Ã© mantida dentro da imagem.
FROM node:22-alpine

ENV NODE_ENV=development
WORKDIR /app/backend

# DependÃªncias primeiro, para aproveitar o cache de camadas.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend ./
COPY frontend /app/frontend
COPY imagens /app/imagens
COPY database /app/database

USER node
EXPOSE 3000
CMD ["node", "server.js"]
