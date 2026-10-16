import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { lightPalette, darkPalette } from "./palette";

export interface BrandPalette {
  tan: string;
  lightTan: string;
  darkTan: string;
  paleBlue: string;
  darkBlue: string;
  paleGray: string;
  olive: string;
  oliveDark: string;
}

declare module "@mui/material/styles" {
  interface Palette {
    brand: BrandPalette;
  }
  interface PaletteOptions {
    brand?: BrandPalette;
  }
}

const baseTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme",
  },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-inter), Arial, Helvetica, sans-serif",
    // Minimum 16px body size on mobile prevents iOS Safari from zooming in
    // on focused inputs.
    fontSize: 16,
    h1: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    h2: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    h3: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    h4: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    h5: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    h6: { fontFamily: "var(--font-montserrat), Arial, Helvetica, sans-serif", fontWeight: 700 },
    button: { textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
          "&:focus-visible": {
            outline: "2px solid currentColor",
            outlineOffset: 2,
          },
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
      styleOverrides: {
        root: {
          "&:focus-visible": {
            textDecoration: "underline",
            outline: "2px solid currentColor",
            outlineOffset: 2,
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: "primary",
        elevation: 0,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          "@media (prefers-reduced-motion: no-preference)": {
            scrollBehavior: "smooth",
          },
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme);
