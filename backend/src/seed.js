import { prisma } from "./prisma.js";

const seedSentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Typing fast is great, but accuracy is even better.",
  "Practice every day to improve your typing speed.",
  "A good developer writes clean, readable code.",
  "Frontend makes it look nice, backend makes it work.",
  "Small steps every day lead to big results over time.",
  "React and Express make a simple full stack project.",
  "Focus on consistency and you will see progress soon."
];

async function main() {
  for (const text of seedSentences) {
    await prisma.sentence.upsert({
      where: { text },
      update: {},
      create: { text }
    });
  }
  console.log("✅ Seeded sentences");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
