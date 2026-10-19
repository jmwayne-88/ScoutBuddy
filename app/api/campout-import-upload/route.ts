import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getActor } from "@/lib/session";
import { canImportCampouts } from "@/lib/permissions";
import { MAX_FILE_BYTES } from "@/lib/campout-import/constants";

// ADR 0032: this app's first-ever Route Handler. The campout-import
// upload form (components/CampoutImportUploadForm.tsx) calls Vercel
// Blob's client `upload()` helper, which POSTs here first to get a
// short-lived, scoped token before it ever sends the file itself --
// nothing about the file's bytes passes through this route or through
// the campout-import Server Action's own request body, which is what
// lets a real multi-MB flyer sidestep Vercel Functions' hard 4.5MB
// request-body limit (REQ-30, see the ADR for the full story).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // REQ-30.22: the same ASPL-only gate every other part of this
        // feature uses -- re-checked here because this route is a public
        // endpoint reachable independently of the upload page's own UI.
        const actor = await getActor();
        if (!canImportCampouts(actor)) {
          throw new Error("Only the ASPL of Camping can import campouts.");
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
          ],
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Not relied on: the client calls the campout-import Server Action
      // directly with the blob URL once upload() resolves, rather than
      // waiting on this webhook -- which Vercel can't deliver to a
      // localhost dev server anyway.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
