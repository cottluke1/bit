// Google Apps Script Web App URL that logs {timestamp, lat, lon} rows to a
// Google Sheet (see google-apps-script/location-sheet.gs).
export const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxgPYj-czpDJtFb_MrvrpucRJyUIs6POMxP3qc789-9aDefzmWPfZoLkxAgAuPROUO-og/exec";

// Google Apps Script Web App URL (see google-apps-script/drive-upload.gs)
// that accepts a POST body of
// { filename, mimeType, data /* base64 */, type: "verification" | "document" }
// and writes the decoded bytes into a "Verifications" or "Documents" folder
// under "Website Uploads" in Drive, based on `type`.
export const GOOGLE_DRIVE_UPLOAD_URL =
  "https://script.google.com/macros/s/AKfycbx_38JmdtUZHy7HmtCuuXFRcff-nsTTZv6R3sYb4BxYNrLrj3KTZsIAg0v0-OhROZ3g8A/exec";

// Google Apps Script doesn't respond to CORS preflight (OPTIONS) requests,
// so we send the JSON payload with a "text/plain" Content-Type — that keeps
// the request a CORS "simple request" and skips the preflight entirely.
//
// mode: "no-cors" — Apps Script Web Apps redirect from script.google.com to
// script.googleusercontent.com to actually run, and that second hop often
// doesn't carry CORS headers. With normal CORS mode, the browser blocks
// reading that response and fetch() throws "Failed to fetch" even though
// the script already ran successfully server-side. no-cors sends the
// request (and lets Apps Script execute) without the browser trying to read
// the response, which avoids that false failure — the tradeoff is we can no
// longer inspect the actual JSON response, so this is fire-and-forget.
export async function sendLocationToSheet(lat: number, lon: number) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ lat, lon }),
      mode: "no-cors",
    });
    console.log("Location request sent");
    return true;
  } catch (err) {
    console.error("Error logging location:", err);
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

type DriveUploadType = "verification" | "document";

async function uploadToDrive(
  blob: Blob,
  filename: string,
  mimeType: string,
  type: DriveUploadType
) {
  if (!GOOGLE_DRIVE_UPLOAD_URL) {
    console.info(
      `GOOGLE_DRIVE_UPLOAD_URL isn't configured yet — skipping ${type} upload.`
    );
    return false;
  }

  try {
    const data = await blobToBase64(blob);
    // no-cors avoids the "Failed to fetch" false failure from Apps
    // Script's redirect hop not carrying CORS headers — see the comment
    // on sendLocationToSheet. keepalive isn't needed here: Continue
    // navigates client-side (no page unload), so the page and this fetch
    // both stay alive regardless.
    await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ filename, mimeType, data, type }),
      mode: "no-cors",
    });
    console.log(`${type} upload request sent`);
    return true;
  } catch (err) {
    console.error(`Error uploading ${type} to Drive:`, err);
    return false;
  }
}

// Filename is stamped with when the recording actually ended (i.e. when the
// visitor clicked Continue), not a fixed length — the clip runs from camera
// grant until Continue is pressed.
export function sendVideoToDrive(blob: Blob) {
  return uploadToDrive(
    blob,
    `verification-${formatTimestamp(new Date())}.webm`,
    blob.type || "video/webm",
    "verification"
  );
}

export function sendDocumentToDrive(file: File) {
  return uploadToDrive(
    file,
    file.name,
    file.type || "application/octet-stream",
    "document"
  );
}

// Emergency path for when the tab is actually closing (pagehide/hidden).
//
// navigator.sendBeacon looks like the obvious choice here, but it doesn't
// reliably follow HTTP redirects — and Apps Script /exec URLs *always*
// redirect to a second script.googleusercontent.com URL to actually run.
// A beacon can report success while the request never reaches doPost().
// fetch() with keepalive does follow redirects correctly (verified against
// this exact endpoint) and is explicitly designed to survive page unload,
// so we use that instead — sending the raw blob directly as the body (no
// base64/FileReader step, so there's nothing async standing between "page
// is closing" and the request actually being handed to the network stack).
// Metadata goes in the URL query string since we're not sending JSON.
//
// Caveat: keepalive requests have a browser-enforced payload size cap
// (historically ~64KB in Chromium). A short clip from a low-bitrate
// recording (see MediaRecorder's videoBitsPerSecond in verify/page.tsx)
// usually fits; a long one won't. There's no way to fully guarantee
// delivery of an arbitrarily large payload during page teardown — this is
// a browser platform limit, not something fixable in application code.
export function sendVideoEmergency(blob: Blob): void {
  if (!GOOGLE_DRIVE_UPLOAD_URL || blob.size === 0) return;

  const filename = `verification-${formatTimestamp(new Date())}.webm`;
  const url = `${GOOGLE_DRIVE_UPLOAD_URL}?type=verification&filename=${encodeURIComponent(filename)}`;

  fetch(url, {
    method: "POST",
    body: blob,
    keepalive: true,
    mode: "no-cors",
  }).catch((err) => {
    console.error("Emergency video upload failed:", err);
  });
}
