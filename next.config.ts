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
  // ADR 0031: externalizing pdfjs-dist (above) fixed `next dev`, but
  // Vercel's own deployment file-tracing still missed pdf.worker.mjs --
  // it's only ever reached via a fully dynamic import() inside pdfjs-
  // dist's own compiled code when it sets up its "fake worker" (main-
  // thread parsing), which the automatic tracer doesn't follow, so the
  // file never made it into the deployed function's bundle ("Cannot find
  // module '/var/task/node_modules/pdfjs-dist/legacy/build/
  // pdf.worker.mjs'" in production). `contains: true` matching (Next's
  // own glob-match behavior for this option) means the "campouts/import"
  // key matches both the upload route and its nested review route.
  outputFileTracingIncludes: {
    "campouts/import": ["./node_modules/pdfjs-dist/legacy/build/*.mjs"],
  },
};

export default nextConfig;
