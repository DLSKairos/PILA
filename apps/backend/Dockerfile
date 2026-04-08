FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate && npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
