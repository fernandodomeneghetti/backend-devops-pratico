FROM node:24.22-alpine

WORKDIR /app

# Copiar os arquivos packages para a pasta app
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["node", "dist/index.js"]