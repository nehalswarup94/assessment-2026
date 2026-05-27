import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  fetchInductionRecords,
  fetchInductions,
  fetchUserPreferences,
  saveUserPreferences,
} from "../api";
import { Induction, InductionRecord, SortBy, UserPreferences } from "../types";

const DEFAULT_PREFERENCES: UserPreferences = {
  sortBy: "created_at",
  sortOrder: "desc",
  status: "all",
  search: "",
};

const statusLabel: Record<string, string> = {
  all: "All Statuses",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "created_at", label: "Recent" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "company_name", label: "Company" },
  { value: "status", label: "Status" },
];

function statusChipColor(status: string) {
  switch (status) {
    case "pending":
      return "warning";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    default:
      return "default";
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Dashboard() {
  const [inductions, setInductions] = useState<Induction[]>([]);
  const [selectedInductionId, setSelectedInductionId] = useState<string>("");
  const [records, setRecords] = useState<InductionRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [searchInput, setSearchInput] = useState<string>(DEFAULT_PREFERENCES.search);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const selectedInduction = useMemo(
    () => inductions.find((induction) => induction.id === selectedInductionId),
    [inductions, selectedInductionId]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [inductionList, savedPreferences] = await Promise.all([
          fetchInductions(),
          fetchUserPreferences(),
        ]);

        setInductions(inductionList);
        setPreferences((prev) => ({ ...prev, ...savedPreferences }));
        setSearchInput(savedPreferences.search ?? DEFAULT_PREFERENCES.search);
        setSelectedInductionId(inductionList[0]?.id ?? "");
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data. Check your API connection.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedInductionId) {
      return;
    }

    async function loadRecords() {
      setLoadingRecords(true);
      try {
        const recordList = await fetchInductionRecords(selectedInductionId, {
          status: preferences.status,
          search: preferences.search,
          sortBy: preferences.sortBy,
          sortOrder: preferences.sortOrder,
        });
        setRecords(recordList);
      } catch (err) {
        console.error(err);
        setError("Unable to load induction records.");
      } finally {
        setLoadingRecords(false);
      }
    }

    loadRecords();
  }, [selectedInductionId, preferences]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPreferences((current) => ({ ...current, search: searchInput }));
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      async function persistPreferences() {
        setSavingPreferences(true);
        try {
          await saveUserPreferences(preferences);
        } catch (err) {
          console.error(err);
        } finally {
          setSavingPreferences(false);
        }
      }

      persistPreferences();
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [preferences]);

  function handleSelection(inductionId: string) {
    setSelectedInductionId(inductionId);
  }

  function updatePreference<Key extends keyof UserPreferences>(
    key: Key,
    value: UserPreferences[Key]
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function handleStatusChange(event: SelectChangeEvent<string>) {
    updatePreference("status", event.target.value as UserPreferences["status"]);
  }

  function handleSortByChange(event: SelectChangeEvent<string>) {
    updatePreference("sortBy", event.target.value as SortBy);
  }

  function handleSortOrderChange(event: SelectChangeEvent<string>) {
    updatePreference("sortOrder", event.target.value as "asc" | "desc");
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Induction Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Monitor pending inductions, view records with company details, and keep your filter and sort preferences saved automatically.
      </Typography>

      {error ? (
        <Paper sx={{ p: 3, backgroundColor: "rgba(255, 235, 238, 0.65)" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : null}

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "360px minmax(0, 1fr)" } }}>
        <Box>
          <Paper sx={{ p: 2, minHeight: 520 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Induction programs
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select an induction to review records and company assignments.
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              {loading ? (
                <Typography variant="body2">Loading inductions…</Typography>
              ) : inductions.length === 0 ? (
                <Typography variant="body2">No inductions available.</Typography>
              ) : (
                inductions.map((induction) => (
                  <ListItemButton
                    key={induction.id}
                    selected={induction.id === selectedInductionId}
                    onClick={() => handleSelection(induction.id)}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={induction.name}
                      secondary={`${induction.pending_count} pending record${induction.pending_count === 1 ? "" : "s"}`}
                    />
                    <Chip
                      label={induction.pending_count}
                      color={induction.pending_count > 0 ? "warning" : "success"}
                      size="small"
                    />
                  </ListItemButton>
                ))
              )}
            </List>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
              <TextField
                label="Search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                fullWidth
                placeholder="Search by name or company"
              />
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={preferences.status}
                  label="Status"
                  onChange={handleStatusChange}
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={preferences.sortBy}
                  label="Sort by"
                  onChange={handleSortByChange}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>Order</InputLabel>
                <Select
                  value={preferences.sortOrder}
                  label="Order"
                  onChange={handleSortOrderChange}
                >
                  <MenuItem value="desc">Newest first</MenuItem>
                  <MenuItem value="asc">Oldest first</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="700">
                  {selectedInduction?.name || "Select an induction"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInduction
                    ? `${selectedInduction.pending_count} pending records for this induction`
                    : "Choose an induction from the left panel to begin."}
                </Typography>
              </Box>
              <Button disabled size="small">
                {savingPreferences ? "Saving preferences…" : "Preferences saved"}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingRecords ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ py: 6, textAlign: "center" }}>
                        Loading records…
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ py: 6, textAlign: "center" }}>
                        {selectedInduction
                          ? "No induction records match the current search or filter."
                          : "Select an induction from the list to view records."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          {record.first_name} {record.last_name}
                        </TableCell>
                        <TableCell>{record.companyName}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusLabel[record.status] ?? record.status}
                            color={statusChipColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatTime(record.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default Dashboard;
