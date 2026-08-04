FROM node:24.4.1-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY db ./db
COPY public ./public
COPY openapi.yaml README.md ./
RUN mkdir -p /data && chown -R node:node /app /data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 VERIFIER_SQLITE_PATH=/data/verifier.sqlite
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node","src/api/server.ts"]
