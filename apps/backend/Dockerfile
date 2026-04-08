FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --include=dev

RUN npx prisma generate

COPY . .

RUN npm run build && find /app -name "main.js" 2>/dev/null | head -20 && ls -la /app/dist 2>/dev/null || echo "dist no existe"

EXPOSE 3001

CMD ["sh", "-c", "ls -la /app && ls -la /app/dist 2>/dev/null || echo 'dist NO existe' && npx prisma migrate deploy && node dist/main.js"]
