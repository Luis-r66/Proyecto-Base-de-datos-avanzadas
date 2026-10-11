import mongoose, { Connection, ClientSession } from "mongoose";
import { env } from "./env";

let cached: Connection | null = null;

export async function connectDB(): Promise<Connection> {
  if (cached && cached.readyState === 1) return cached;
  const conn = await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 45000,
  });
  cached = conn.connection;
  return cached;
}

export async function withTransaction<T>(cb: (s: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const r = await cb(session);
    await session.commitTransaction();
    return r;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    await session.endSession();
  }
}

export function getConnection(): Connection | null {
  return cached;
}
