# Induction Dashboard — Implementation Solution

## Overview

This document details the complete implementation of the Induction Dashboard, which allows site administrators to monitor induction activity across their organization. The solution involves backend service enhancements, database schema updates, frontend dashboard development, and a gateway API layer for centralized request handling.

---

## Requirement 1: List All Inductions with Pending Count

### Objective
Display a list of all induction programs with a count of pending records for each induction, helping administrators quickly identify which inductions have outstanding tasks.

### Implementation Details

#### Database Changes
**File**: `/workspace/services/database-init/migrations/induction/001_initial.sql`

- **Schema**: No new tables required. The `inductions` and `induction_records` tables were already present.
- **Query Logic**: The pending count is calculated dynamically using SQL aggregation:
  ```sql
  SELECT COUNT(*) as pending_count 
  FROM induction_records 
  WHERE induction_id = inductions.id AND status = 'pending'
  ```

#### Backend Changes

**File**: `/workspace/services/induction-service/src/services/inductionService.ts`

- **Method**: `getInductions()`
- **Logic**: Uses a SQL LEFT JOIN to combine inductions with their pending record counts in a single query:
  ```sql
  SELECT 
    i.id, 
    i.name,
    COALESCE(COUNT(ir.id) FILTER (WHERE ir.status = 'pending'), 0) as pending_count
  FROM inductions i
  LEFT JOIN induction_records ir ON i.id = ir.induction_id
  GROUP BY i.id, i.name
  ```
- **Result**: Each induction object includes a `pending_count` field indicating how many records are in "pending" status.

**File**: `/workspace/services/induction-service/src/types.ts`

- Added `pending_count: number` field to the `Induction` interface to match the database query result.

#### Frontend Changes

**File**: `/workspace/apps/dashboard/src/pages/Dashboard.tsx`

- **Sidebar List**: Displays inductions in a Material-UI `List` component with the following visual elements:
  - Induction name as the primary text
  - Secondary text showing pending record count (e.g., "5 pending records")
  - Color-coded chip badge:
    - **Orange (warning)**: 1 or more pending records
    - **Green (success)**: 0 pending records
- **User Interaction**: Clicking an induction item selects it and loads its associated records.

**File**: `/workspace/apps/dashboard/src/api.ts`

- `fetchInductions()` function retrieves the list from the gateway API endpoint `/api/inductions`

### CODE FLOW
UI -> middleware api.ts -> Gateway service (Forms actual end point, Response in manipulated like sorting, filtering) -> Calls API service -> Goes to router -> Call Service filen which executes DB query

---

## Requirement 2: Display Records with Company Details

### Objective
When an induction is selected, display all associated induction records enriched with company information, providing administrators with complete context about each person's induction status.

### Implementation Details

#### Database Changes

**File**: `/workspace/services/database-init/migrations/induction/001_initial.sql`

- **Schema**: No changes to tables. Data already exists in:
  - `induction_records` (contains first_name, last_name, induction_id, status, etc.)
  - `companies` table in the company database (contains company names and details)

#### Backend Changes

**File**: `/workspace/services/gateway-service/src/index.ts`

- **Endpoint**: `GET /api/inductions/:id/records`
- **Enrichment Logic**: The gateway service acts as a data orchestrator:
  1. Receives the request for records from a specific induction
  2. Calls the induction service to fetch raw induction records
  3. For each record, extracts the `company_id` field
  4. Calls the company service to fetch company details by company ID
  5. Merges company name into each record as `companyName` field
  6. Returns enriched records to the frontend (Each record now has company name embeded, sorting and filtering is done) => This response is a part opf next requirement

This enrichment pattern allows the frontend to display complete information without making multiple API calls.

#### Frontend Changes

**File**: `/workspace/apps/dashboard/src/pages/Dashboard.tsx`

- **Records Table**: Displays induction records in a Material-UI `Table` with columns:
  - **Name**: Displays `first_name` + `last_name` from the record
  - **Company**: Displays `companyName` from the enriched gateway response
  - **Status**: Shows status as a color-coded chip (pending, in_progress, completed)
  - **Completed**: Shows the creation timestamp in a human-readable format

**File**: `/workspace/apps/dashboard/src/api.ts`

- `fetchInductionRecords(inductionId, params)` function calls `/api/inductions/:id/records` with optional query parameters for search, filter, and sort.

---

## Requirement 3: Sorting, Filtering, and Searching

### Objective
Provide administrators with powerful tools to find specific records quickly through search (by name or company), filter by status, and sort by various fields.

### Implementation Details

#### Database Changes
- No new schema required. Existing tables contain all necessary data for filtering and sorting.

#### Backend Changes

**File**: `/workspace/services/gateway-service/src/index.ts`

The gateway implements three key operations on the records:

