const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const root = path.resolve(__dirname, "..");

  loadEnvFile(path.join(root, ".env"));
  loadEnvFile(path.join(root, ".env.local"));

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const seedPath = path.join(root, "data", "bos-project-directory.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const now = new Date();
  const actor = "seed:bos-project-directory";

  await mongoose.connect(databaseUrl, {
    bufferCommands: false,
  });

  const collection = mongoose.connection.db.collection("bosroadmaps");

  await collection.deleteMany({});

  await collection.insertOne({
    ...seed,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    updatedBy: actor,
  });

  console.log(
    `Imported ${seed.title} with ${seed.prds.length} PRDs into bosroadmaps.`,
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Failed to import BOS product directory.");
  console.error(error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exit(1);
});
