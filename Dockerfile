# 食单 · 一周食谱规划 — 零依赖静态服务器
FROM node:22-alpine

WORKDIR /app

# 纯静态项目，无依赖，无需 npm install
COPY . .

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8765/ > /dev/null || exit 1

CMD ["node", "server.js", "8765"]
