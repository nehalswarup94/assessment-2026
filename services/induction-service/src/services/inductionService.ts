import { pool } from "../db";
import { Induction, InductionRecord } from "../types";

export async function getInductions(): Promise<Induction[]> {
  const result = await pool.query(
    "SELECT * FROM inductions ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function getInductionRecords(
  inductionId: string
): Promise<InductionRecord[]> {
  const result = await pool.query(
    "SELECT * FROM induction_records WHERE induction_id = $1 ORDER BY created_at DESC",
    [inductionId]
  );
  return result.rows;
}

export async function getAllInductionRecords(): Promise<InductionRecord[]> {
  const result = await pool.query(
    "SELECT * FROM induction_records ORDER BY created_at DESC"
  );
  return result.rows;
}
