FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -S gateway && adduser -S gateway -G gateway

COPY package*.json ./

RUN npm ci

COPY --chown=gateway:gateway . .

USER gateway

EXPOSE 3000

CMD ["npm", "start"]

