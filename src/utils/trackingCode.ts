import { getConnection } from "@/config/db";
import { Filter } from "mongodb";

const COUNTER_COLLECTION = "counters";

export async function generateTrackingCode(): Promise<string> {
  const db = getConnection();
  if (!db) throw new Error("DB no conectada");
  
  const year = new Date().getFullYear();
  const counterName = "negociacion_" + year;
  
  const filter: Filter<any> = { _id: counterName };
  
  const result = await db.collection(COUNTER_COLLECTION).findOneAndUpdate(
    filter,
    { "$inc": { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  
  const seq = result?.seq ?? 1;
  const padded = String(seq).padStart(4, "0");
  return "NEG-" + year + "-" + padded;
}

export async function getNextTrackingCodePreview(): Promise<string> {
  const db = getConnection();
  if (!db) throw new Error("DB no conectada");
  
  const year = new Date().getFullYear();
  const counterName = "negociacion_" + year;
  
  const filter: Filter<any> = { _id: counterName };
  const doc = await db.collection(COUNTER_COLLECTION).findOne(filter);
  const nextSeq = (doc?.seq ?? 0) + 1;
  const padded = String(nextSeq).padStart(4, "0");
  return "NEG-" + year + "-" + padded;
}
