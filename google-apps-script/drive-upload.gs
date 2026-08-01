/**
 * Drive uploader — handles both the camera verification video and the
 * uploaded brand document from the site. Files are routed into two
 * subfolders ("Verifications" and "Documents") under a parent folder,
 * based on the "type" field. Filenames are stamped with the date/time
 * the upload happened (see lib/integrations.ts on the site).
 *
 * Handles two request shapes:
 * 1. Normal uploads — JSON body:
 *    POST { filename, mimeType, data: base64, type: "verification" | "document" }
 * 2. Emergency uploads (sent via navigator.sendBeacon when a visitor
 *    closes the tab mid-recording) — metadata travels in the URL query
 *    string since sendBeacon can't set custom headers or a JSON body, and
 *    the POST body is the raw file bytes directly (no base64):
 *    POST /exec?type=verification&filename=... , raw video bytes as body
 *
 * Setup:
 * 1. Go to script.google.com > New project.
 * 2. Delete everything in Code.gs and paste this in.
 * 3. (Optional) Paste an existing Drive folder ID into PARENT_FOLDER_ID
 *    below if you want uploads to land in a specific folder. Leave blank
 *    to auto-create a "Website Uploads" folder in your My Drive root.
 * 4. Deploy > New deployment > select type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Deploy, then copy the /exec URL it gives you.
 * 6. Paste that URL into GOOGLE_DRIVE_UPLOAD_URL in lib/integrations.ts
 *    on the site.
 */

const PARENT_FOLDER_ID = ""; // optional — see step 3 above

function doPost(e) {
  try {
    var filename, mimeType, type, bytes;

    if (e.parameter && e.parameter.type) {
      // Emergency (sendBeacon) path — metadata in the query string, raw
      // bytes as the body.
      type = e.parameter.type;
      filename = e.parameter.filename || "upload-" + Date.now();
      mimeType = (e.postData && e.postData.type) || "application/octet-stream";
      bytes = e.postData.bytes;
    } else {
      // Normal path — JSON body with base64-encoded data.
      var body = JSON.parse(e.postData.contents);
      filename = body.filename;
      mimeType = body.mimeType;
      type = body.type;

      if (!filename || !mimeType || !body.data) {
        return respond({
          status: "error",
          message: "Missing filename, mimeType, or data.",
        });
      }
      bytes = Utilities.base64Decode(body.data);
    }

    var root = getRootFolder();
    var subfolderName = type === "verification" ? "Verifications" : "Documents";
    var folder = getOrCreateFolder(subfolderName, root);

    var blob = Utilities.newBlob(bytes, mimeType, filename);
    var file = folder.createFile(blob);

    return respond({
      status: "success",
      fileId: file.getId(),
      url: file.getUrl(),
      name: file.getName(),
    });
  } catch (err) {
    return respond({ status: "error", message: err.message });
  }
}

function getRootFolder() {
  if (PARENT_FOLDER_ID) {
    return DriveApp.getFolderById(PARENT_FOLDER_ID);
  }
  return getOrCreateFolder("Website Uploads", DriveApp.getRootFolder());
}

function getOrCreateFolder(name, parent) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
