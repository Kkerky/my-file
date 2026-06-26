import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath =
  "C:\\ServiceNow01\\outputs\\mecm_security_mapping\\MECM读取信息到ServiceNow表字段映射_23项安全指摘_字段落表矩阵追加版624_ACC比較列追加版625_O-X判定修正版625_取得元追加版625_中文説明追加版625_MECMカスタマイズ要否追加版626.xlsx";
const outputPath =
  "C:\\ServiceNow01\\outputs\\mecm_security_mapping\\MECM读取信息到ServiceNow表字段映射_23项安全指摘_字段落表矩阵追加版624_ACC比較列追加版625_O-X判定修正版625_取得元追加版625_中文説明追加版625_MECMカスタマイズ要否追加版626_I列X補足説明追加版626.xlsx";

const sheetName = "12_フィールド格納マトリクス_JP";

function targetStorage(category, info, source) {
  const text = `${category} ${info} ${source}`;
  if (text.includes("Windows パッチ") || text.includes("Windows Update")) {
    return "カスタムPatch／Complianceテーブル";
  }
  if (text.includes("OS サポート期限") || text.includes("ライフサイクル")) {
    return "カスタムLifecycle／Complianceテーブル、またはライフサイクル管理用マスタ";
  }
  if (text.includes("ローカルセキュリティ") || text.includes("AutoAdminLogon") || text.includes("スクリーンセーバー")) {
    return "カスタムSecurity Finding／Complianceテーブル";
  }
  if (text.includes("Windows Service")) {
    return "カスタムService Inventory／Complianceテーブル";
  }
  if (text.includes("AV") || text.includes("Endpoint Protection") || text.includes("Antimalware")) {
    return "カスタムAV Health／Security Finding／Complianceテーブル";
  }
  if (text.includes("ディスク暗号化") || text.includes("BitLocker") || text.includes("TPM")) {
    return "カスタムDisk Security／Complianceテーブル";
  }
  if (text.includes("不適切ソフトウェア")) {
    return "カスタムProhibited Software／Complianceテーブル";
  }
  return "カスタム監査／Complianceテーブル";
}

function acquisitionHint(source, attr) {
  const src = String(source || "");
  const at = String(attr || "");
  if (src.includes("MECM の原始インベントリ項目ではない") || src.includes("顧客ルール")) {
    return "MECM標準項目ではなく、外部マスタ／顧客ルールとの照合・算出";
  }
  if (src.includes("算出項目")) {
    return `既存取得値からの算出（${at || "顧客ルール"}）`;
  }
  if (src.includes("カスタムレジストリインベントリ")) {
    return "MECM Compliance Baseline またはカスタムRegistry Inventory";
  }
  if (src.includes("Compliance Baseline")) {
    return `MECM Compliance Baseline または既存Inventory（${src}）`;
  }
  if (src.includes("v_Update") || src.includes("v_UpdateCIs")) {
    return `MECM/WSUS更新View（${src}）`;
  }
  if (src.includes("v_GS_") || src.includes("v_Endpoint")) {
    return `MECM Hardware Inventory／Endpoint Protection View（${src}）`;
  }
  return src || at || "要確認";
}

function buildSupplement(row, inherited) {
  const standard = String(row[8] || "").trim().toUpperCase();
  if (standard !== "X") return "";

  const category = inherited.category || "";
  const info = String(row[3] || "");
  const attr = String(row[4] || "");
  const source = String(row[5] || "");
  const reason = String(row[9] || "ServiceNow標準SG-SCCMターゲット項目として確認できない。");
  const storage = targetStorage(category, info, source);
  const acquisition = acquisitionHint(source, attr);

  return [
    "× 標準SG-SCCMでは直接格納不可",
    `理由：${reason}`,
    `参考（今回の判定範囲外）：取得：${acquisition}`,
    `格納：${storage}`,
    "必要対応：IntegrationHub ETL／RTE、Transform Map、カスタムテーブル、または既存監査・Compliance機能で設計。",
  ].join("\n");
}

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem(sheetName);
const rowCount = 191;
const values = sheet.getRange(`A1:P${rowCount}`).values;

const qValues = Array.from({ length: rowCount }, () => [""]);
qValues[0][0] = "";
qValues[1][0] = "判定口径：I列がXの行について、標準SG-SCCMで直接CMDB格納できない理由と、参考対応を補足。";
qValues[2][0] = "I列X補足説明\n（標準SG-SCCM格納不可理由／参考対応）";

let category = "";
let finding = "";
let xCount = 0;
const byCategory = {};
for (let i = 3; i < values.length; i++) {
  const row = values[i];
  if (row[1]) category = String(row[1]);
  if (row[2]) finding = String(row[2]);
  const supplement = buildSupplement(row, { category, finding });
  qValues[i][0] = supplement;
  if (supplement) {
    xCount++;
    byCategory[category] = (byCategory[category] || 0) + 1;
  }
}

qValues[0][0] =
  `I列X対象 ${xCount} 行：` +
  Object.entries(byCategory)
    .map(([key, value]) => `${key} ${value} 行`)
    .join("、");

// Preserve existing visual style by copying P column format, then apply Q-specific values.
sheet.getRange(`Q1:Q${rowCount}`).copyFrom(sheet.getRange(`P1:P${rowCount}`), "formats");
sheet.getRange(`Q1:Q${rowCount}`).values = qValues;

sheet.getRange("Q1").format = {
  font: { bold: true, color: "#1F4E5F" },
  wrapText: true,
};
sheet.getRange("Q2").format = {
  font: { color: "#666666" },
  wrapText: true,
};
sheet.getRange("Q3").format = {
  fill: "#1F4E5F",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange(`Q4:Q${rowCount}`).format = {
  fill: "#FCE4D6",
  wrapText: true,
  verticalAlignment: "top",
};
sheet.getRange("Q1:Q191").format.columnWidth = 48;
sheet.getRange("Q2").format.rowHeight = 42;
sheet.getRange("Q3").format.rowHeight = 48;

await fs.mkdir("C:\\ServiceNow01\\outputs\\mecm_security_mapping", { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(outputPath);
console.log(JSON.stringify({ xCount, byCategory }, null, 2));