1. **Search Logic** (`matchesSearch` function):
   - Searches across three fields: `first_name`, `last_name`, and `companyName` (after enrichment)
   - Uses case-insensitive substring matching
   - Filters records where any of these fields contains the search term
   - Executes **after** company enrichment to ensure company name searching works correctly

2. **Filter Logic**:
   - Filters records by `status` field
   - Supports values: "pending", "in_progress", "completed"
   - Skips filtering if status is "all" (displays all records)

3. **Sorting Logic** (`sortRecords` function):
   - Supports multiple sort fields:
     - `created_at`: Sorts by record creation date (timestamp)
     - `name`: Sorts alphabetically by first_name + last_name concatenation
     - `company_name`: Sorts alphabetically by company name
   - Supports both ascending (`asc`) and descending (`desc`) order
   - Handles proper date comparison for timestamp fields

**Processing Pipeline**:
1. Fetch raw records from induction service
2. Enrich with company data
3. Apply search filter (now works on enriched data including company name)
4. Apply status filter
5. Apply sorting
6. Return filtered and sorted results

#### Frontend Changes

**File**: `/workspace/apps/dashboard/src/pages/Dashboard.tsx`

**Search Field**:
- Text input that filters records in real-time as the user types. Debouncing is implemented to limit the number of API calls
- Placeholder: "Search by name or company"
- Updates the `preferences.search` state, which triggers a data refetch

**Status Filter Dropdown**:
- Dropdown select with options: All, Pending, In Progress, Completed
- Updates `preferences.status`
- Includes all status values from the database

**Sort Options**:
- Two dropdowns:
  1. **Sort by**: Select field (Name, Company, Created Date)
  2. **Order**: Select direction (Newest first = desc, Oldest first = asc)
- Updates `preferences.sortBy` and `preferences.sortOrder`

**Query Parameter Passing**:
- All user selections are sent to the gateway API as query parameters:
  ```
  /api/inductions/:id/records?search=john&status=pending&sortBy=created_at&sortOrder=desc
  ```

---

## Requirement 4: Save User Preferences to Database

### Objective
Persist user selections (sort, filter, search) so that when administrators return to the dashboard, their preferences are automatically restored, improving workflow efficiency.

### Implementation Details

#### Database Changes

**File**: `/workspace/services/database-init/migrations/induction/001_initial.sql`

