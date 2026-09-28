FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build needs a database for statically rendered pages; use a throwaway one.
RUN DATABASE_URL=file:/tmp/build.db npx prisma migrate deploy && DATABASE_URL=file:/tmp/build.db npx tsx prisma/seed.ts && DATABASE_URL=file:/tmp/build.db npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
