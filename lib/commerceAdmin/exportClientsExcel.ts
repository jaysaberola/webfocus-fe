import {
  clientBillingInCharge,
  clientClassification,
  clientDisplayName,
  clientOwnerName,
  clientPlanName,
  clientProductCategory,
  clientServiceName,
  clientSubject,
  clientDomain,
  formatClientCreatedTime,
} from "@/lib/commerceAdmin/clientHelpers";
import { fetchCommerceServices } from "@/services/commerceAdminService";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import {
  getSalesTransactions,
  type SalesTransaction,
} from "@/services/salesTransactionService";

type ClientDetail = {
  id?: number;
  fname?: string | null;
  lname?: string | null;
  company?: string | null;
  email?: string | null;
  mobile?: string | null;
  phone?: string | null;
  address_street?: string | null;
  avatar?: string | null;
  type?: string | null;
  role?: string | null;
  created_at?: string | null;
  date_registered?: string | null;
  is_active?: boolean | number | null;
  audits?: Array<{
    id?: number;
    event?: string;
    auditable_type?: string;
    auditable_id?: number | string;
    old_values?: unknown;
    new_values?: unknown;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at?: string | null;
  }>;
};

type ExportBundle = {
  listRow: CustomerRow;
  detail: ClientDetail | null;
  transactions: SalesTransaction[];
  services: Awaited<ReturnType<typeof fetchCommerceServices>>;
};

type CellValue = { value: unknown; type?: "String" | "Number" };

