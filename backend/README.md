# Backend

## Setup
```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run seed
npm run dev
```

## Endpoints
- GET /health
- GET /api/sentences/random
- GET /api/sentences
- POST /api/sentences { text }
- DELETE /api/sentences/:id
- POST /api/typing/submit { sentenceText, typedText, timeSeconds }
