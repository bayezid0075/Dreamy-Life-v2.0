FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY packages/whatsapp-gateway/package.json ./
RUN npm install

COPY packages/whatsapp-gateway/tsconfig.json ./
COPY packages/whatsapp-gateway/src ./src

RUN npm run build

RUN mkdir -p sessions

EXPOSE 5001

CMD ["npm", "start"]