- **New Table**: `user_preferences`
  ```sql
  CREATE TABLE user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    preferences JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Why JSONB?**: Provides flexibility to store varying preference structures without schema changes. Preferences stored as a JSON object:
  ```json
  {
    "sortBy": "created_at",
    "sortOrder": "desc",
    "status": "pending",
    "search": "john"
  }
  ```
- **Timestamps**: `created_at` and `updated_at` track when preferences were first saved and last modified.

#### Backend Changes

**File**: `/workspace/services/induction-service/src/services/inductionService.ts`

- **Method**: `getUserPreferences(userId)`
  - Queries the `user_preferences` table by `user_id`
  - Returns the stored preferences object or default preferences if no record exists
  - Default preferences: `{ sortBy: "created_at", sortOrder: "desc", status: "all", search: "" }`

- **Method**: `saveUserPreferences(userId, preferences)`
  - Uses PostgreSQL `UPSERT` pattern (INSERT ... ON CONFLICT):
    - If user_id already exists, updates the preferences and updated_at timestamp
    - If user_id doesn't exist, inserts a new record
  - Ensures one preference record per user without duplicates

**File**: `/workspace/services/induction-service/src/routers/preferencesRouter.ts`

- **GET `/preferences`**: Retrieves saved preferences for the current user
- **POST `/preferences`**: Saves or updates preferences for the current user
- Uses hardcoded `userId` as per guidelines (no authentication required)

**File**: `/workspace/services/gateway-service/src/index.ts`

- **GET `/api/user-preferences`**: Proxies to induction service preferences endpoint
- **POST `/api/user-preferences`**: Proxies preference saves to induction service

#### Frontend Changes

**File**: `/workspace/apps/dashboard/src/pages/Dashboard.tsx`

**Initialization** (on component mount):
- `useEffect` hook fetches saved preferences from `/api/user-preferences`
- Restores all UI controls (search, filter, sort) to saved values
- If no preferences exist, uses sensible defaults

**State Management**:
- `preferences` state object holds: `sortBy`, `sortOrder`, `status`, `search`
- `updatePreference(key, value)` function updates a single preference and triggers a save

**Auto-Save with Debouncing**:
- When any preference changes, a 600ms debounce timer starts
- If another change occurs within 600ms, the timer resets
- After 600ms of inactivity, preferences are saved to the database
- Benefit: Reduces database writes during rapid user interactions (e.g., typing search text)
- `savingPreferences` state shows "Saving preferences…" button text during save

**File**: `/workspace/apps/dashboard/src/api.ts`

- `fetchUserPreferences()`: GET call to `/api/user-preferences`
- `saveUserPreferences(prefs)`: POST call to `/api/user-preferences` with preference data

---

## Requirement 5: Gateway API Architecture

### Objective
Enforce centralized request routing through the gateway service, ensuring all client requests pass through a single access point for security, logging, and data orchestration.

### Implementation Details

#### Architecture

**File**: `/workspace/services/gateway-service/src/index.ts`

The gateway service acts as a reverse proxy and data orchestrator between the React dashboard and backend microservices:

**Endpoints**:

1. **GET `/api/inductions`**
   - Proxies request to induction service
   - Returns list of inductions with pending counts
   - No transformation needed; returned as-is

2. **GET `/api/inductions/:id/records`**
   - Fetches raw records from induction service
   - Enriches with company data by querying company service
   - Applies search, filter, and sort logic
   - Query parameters: `search`, `status`, `sortBy`, `sortOrder`
   - Returns enriched and processed records

3. **GET `/api/user-preferences`**
   - Proxies to induction service preferences endpoint
   - Returns saved preferences for the user

4. **POST `/api/user-preferences`**
   - Proxies to induction service preferences endpoint
   - Saves or updates user preferences in the database

**Request Flow**:
```
Frontend → Gateway Service → Induction/Company Services → Databases
```

All communication happens through the gateway, centralizing:
- Request routing
- Data enrichment logic
- Search/filter/sort processing
- Error handling
- Potential future additions (logging, auth, rate limiting)

#### Frontend Changes

**File**: `/workspace/apps/dashboard/src/api.ts`

- All API functions use `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8551`)
- All endpoints target the gateway URL, not individual services
- No direct calls to induction or company services from the frontend

**File**: `/workspace/apps/dashboard/src/vite-env.d.ts`

- Added TypeScript type definitions for `VITE_API_BASE_URL` environment variable
- Ensures type safety when accessing `import.meta.env`

---

## Technical Summary

### Technology Stack
- **Runtime**: Node.js 24
- **Backend Framework**: Express 5.1 with TypeScript 5.8.3
- **Database**: PostgreSQL 16
- **Frontend Framework**: React 19 with Vite 6.3.5
- **UI Components**: Material-UI 7.0

### Service Architecture
- **Company Service** (port 8553): Manages company data
- **Induction Service** (port 8552): Manages inductions and records, serves preferences
- **Gateway Service** (port 8551): Central API proxy for all frontend requests
- **Dashboard** (port 8550): React application served through Vite

### Key Design Decisions

1. **Enrichment at Gateway Level**: Company data is fetched and merged by the gateway, not the induction service, reducing coupling and allowing reuse of the enrichment logic.

2. **JSONB for Preferences**: Using PostgreSQL's JSONB column type provides flexibility for future preference expansion without database migrations.

3. **Debounced Saves**: Preferences are saved with a 600ms debounce to reduce database load during user interaction.

4. **Case-Insensitive Search**: All search operations are case-insensitive to improve user experience.

5. **Application-Layer Sorting**: Sorting is handled in the gateway (Node.js) rather than in SQL, making it easier to sort on derived fields like `companyName`.

6. **Hardcoded User ID**: Per requirements, a hardcoded user ID is used for preferences, eliminating the need for authentication.

---

## Deployment and Testing

### Running the Full Application

```bash
# Start all services and dashboard
npm run dev

# In separate terminals, you can also run individual services:
npm --workspace=gateway-service run dev
npm --workspace=induction-service run dev
npm --workspace=company-service run dev
npm --workspace=dashboard run dev
```

### Test Cases
I have integrated playwright and written few test cases. This needs refinement.

### Verifying the Implementation

1. **View Inductions List**: Open the dashboard and verify all inductions appear with correct pending counts
2. **Select Induction**: Click an induction and verify associated records display with company names
3. **Search**: Type a name or company name in the search field and verify results filter in real-time
4. **Filter by Status**: Select a status and verify only matching records appear
5. **Sort**: Click "Sort by" and "Order" dropdowns and verify records re-order correctly
6. **Preferences Persistence**: Set search/filter/sort options, refresh the page, and verify they're restored

---

## Conclusion

The Induction Dashboard successfully implements all requirements through a coordinated combination of backend enhancements, database schema updates, and a modern React frontend. The gateway architecture ensures scalability and maintainability, while the preference storage system enhances user productivity through personalized workflows.


## Next Steps
To make this code production ready, below updates should be made:
1. Use environment variables for API URLs.
2. Logging will be done with proper log messages.
3. Proper error handling based on each error code returned, show fallback UI as well
4. Include accessability like keyboard navigation, screen reader support
5. Sensitive information like the database connection parameters should be stored in vault or encrypted in the code.
6. Authentication should be added, API should validate the user based on token before execution.