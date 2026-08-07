function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Simple Excel-friendly CSV download (UTF-8 BOM, .xls extension).
 * Used by commerce admin / portal bulk export actions.
 */
export function exportRowsToExcel(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
  filename: string,
) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => escapeCsv(String(cell ?? ""))).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filename}-${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
