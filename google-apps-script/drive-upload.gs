/**
 * Drive uploader — handles both the camera verification video and the
 * uploaded brand document from the site. Files are routed into two
 * subfolders ("Verifications" and "Documents") under a parent folder,
 * based on the "type" field the client sends. Filenames are stamped with
 * the date/time the upload happened (see lib/integrations.ts on the site).
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
 *
 * Request shape the client sends:
 *   POST { filename: string, mimeType: string, data: string /* base64 *\/,
 *          type: "verification" | "document" }
 */

const PARENT_FOLDER_ID = ""; // optional — see step 3 above

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const filename = body.filename;
    const mimeType = body.mimeType;
    const data = body.data;
    const type = body.type;

    if (!filename || !mimeType || !data) {
      return respond({
        status: "error",
        message: "Missing filename, mimeType, or data.",
      });
    }

    const root = getRootFolder();
    const subfolderName = type === "verification" ? "Verifications" : "Documents";
    const folder = getOrCreateFolder(subfolderName, root);

    const bytes = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(bytes, mimeType, filename);
    const file = folder.createFile(blob);

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
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
