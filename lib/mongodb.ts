import mongoose from "mongoose";

import { ensureHardcodedAdmin } from "@/lib/auth/hardcoded-admin";

function getMongoUri() {
  const mongoUri = process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return mongoUri;
}

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache__?: MongooseCache;
};

const mongooseCache = globalForMongoose.__mongooseCache__ ?? {
  connection: null,
  promise: null,
};

globalForMongoose.__mongooseCache__ = mongooseCache;

export async function connectToDatabase() {
  if (mongooseCache.connection) {
    await ensureHardcodedAdmin(); // memoised — a no-op after the first run, but picks up new seeded admins after a reload
    return mongooseCache.connection;
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  try {
    mongooseCache.connection = await mongooseCache.promise;
  } catch (error) {
    /* a failed attempt (a DNS blip, the network dropping) isn't kept — the next request tries again, instead of every
       request failing until the server restarts */
    mongooseCache.promise = null;
    throw error;
  }
  await ensureHardcodedAdmin();
  return mongooseCache.connection;
}
