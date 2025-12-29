import express from "express";
import cors from "cors";
import { z } from "zod";
import { prisma } from "./prisma.js";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://YOUR_FRONTEND_URL.vercel.app"
  ]
}));
app.get("/", (req, res) => {
  res.send("Speed Typing Test API is running 🚀");
});

app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

// Get a random sentence
app.get("/api/sentences/random", async (_, res) => {
  const count = await prisma.sentence.count();
  if (count === 0) return res.status(404).json({ error: "No sentences found." });

  const skip = Math.floor(Math.random() * count);
  const sentence = await prisma.sentence.findFirst({ skip });

  res.json(sentence);
});

// Admin: list sentences
app.get("/api/sentences", async (_, res) => {
  const sentences = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });
  res.json(sentences);
});

// Admin: add sentence
app.post("/api/sentences", async (req, res) => {
  const schema = z.object({ text: z.string().min(5).max(300).trim() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const created = await prisma.sentence.create({ data: parsed.data });
    res.status(201).json(created);
  } catch (e) {
    return res.status(409).json({ error: "Sentence already exists (must be unique)." });
  }
});

// Admin: delete sentence
app.delete("/api/sentences/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    await prisma.sentence.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

// Typing evaluation (submit)
app.post("/api/typing/submit", async (req, res) => {
  const schema = z.object({
    sentenceText: z.string().min(1),
    typedText: z.string(),
    timeSeconds: z.number().positive()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { sentenceText, typedText, timeSeconds } = parsed.data;

  // --- metrics ---
  const words = typedText.trim().length ? typedText.trim().split(/\s+/).length : 0;
  const minutes = timeSeconds / 60;
  const wpm = minutes > 0 ? Math.round(words / minutes) : 0;

  // character-level accuracy
  const target = sentenceText;
  const input = typedText;

  const maxLen = Math.max(target.length, input.length);
  let correct = 0;
  let errors = 0;

  for (let i = 0; i < maxLen; i++) {
    const a = target[i];
    const b = input[i];
    if (a === b && a !== undefined) correct++;
    else if (a !== undefined || b !== undefined) errors++;
  }

  const accuracy = maxLen === 0 ? 0 : Math.max(0, Math.round((correct / maxLen) * 100));

  res.json({
    wpm,
    accuracy,
    errors,
    timeSeconds: Math.round(timeSeconds * 10) / 10
  });
});

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});
