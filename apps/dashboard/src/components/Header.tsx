import { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const GATEWAY_HEALTH_URL = "http://localhost:8551/health";

function StatusDot({ healthy }: { healthy: boolean | null }) {
  const color = healthy === null ? "grey" : healthy ? "limegreen" : "red";

  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: color,
      }}
    />
  );
}

export default function Header() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(GATEWAY_HEALTH_URL);
        const data = await res.json();
        setHealthy(data.status === "ok");
      } catch {
        setHealthy(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StatusDot healthy={healthy} />
          <Typography variant="body2">API Status</Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
