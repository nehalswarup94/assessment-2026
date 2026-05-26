export interface Induction {
  id: string;
  name: string;
  pending_count: number;
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

export interface UserPreferences {
  sortBy: "first_name" | "last_name" | "company_name" | "status" | "created_at";
  sortOrder: "asc" | "desc";
  status?: InductionStatus | "all";
  search?: string;
}
