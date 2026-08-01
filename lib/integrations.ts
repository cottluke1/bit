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
export async function sendLocationToSheet(lat: number, lon: number) {
  try {
    const res = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ lat, lon }),
    });
    const data = await res.json();
    console.log("Logged location:", data);
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
    const res = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ filename, mimeType, data, type }),
    });
    const json = await res.json();
    console.log(`Uploaded ${type} to Drive:`, json);
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
