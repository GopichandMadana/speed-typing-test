# Speed Typing Test (Full Stack)

A simple full-stack speed typing test app with:
- React (Vite) frontend
- Express backend API
- SQLite database via Prisma
- Admin panel to add/delete sentences
- Submit + Reset + New sentence buttons
- WPM, Accuracy, Errors metrics

## Prereqs
- Node.js 18+ recommended

## Run locally

### 1) Backend
```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

Backend runs at http://localhost:4000

### 2) Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Notes
- CORS is configured for localhost:5173.
- Admin endpoints are not protected (for demo). Add auth for production.
