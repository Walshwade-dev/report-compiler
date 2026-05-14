const SPREADSHEET_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

export function isSupportedSpreadsheetFile(file: File) {
  const filename = file.name.toLowerCase();

  return SPREADSHEET_EXTENSIONS.some((extension) =>
    filename.endsWith(extension)
  );
}

export function supportedSpreadsheetFileMessage() {
  return "Upload a CSV, XLSX, or XLS file.";
}
