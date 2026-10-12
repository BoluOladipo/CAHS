FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspaces --if-present || npm install
COPY packages/shared packages/shared
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && npx tsx src/index.ts"]
