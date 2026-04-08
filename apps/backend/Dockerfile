FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --include=dev

RUN npx prisma generate

COPY . .

RUN npm run build
RUN ls -la /app/dist/main.js

EXPOSE 3001

CMD ["sh", "-c", "ls -la /app && ls -la /app/dist 2>/dev/null || echo 'dist NO existe' && npx prisma migrate deploy && node dist/main.js"]
