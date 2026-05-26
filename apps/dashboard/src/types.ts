export type InductionStatus = "pending" | "in_progress" | "completed" | "all";
export type SortBy =
  | "first_name"
  | "last_name"
  | "company_name"
  | "status"
  | "created_at";

export interface Induction {
  id: string;
  name: string;
  pending_count: number;
}

export interface InductionRecord {
  id: string;
  induction_id: string;
  first_name: string;
  last_name: string;
  company_id: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
  companyName: string;
}

export interface UserPreferences {
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  status: InductionStatus;
  search: string;
}
