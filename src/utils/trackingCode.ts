import { getConnection } from "../config/db";

export async function generateTrackingCode(): Promise<string> {
  const db = getConnection();
  if (!db || !db.db) throw new Error("DB no conectada");
  const year = new Date().getFullYear();
  const name = "negociacion_" + year;
  const r: any = await db.db.collection("counters").findOneAndUpdate(
    { _id: name } as any,
    { $inc: { seq: 1 } } as any,
    { upsert: true, returnDocument: "after" } as any
  );
  const seq = r?.seq ?? 1;
  return "NEG-" + year + "-" + String(seq).padStart(4, "0");
}
