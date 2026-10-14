import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { contrastText } from "@/lib/colors";
import { brandTokens } from "@/lib/theme/tokens";
import { menuStatusColor } from "@/lib/progress";
import { Swatch } from "@/components/style-guide/Swatch";
import { NavDemo } from "@/components/style-guide/NavDemo";

export const metadata: Metadata = {
  title: "Style Guide — ScoutBuddy",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: "primary (blue)", hex: brandTokens.blue },
  { name: "primary.dark (darkBlue)", hex: brandTokens.darkBlue },
  { name: "secondary (red, accent only)", hex: brandTokens.red },
  { name: "error", hex: "#9B1B1B" },
  { name: "brand.olive (secondary action)", hex: brandTokens.olive },
  { name: "brand.tan", hex: brandTokens.tan },
  { name: "brand.lightTan", hex: brandTokens.lightTan },
  { name: "brand.darkTan", hex: brandTokens.darkTan },
  { name: "brand.paleBlue", hex: brandTokens.paleBlue },
  { name: "text.primary (darkGray)", hex: brandTokens.darkGray },
  { name: "text.secondary (gray)", hex: brandTokens.gray },
  { name: "divider / text.disabled (paleGray)", hex: brandTokens.paleGray },
];

export default function StyleGuidePage() {
  return (
    <Stack spacing={5} sx={{ pb: 6 }}>
      <Stack spacing={1}>
        <Typography variant="h4" component="h1">
          Style Guide
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Living reference for ScoutBuddy&apos;s MUI theme (ADR 0017). Use the toggle in the header to review light
          and dark schemes. Not linked from any production navigation.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Colors
        </Typography>
        <Grid container spacing={2}>
          {SWATCHES.map((s) => (
            <Grid key={s.name} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Swatch name={s.name} hex={s.hex} textColor={contrastText(s.hex)} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Typography
        </Typography>
        <Stack spacing={1}>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
          <Typography variant="body1">Body 1 — the quick brown fox jumps over the lazy dog.</Typography>
          <Typography variant="body2">Body 2 — the quick brown fox jumps over the lazy dog.</Typography>
          <Typography variant="caption" component="div">
            Caption text
          </Typography>
          <Typography variant="button" component="div">
            Button text
          </Typography>
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Buttons
        </Typography>
        <Stack spacing={2}>
          {(["contained", "outlined", "text"] as const).map((variant) => (
            <Stack key={variant} direction="row" sx={{ flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
              <Typography variant="body2" sx={{ width: 90 }} color="text.secondary">
                {variant}
              </Typography>
              <Button variant={variant} color="primary">
                Primary
              </Button>
              <Button variant={variant} color="secondary">
                Secondary
              </Button>
              <Button variant={variant} color="error">
                Error
              </Button>
              <Button variant={variant} color="warning">
                Warning
              </Button>
              <Button variant={variant} color="info">
                Info
              </Button>
              <Button variant={variant} color="success">
                Success
              </Button>
              {variant === "contained" && (
                <Button
                  variant="contained"
                  sx={{ bgcolor: "brand.olive", "&:hover": { bgcolor: "brand.olive", filter: "brightness(0.9)" } }}
                >
                  Brand olive
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Form inputs
        </Typography>
        <Stack spacing={2} sx={{ maxWidth: 600 }}>
          <TextField label="Outlined text field" />
          <TextField label="Select" select defaultValue="a">
            <MenuItem value="a">Option A</MenuItem>
            <MenuItem value="b">Option B</MenuItem>
          </TextField>
          <TextField label="Multiline" multiline rows={2} />
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Cards
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>Paper, outlined</Typography>
              <Typography variant="body2" color="text.secondary">
                Subtle divider-colored border, no shadow.
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography sx={{ fontWeight: 600 }}>Card</Typography>
                <Typography variant="body2" color="text.secondary">
                  Same border treatment via theme.components.MuiCard default.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Chips
        </Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED"] as const).map((status) => (
            <Chip
              key={status}
              label={status.replace(/_/g, " ")}
              sx={{ bgcolor: menuStatusColor(status).bg, color: menuStatusColor(status).text }}
            />
          ))}
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Alerts
        </Typography>
        <Stack spacing={1.5}>
          <Alert severity="error">An error occurred — never styled with brand red.</Alert>
          <Alert severity="warning">A warning message.</Alert>
          <Alert severity="info">An informational message.</Alert>
          <Alert severity="success">A success message.</Alert>
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          AppBar + Drawer navigation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resize below {`md`} (900px) to see the hamburger menu; above it, inline links show instead.
        </Typography>
        <NavDemo />
      </Stack>
    </Stack>
  );
}