/** SpreadsheetML `ss:Width` is in points, not characters (~7.2pt per character). */
function charsToPoints(chars: number) {
  return Math.min(480, Math.max(60, Math.round(chars * 7.2 + 14)));
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function cell(value: unknown, type: "String" | "Number" = "String", styleId = "Body") {
  if (value == null || value === "") {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String"></Data></Cell>`;
  }
  if (type === "Number" && Number.isFinite(Number(value))) {
    return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${Number(value)}</Data></Cell>`;
  }
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function dataRow(values: CellValue[]) {
  return `<Row ss:AutoFitHeight="1" ss:Height="20">${values
    .map((entry) => cell(entry.value, entry.type ?? "String", "Body"))
    .join("")}</Row>`;
}

function headerRow(headers: string[]) {
  return `<Row ss:Height="28">${headers
    .map((header) => cell(header, "String", "Header"))
    .join("")}</Row>`;
}

function columnWidthPoints(header: string, values: unknown[], preferredChars?: number) {
  if (preferredChars) return charsToPoints(preferredChars);

  const longest = Math.max(
    header.length,
    ...values.map((value) => Math.min(displayValue(value).length, 48)),
    10,
  );
  return charsToPoints(longest + 2);
}

function sheet(
  name: string,
  headers: string[],
  matrix: CellValue[][],
  preferredChars?: number[],
) {
  const columnsXml = headers
    .map((header, index) => {
      const width = columnWidthPoints(
        header,
        matrix.map((dataRow) => dataRow[index]?.value),
        preferredChars?.[index],
      );
      return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
    })
    .join("");

  return `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table ss:ExpandedColumnCount="${headers.length}" ss:ExpandedRowCount="${matrix.length + 1}" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="80" ss:DefaultRowHeight="20">
      ${columnsXml}
      ${headerRow(headers)}
      ${matrix.map((values) => dataRow(values)).join("\n")}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Layout x:Orientation="Landscape"/>
      </PageSetup>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <ProtectObjects>False</ProtectObjects>
      <ProtectScenarios>False</ProtectScenarios>
    </WorksheetOptions>
  </Worksheet>`;
}

function resolveClientName(listRow: CustomerRow, detail: ClientDetail | null) {
  const fromDetail = String(detail?.company ?? "").trim();
  if (fromDetail) return fromDetail;
  return clientDisplayName(listRow);
}

function resolveContactName(listRow: CustomerRow, detail: ClientDetail | null) {
  const fromDetail = [detail?.fname, detail?.lname].filter(Boolean).join(" ").trim();
  if (fromDetail) return fromDetail;
  return String(listRow.representative || "").trim();
}

function formatStaffName(user?: SalesTransaction["user"]) {
  if (!user) return "";
  const name = [user.fname, user.lname].filter(Boolean).join(" ").trim();
  return name || user.email || "";
}

function formatJson(value: unknown) {
  if (value == null || value === "") return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function statusLabel(detail: ClientDetail | null, listRow: CustomerRow) {
  if (listRow.status) return listRow.status;
  if (detail?.is_active == null) return "";
  return detail.is_active ? "Active" : "Inactive";
}

function extractTransactions(payload: unknown): SalesTransaction[] {
  if (!payload || typeof payload !== "object") return [];
  const body = payload as { data?: unknown };
  if (Array.isArray(body.data)) return body.data as SalesTransaction[];
  if (body.data && typeof body.data === "object" && Array.isArray((body.data as { data?: unknown }).data)) {
    return (body.data as { data: SalesTransaction[] }).data;
  }
  return [];
}

async function fetchAllCustomerTransactions(customerId: number): Promise<SalesTransaction[]> {
  const all: SalesTransaction[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await getSalesTransactions(
      { customer_id: customerId, per_page: 200, page },
      { silent: true },
    );
    all.push(...extractTransactions(res));
    lastPage = Number(res?.last_page ?? res?.meta?.last_page ?? 1) || 1;
    page += 1;
  } while (page <= lastPage);

  return all;
}

async function buildExportBundles(rows: CustomerRow[]): Promise<ExportBundle[]> {
  const bundles: ExportBundle[] = [];

  for (const listRow of rows) {
    const [detailResult, transactionsResult, servicesResult] = await Promise.allSettled([
      getCustomer(listRow.id, { silent: true }) as Promise<ClientDetail>,
      fetchAllCustomerTransactions(listRow.id),
      fetchCommerceServices(undefined, listRow.id, { perPage: 500 }),
    ]);

    bundles.push({
      listRow,
      detail: detailResult.status === "fulfilled" ? detailResult.value : null,
      transactions: transactionsResult.status === "fulfilled" ? transactionsResult.value : [],
      services: servicesResult.status === "fulfilled" ? servicesResult.value : [],
    });
  }

  return bundles;
}

function buildWorkbookXml(bundles: ExportBundle[]) {
  const clientMatrix: CellValue[][] = bundles.map(({ listRow, detail, transactions, services }) => [
    { value: listRow.id, type: "Number" },
    { value: resolveClientName(listRow, detail) },
    { value: clientServiceName(listRow) },
    { value: clientPlanName(listRow) },
    { value: clientSubject(listRow) },
    { value: clientProductCategory(listRow) },
    { value: clientDomain(listRow) },
    { value: resolveContactName(listRow, detail) },
    { value: detail?.email ?? listRow.email ?? "" },
    { value: detail?.address_street ?? "" },
    { value: detail?.mobile ?? "" },
    { value: detail?.phone ?? "" },
    { value: statusLabel(detail, listRow) },
    { value: detail?.date_registered ?? listRow.date_registered ?? formatClientCreatedTime(listRow) },
    { value: formatClientCreatedTime(listRow) },
    { value: clientOwnerName(listRow) },
    { value: listRow.owner?.email ?? "" },
    { value: clientBillingInCharge(listRow) },
    { value: clientClassification(listRow) },
    { value: listRow.active_services_count ?? services.length, type: "Number" },
    { value: transactions.length, type: "Number" },
    { value: detail?.role ?? listRow.role ?? "" },
    { value: detail?.type ?? listRow.type ?? "Customer" },
    { value: detail?.avatar ?? "" },
  ]);

  const transactionMatrix: CellValue[][] = [];
  const lineItemMatrix: CellValue[][] = [];

  for (const { listRow, detail, transactions } of bundles) {
    const clientName = resolveClientName(listRow, detail);
    const email = detail?.email ?? listRow.email ?? "";

    for (const tx of transactions) {
      transactionMatrix.push([
        { value: listRow.id, type: "Number" },
        { value: clientName },
        { value: email },
        { value: tx.id, type: "Number" },
        { value: tx.transaction_no },
        { value: tx.subtotal, type: "Number" },
        { value: tx.discount_total, type: "Number" },
        { value: tx.tax_total, type: "Number" },
        { value: tx.shipping_total, type: "Number" },
        { value: tx.grand_total, type: "Number" },
        { value: tx.payment_status },
        { value: tx.order_status },
        { value: tx.transacted_at ?? "" },
        { value: tx.issued_date ?? "" },
        { value: tx.due_date ?? "" },
        { value: tx.notes ?? "" },
        { value: formatStaffName(tx.user) },
        { value: tx.user?.email ?? "" },
        { value: (tx.items ?? []).length, type: "Number" },
      ]);

      for (const item of tx.items ?? []) {
        lineItemMatrix.push([
          { value: listRow.id, type: "Number" },
          { value: clientName },
          { value: tx.transaction_no },
          { value: item.id ?? "", type: item.id != null ? "Number" : "String" },
          { value: item.product_id ?? "" },
          { value: item.name },
          { value: item.item_type ?? "" },
          { value: item.price, type: "Number" },
          { value: item.quantity, type: "Number" },
          { value: item.total_price ?? "", type: item.total_price != null ? "Number" : "String" },
        ]);
      }
    }
  }

  const serviceMatrix: CellValue[][] = bundles.flatMap(({ listRow, detail, services }) => {
    const clientName = resolveClientName(listRow, detail);
    return services.map((service) => [
      { value: listRow.id, type: "Number" },
      { value: clientName },
      { value: detail?.email ?? listRow.email ?? service.email ?? "" },
      { value: service.id, type: "Number" },
      { value: service.serviceName ?? service.category ?? "" },
      { value: service.planName ?? service.plan ?? "" },
      { value: service.subject ?? "" },
      { value: service.productCategory ?? "" },
      { value: service.domain ?? service.subjectDomain ?? "" },
      { value: service.title },
      { value: service.status },
      { value: service.renewLabel ?? "" },
      { value: service.renewAt ?? "" },
      { value: service.transactionNo ?? "" },
    ]);
  });

  const auditMatrix: CellValue[][] = bundles.flatMap(({ listRow, detail }) => {
    const clientName = resolveClientName(listRow, detail);
    return (detail?.audits ?? []).map((audit) => [
      { value: listRow.id, type: "Number" },
      { value: clientName },
      { value: audit.id ?? "", type: audit.id != null ? "Number" : "String" },
      { value: audit.event ?? "" },
      { value: audit.auditable_type ?? "" },
      { value: audit.auditable_id ?? "" },
      { value: formatJson(audit.old_values) },
      { value: formatJson(audit.new_values) },
      { value: audit.ip_address ?? "" },
      { value: audit.user_agent ?? "" },
      { value: audit.created_at ?? "" },
    ]);
  });

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>Clients Full Export</Title>
    <Author>WebFocus Commerce</Author>
  </DocumentProperties>
  <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
    <WindowHeight>12000</WindowHeight>
    <WindowWidth>20000</WindowWidth>
    <ProtectStructure>False</ProtectStructure>
    <ProtectWindows>False</ProtectWindows>
  </ExcelWorkbook>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#111827"/>
      <Interior/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
      </Borders>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#0F274F" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Body">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="0"/>
      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#111827"/>
    </Style>
  </Styles>
  ${sheet(
    "Clients",
    [
      "Client ID",
      "Client Name",
      "Service Name",
      "Plan Name",
      "Subject",
      "Product Category",
      "Domain",
      "Contact Person",
      "Email",
      "Address",
      "Mobile",
      "Phone",
      "Status",
      "Date Registered",
      "Created Time",
      "Client Owner",
      "Owner Email",
      "Billing-In-Charge",
      "Classification",
      "Active Services Count",
      "Transactions Count",
      "Role",
      "Type",
      "Avatar Path",
    ],
    clientMatrix,
    [10, 22, 18, 18, 20, 24, 22, 18, 28, 32, 16, 14, 10, 16, 18, 16, 24, 28, 14, 18, 16, 12, 12, 34],
  )}
  ${sheet(
    "Transactions",
    [
      "Client ID",
      "Client Name",
      "Email",
      "Transaction ID",
      "Transaction No",
      "Subtotal",
      "Discount",
      "Tax",
      "Shipping",
      "Grand Total",
      "Payment Status",
      "Order Status",
      "Transacted At",
      "Issued Date",
      "Due Date",
      "Notes",
      "Assigned Staff",
      "Staff Email",
      "Line Items Count",
    ],
    transactionMatrix,
    [10, 22, 28, 14, 18, 12, 12, 10, 12, 12, 14, 12, 20, 14, 14, 28, 18, 24, 14],
  )}
  ${sheet(
    "Line Items",
    [
      "Client ID",
      "Client Name",
      "Transaction No",
      "Item ID",
      "Product ID",
      "Item Name",
      "Item Type",
      "Price",
      "Quantity",
      "Total Price",
    ],
    lineItemMatrix,
    [10, 22, 18, 10, 12, 30, 12, 12, 10, 12],
  )}
  ${sheet(
    "Services",
    [
      "Client ID",
      "Client Name",
      "Email",
      "Service ID",
      "Service Name",
      "Plan Name",
      "Subject",
      "Product Category",
      "Domain",
      "Title",
      "Status",
      "Renew Label",
      "Renew At",
      "Transaction No",
    ],
    serviceMatrix,
    [10, 22, 28, 10, 18, 18, 20, 24, 22, 24, 10, 12, 16, 18],
  )}
  ${sheet(
    "Audits",
    [
      "Client ID",
      "Client Name",
      "Audit ID",
      "Event",
      "Auditable Type",
      "Auditable ID",
      "Old Values",
      "New Values",
      "IP Address",
      "User Agent",
      "Created At",
    ],
    auditMatrix,
    [10, 22, 10, 12, 16, 12, 40, 40, 14, 36, 20],
  )}
</Workbook>`;
}

function downloadWorkbook(xml: string, filename: string) {
  const blob = new Blob(["\uFEFF" + xml], {
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

/**
 * Exports selected clients with full profile, all transactions/line items,
 * provisioned services, and audit history as a multi-sheet Excel workbook.
 */
export async function exportClientsToExcel(rows: CustomerRow[], filename = "clients-full") {
  if (rows.length === 0) return;
  const bundles = await buildExportBundles(rows);
  downloadWorkbook(buildWorkbookXml(bundles), filename);
}
