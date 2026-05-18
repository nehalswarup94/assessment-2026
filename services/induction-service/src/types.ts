export interface Induction {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export type InductionStatus = "pending" | "in_progress" | "completed";

export interface InductionRecord {
  id: string;
  induction_id: string;
  first_name: string;
  last_name: string;
  company_id: string;
  status: InductionStatus;
  created_at: Date;
  updated_at: Date;
}
