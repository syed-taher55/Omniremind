import * as XLSX from "xlsx";

type Mode = "text" | "phone" | "money" | "time";

function excelSerialToWall(serial: number) {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return "";
  const month = String(parsed.m).padStart(2, "0");
  const day = String(parsed.d).padStart(2, "0");
  const hour = String(parsed.H).padStart(2, "0");
  const minute = String(parsed.M).padStart(2, "0");
  return `${parsed.y}-${month}-${day} ${hour}:${minute}`;
}

function asText(value: unknown, mode: Mode) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    const hour = String(value.getUTCHours()).padStart(2, "0");
    const minute = String(value.getUTCMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (mode === "time" && value > 20_000 && value < 80_000) {
      return excelSerialToWall(value);
    }
    if (mode === "phone") return String(Math.trunc(value));
    return String(value);
  }
  return String(value ?? "").trim();
}

const headerMap: Record<string, string> = {
  name: "name",
  recipient: "name",
  recipient_name: "name",
  phone: "phone",
  mobile: "phone",
  phone_number: "phone",
  send_at: "send_at",
  scheduled_at: "send_at",
  time: "send_at",
  value: "value",
  amount: "value",
  estimated_value: "value",
  param_1: "param_1",
  param1: "param_1",
  param_2: "param_2",
  param2: "param_2",
  param_3: "param_3",
  param3: "param_3",
  external_id: "external_id",
};

export type SheetRow = {
  name: string;
  phone: string;
  sendAt: string;
  value: string;
  params: string[];
  externalId: string;
};

export function parseUpload(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [] as SheetRow[], error: "The file has no sheets." };
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: "", raw: true },
  );
  const rows: SheetRow[] = [];
  for (const raw of rawRows) {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const normal = key.trim().toLowerCase().replace(/\s+/g, "_");
      const field = headerMap[normal];
      if (field) mapped[field] = value;
    }
    const row: SheetRow = {
      name: asText(mapped.name, "text"),
      phone: asText(mapped.phone, "phone"),
      sendAt: asText(mapped.send_at, "time"),
      value: asText(mapped.value, "money"),
      params: [
        asText(mapped.param_1, "text"),
        asText(mapped.param_2, "text"),
        asText(mapped.param_3, "text"),
      ],
      externalId: asText(mapped.external_id, "text"),
    };
    if (!row.name && !row.phone && !row.sendAt) continue;
    rows.push(row);
  }
  return { rows, error: null as string | null };
}
