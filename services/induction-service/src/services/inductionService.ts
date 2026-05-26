import { pool } from "../db";
import { Induction, InductionRecord, UserPreferences } from "../types";

export async function getInductions(): Promise<Induction[]> {
  const result = await pool.query(
    `SELECT
      i.id,
      i.name,
      i.created_at,
      i.updated_at,
      COALESCE(pending_counts.pending_count, 0)::int AS pending_count
    FROM inductions i
    LEFT JOIN (
      SELECT induction_id, COUNT(*) AS pending_count
      FROM induction_records
      WHERE status = 'pending'
      GROUP BY induction_id
    ) AS pending_counts ON pending_counts.induction_id = i.id
    ORDER BY i.name ASC`
  );

  return result.rows;
}

export async function getInductionRecords(
  inductionId: string,
  options?: {
    status?: string;
  }
): Promise<InductionRecord[]> {
  const values: Array<string> = [inductionId];
  let query = `SELECT * FROM induction_records WHERE induction_id = $1`;

  if (options?.status && options.status !== "all") {
    values.push(options.status);
    query += ` AND status = $${values.length}`;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, values);
  return result.rows;
}

export async function getAllInductionRecords(): Promise<InductionRecord[]> {
  const result = await pool.query(
    "SELECT * FROM induction_records ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const result = await pool.query(
    "SELECT preferences FROM user_preferences WHERE user_id = $1",
    [userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0].preferences as UserPreferences;
}

export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<UserPreferences> {
  const result = await pool.query(
    `INSERT INTO user_preferences (user_id, preferences)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP
     RETURNING preferences`,
    [userId, preferences]
  );

  return result.rows[0].preferences as UserPreferences;
}
