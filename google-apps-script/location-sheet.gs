/**
 * Location logger — replacement for the currently deployed script at your
 * GOOGLE_SHEET_URL. It was crashing with:
 *   "Unexpected error while getting the method or property newBlob on
 *    object Utilities. (line 5, file 'Code')"
 * which means line 5 of the deployed code was calling Utilities.newBlob
 * (Drive/file code) instead of just appending a row — that's why nothing
 * was reaching the sheet. Replace the script's contents with this file.
 *
 * Setup:
 * 1. Open your target Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete everything in Code.gs and paste this in.
 * 4. Deploy > Manage deployments > edit (pencil) the existing deployment
 *    > New version > Deploy. (Editing the SAME deployment keeps the
 *    existing /exec URL working — no client change needed.)
 * 5. Make sure "Who has access" is set to "Anyone" — if it's "Only myself"
 *    or restricted to your org, requests from the site will fail.
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([new Date(), body.lat, body.lon]);

    return respond({ status: "success" });
  } catch (err) {
    return respond({ status: "error", message: err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
