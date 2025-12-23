FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -S userservice && adduser -S userservice -G userservice

COPY package*.json ./

RUN npm ci

COPY --chown=userservice:userservice . .

USER userservice

EXPOSE 3001

CMD ["npm", "start"]
