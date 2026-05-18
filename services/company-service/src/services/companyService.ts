import { pool } from "../db";
import { Company } from "../types";

export async function getCompanies(): Promise<Company[]> {
  const result = await pool.query(
    "SELECT * FROM companies ORDER BY created_at DESC"
  );
  return result.rows;
}
