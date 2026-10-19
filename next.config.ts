import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // REQ-30.2: Server Actions default to a 1MB request body limit; the
      // campout-import upload (up to a 15MB PDF/Excel file) needs more
      // room, plus multipart overhead. See ADR 0031.
      bodySizeLimit: "16mb",
    },
  },
  // ADR 0031: pdfjs-dist resolves its own worker script relative to its
  // own on-disk location at runtime -- bundling it into a Turbopack chunk
  // moves it elsewhere and breaks that lookup ("Cannot find module
  // '.../pdf.worker.mjs'"), confirmed by running the import flow. Loading
  // it via native `require`/`import` from node_modules instead, same as
  // this list's existing `sharp` entry, avoids the relocation entirely.
  serverExternalPackages: ["pdfjs-dist", "exceljs"],
};

export default nextConfig;
