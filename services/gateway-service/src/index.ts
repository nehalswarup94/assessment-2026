import express from "express";
import cors from "cors";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const app = express();
const PORT = process.env.PORT || 8551;
const INDUCTION_SERVICE_URL = process.env.INDUCTION_SERVICE_URL || "http://localhost:8552";
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || "http://localhost:8553";

app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }));
app.use(express.json());

function fetchJson<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "https:" ? https : http;
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (payload) {
      headers["Content-Type"] = "application/json";
    }

    const req = transport.request(
      parsed,
      {
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");

          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Request failed ${res.statusCode}: ${text}`));
          }

          try {
            const json = text ? JSON.parse(text) : {};
            resolve(json as T);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

function sortRecords(records: any[], sortBy: string, sortOrder: string) {
  const normalized = sortBy || "created_at";
  const multiplier = sortOrder === "desc" ? -1 : 1;

  return [...records].sort((a, b) => {
    const getValue = (record: any) => {
      if (normalized === "company_name") {
        return record.companyName;
      }
      return record[normalized];
    };

    const left = getValue(a);
    const right = getValue(b);

    if (left == null || right == null) {
      return 0;
    }

    if (normalized === "created_at") {
      return (
        (new Date(left).getTime() - new Date(right).getTime()) * multiplier
      );
    }

    return String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: "base",
    }) * multiplier;
  });
}

function matchesSearch(record: any, search: string): boolean {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const companyName = (record.companyName || "").toLowerCase();
  return [record.first_name, record.last_name, companyName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway-service" });
});

app.get("/api/inductions", async (_req, res) => {
  try {
    const url = `${INDUCTION_SERVICE_URL}/induction`;
    const inductions = await fetchJson(url);
    res.json(inductions);
  } catch (error) {
    console.error("Error fetching inductions:", error);
    res.status(500).json({ error: "Failed to fetch inductions" });
  }
});

app.get("/api/inductions/:id/records", async (req, res) => {
  try {
    const { id } = req.params;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "created_at";
    const sortOrder = typeof req.query.sortOrder === "string" ? req.query.sortOrder : "desc";

    const inductionUrl = new URL(`${INDUCTION_SERVICE_URL}/induction/${id}/records`);
    if (status) {
      inductionUrl.searchParams.set("status", status);
    }

    const records = await fetchJson<any[]>(inductionUrl.toString());
    const companies = await fetchJson<any[]>(`${COMPANY_SERVICE_URL}/company`);
    const companyMap = new Map(companies.map((company) => [company.id, company]));

    const enriched = records.map((record) => ({
      ...record,
      companyName: companyMap.get(record.company_id)?.name || "Unknown Company",
    }));

    const filtered = enriched.filter((record) => matchesSearch(record, search ?? ""));
    const sorted = sortRecords(filtered, sortBy, sortOrder);

    res.json(sorted);
  } catch (error) {
    console.error("Error fetching induction records:", error);
    res.status(500).json({ error: "Failed to fetch induction records" });
  }
});

app.get("/api/user-preferences", async (req, res) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "default-user";
    const url = new URL(`${INDUCTION_SERVICE_URL}/preferences`);
    url.searchParams.set("userId", userId);

    const preferences = await fetchJson(url.toString());
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

app.post("/api/user-preferences", async (req, res) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "default-user";
    const url = new URL(`${INDUCTION_SERVICE_URL}/preferences`);
    url.searchParams.set("userId", userId);

    const preferences = await fetchJson(url.toString(), "POST", req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ error: "Failed to save user preferences" });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
});
