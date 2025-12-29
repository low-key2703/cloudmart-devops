# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o main ./cmd/server



# Stage 2: Run
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache wget

RUN addgroup -S order && adduser -S order -G order

COPY --from=builder --chown=order:order /app/main .

USER order

EXPOSE 8080

CMD ["./main"]

