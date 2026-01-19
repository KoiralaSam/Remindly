FROM golang:1.25.0-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download && go mod verify

COPY . .

RUN go build -o /usr/local/bin/main ./cmd/server/main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates wget

WORKDIR /root/

COPY --from=builder /usr/local/bin/main .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./main"]