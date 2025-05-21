# syntax=docker/dockerfile:1
# check=experimental=all

FROM node:18-alpine@sha256:c698ffe060d198dcc6647be78ea1683363f12d5d507dc5c7b5eece52ede938bd
RUN npm install -g typescript
RUN addgroup -S visagroup && adduser -S visauser -G visagroup
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm run build

USER visauser
ENTRYPOINT ["node", "/app/dist/index.js"]