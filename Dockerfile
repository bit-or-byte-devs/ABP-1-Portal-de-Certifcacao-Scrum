# Imagem da aplicação (API Node.js + front estático servido pelo mesmo processo).
# O backend referencia ../../frontend e ../../imagens, então a estrutura
# /app/backend, /app/frontend e /app/imagens é mantida dentro da imagem.
FROM node:22-alpine

ENV NODE_ENV=development
WORKDIR /app/backend

# Dependências primeiro, para aproveitar o cache de camadas.
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend ./
COPY frontend /app/frontend
COPY imagens /app/imagens

USER node
EXPOSE 3000
CMD ["node", "server.js"]
