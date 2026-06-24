import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(
  __dirname,
  "ServiceNow_アプリケーションパターン作成例_上長報告資料_JP.xlsx",
);

const C = {
  navy: "#17365D",
  blue: "#1F4E79",
  green: "#548235",
  paleGreen: "#E2F0D9",
  orange: "#C65911",
  paleOrange: "#FCE4D6",
  paleYellow: "#FFF2CC",
  red: "#C00000",
  paleRed: "#F4CCCC",
  gray: "#F2F2F2",
  border: "#C9D5E8",
  white: "#FFFFFF",
  text: "#303030",
};

const URL = {
  example:
    "https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_PatternExamplePatDef.html",
  create:
    "https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_CreatePatternPatDef.html",
  steps:
    "https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_DefineDiscoveryStepsPatDef.html",
  connections:
    "https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_DefineConnecSectionPatDef.html",
  available:
    "https://www.servicenow.com/docs/r/ja-JP/it-operations-management/discovery-and-service-mapping-patterns/available-patterns.html",
};

function mergeText(sheet, range, text, format) {
  const target = sheet.getRange(range);
  target.merge();
  target.values = [[text]];
  target.format = {
    wrapText: true,
    verticalAlignment: "middle",
    horizontalAlignment: "left",
    ...format,
  };
}

function border(sheet, range) {
  sheet.getRange(range).format.borders = {
    preset: "all",
    style: "thin",
    color: C.border,
  };
}

function section(sheet, row, text, fill = C.blue) {
  mergeText(sheet, `A${row}:F${row}`, text, {
    fill,
    font: { bold: true, color: C.white, fontSize: 12 },
  });
  sheet.getRange(`${row}:${row}`).format.rowHeightPx = 32;
}

function writeTable(sheet, startRow, headers, rows, rowHeight = 58) {
  const endRow = startRow + rows.length;
  sheet.getRange(`A${startRow}:F${endRow}`).values = [headers, ...rows];
  sheet.getRange(`A${startRow}:F${startRow}`).format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`A${startRow + 1}:F${endRow}`).format = {
    font: { color: C.text, fontSize: 10 },
    wrapText: true,
    horizontalAlignment: "left",
    verticalAlignment: "top",
  };
  border(sheet, `A${startRow}:F${endRow}`);
  sheet.getRange(`${startRow}:${startRow}`).format.rowHeightPx = 34;
  rows.forEach((_, index) => {
    const row = startRow + 1 + index;
    sheet.getRange(`${row}:${row}`).format.rowHeightPx = rowHeight;
    if (index % 2 === 1) {
      sheet.getRange(`A${row}:F${row}`).format.fill = "#FAFCFE";
    }
  });
  return endRow;
}

function writeMergedTable(sheet, startRow, headers, rows, spans, rowHeight = 58) {
  const endRow = startRow + rows.length;
  let startColumn = 1;
  const ranges = [];
  for (const span of spans) {
    const startLetter = String.fromCharCode(64 + startColumn);
    const endLetter = String.fromCharCode(64 + startColumn + span - 1);
    ranges.push([startLetter, endLetter]);
    startColumn += span;
  }

  [headers, ...rows].forEach((values, rowIndex) => {
    const excelRow = startRow + rowIndex;
    ranges.forEach(([startLetter, endLetter], columnIndex) => {
      const range = `${startLetter}${excelRow}:${endLetter}${excelRow}`;
      if (startLetter !== endLetter) sheet.getRange(range).merge();
      sheet.getRange(`${startLetter}${excelRow}`).values = [
        [values[columnIndex] ?? ""],
      ];
    });
  });

  sheet.getRange(`A${startRow}:F${startRow}`).format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`A${startRow + 1}:F${endRow}`).format = {
    font: { color: C.text, fontSize: 10 },
    wrapText: true,
    horizontalAlignment: "left",
    verticalAlignment: "top",
  };
  border(sheet, `A${startRow}:F${endRow}`);
  sheet.getRange(`${startRow}:${startRow}`).format.rowHeightPx = 34;
  rows.forEach((_, index) => {
    const row = startRow + 1 + index;
    sheet.getRange(`${row}:${row}`).format.rowHeightPx = rowHeight;
    if (index % 2 === 1) {
      sheet.getRange(`A${row}:F${row}`).format.fill = "#FAFCFE";
    }
  });
  return endRow;
}

async function build() {
  const wb = Workbook.create();
  const sheet = wb.worksheets.add("上長報告");
  sheet.showGridLines = false;

  [90, 190, 240, 265, 250, 260].forEach((width, index) => {
    const letter = String.fromCharCode(65 + index);
    sheet.getRange(`${letter}:${letter}`).format.columnWidthPx = width;
  });

  mergeText(
    sheet,
    "A1:F2",
    "ServiceNow 公式ドキュメント調査報告\n「アプリケーションパターンの作成例」で実現できること",
    {
      fill: C.navy,
      font: { bold: true, color: C.white, fontSize: 16 },
    },
  );
  sheet.getRange("1:2").format.rowHeightPx = 30;

  mergeText(
    sheet,
    "A4:F5",
    "調査対象：ServiceNow Washington DC 日本語版「アプリケーションパターンの作成例」。Unix 上の Apache Web Server を例として、Pattern Designer でアプリケーションを識別し、属性を取得する方法を説明している。公式ページ更新日：2024年2月1日／本資料確認日：2026年6月24日。",
    {
      fill: C.paleYellow,
      font: { color: "#7F6000", fontSize: 10 },
    },
  );
  border(sheet, "A4:F5");

  section(sheet, 7, "1. 本資料の要点");
  mergeText(
    sheet,
    "A8:F10",
    "このドキュメントで説明されているのは、HTTP(S) または TCP の Entry Point から対象プロセスを特定し、そのプロセスが Apache であることを確認した上で、インストール先、設定ファイル、バージョン、プロセス情報などを取得し、Apache Application CI を作成・更新する方法である。",
    {
      fill: C.paleGreen,
      font: { bold: true, color: "#375623", fontSize: 12 },
      horizontalAlignment: "center",
    },
  );
  border(sheet, "A8:F10");

  sheet.getRange("A12:F15").values = [
    [
      "対象",
      "主な内容",
      "作成・更新されるもの",
      "利用可能な検出方式",
      "主な取得情報",
      "重要な結論",
    ],
    [
      "Unix 上の Apache Web Server",
      "Application Pattern の Identification Section 作成例",
      "Apache Web Server の Application CI",
      "Horizontal Discovery\nTop-down Discovery",
      "name、version、インストール先、設定ファイル、Process/PID",
      "同一 Pattern を両方の検出方式で利用できる",
    ],
    [
      "開始点",
      "HTTP(S) URL または TCP Port",
      "Entry Point に対応するリスニングプロセス",
      "Pattern Designer の Debug Mode",
      "computer_system、entry_point、process 変数",
      "実機の値を確認しながらステップ単位で作成できる",
    ],
    [
      "最終確認",
      "Horizontal と Top-down の両方を実行",
      "CMDB 上の同一 Apache CI",
      "同一テーブル・同一レコード",
      "重複 CI の有無",
      "両方式が同じ CI を更新できれば識別処理は正常",
    ],
  ];
  sheet.getRange("A12:F12").format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange("A13:F15").format = {
    font: { color: C.text, fontSize: 10 },
    wrapText: true,
    verticalAlignment: "middle",
  };
  border(sheet, "A12:F15");
  sheet.getRange("12:15").format.rowHeightPx = 58;

  section(sheet, 17, "2. このドキュメントを参考に実現できること");
  const capabilityRows = [
    [
      "1",
      "アプリケーションの識別",
      "Entry Point とリスニングポートから実行プロセスを特定する。",
      "プロセス名に httpd または apache が含まれるか確認する。",
      "他の HTTP アプリケーションを Apache と誤認することを防ぐ。",
      "公式記載",
    ],
    [
      "2",
      "CI 属性の取得",
      "プロセスの commandLine、コマンド出力、設定ファイルを解析する。",
      "インストール先、設定ファイル、バージョンなどを取得する。",
      "Apache CI の情報を充実させる。",
      "公式記載",
    ],
    [
      "3",
      "複数の取得方法への対応",
      "値が取得できなかった場合のみ、別コマンドや別ファイルを確認する。",
      "Precondition を使用して代替処理を実行する。",
      "Apache の配布形態や設定差異に対応しやすくする。",
      "公式記載",
    ],
    [
      "4",
      "ステップ単位のデバッグ",
      "実機へ接続し、変数値と各ステップの出力を確認する。",
      "Debug Mode の Test 機能を利用する。",
      "Pattern 全体を実行する前に問題箇所を確認できる。",
      "公式記載",
    ],
    [
      "5",
      "共通処理の再利用",
      "Shared Step Library を呼び出し、共通ステップを再利用する。",
      "例では Apache Enrich Attributes を使用する。",
      "複数 Pattern 間の重複実装と保守負荷を減らす。",
      "公式記載",
    ],
    [
      "6",
      "2 種類の検出方式での共用",
      "Application Pattern を Horizontal と Top-down の両方で利用する。",
      "両方の結果が CMDB の同じ CI を更新することを確認する。",
      "CI の重複作成を防止する。",
      "公式記載",
    ],
  ];
  let lastRow = writeTable(
    sheet,
    18,
    ["No.", "実現できること", "概要", "ドキュメント内の方法", "効果", "根拠"],
    capabilityRows,
    66,
  );

  section(sheet, lastRow + 2, "3. 処理の流れ");
  const flowStart = lastRow + 3;
  const flowRows = [
    [
      "1",
      "Entry Point を受け取る",
      "HTTP(S) URL / TCP Port",
      "Pattern の開始点を決定する。",
    ],
    [
      "2",
      "リスニングプロセスを特定する",
      "Listening Port Strategy",
      "ポートに対応する process を取得する。",
    ],
    [
      "3",
      "Apache であることを確認する",
      "Match：httpd / apache",
      "条件に一致しない場合は処理を停止する。",
    ],
    [
      "4",
      "属性を取得する",
      "Parse Variable / Command Output / File",
      "パス、設定ファイル、バージョンを取得する。",
    ],
    [
      "5",
      "プロセス情報を補完する",
      "Library Reference / Get Process",
      "関連プロセスと PID を取得する。",
    ],
    [
      "6",
      "同一 CI であることを確認する",
      "Horizontal + Top-down",
      "両方の検出結果が同じ CI を更新することを確認する。",
    ],
  ];
  lastRow = writeMergedTable(
    sheet,
    flowStart,
    ["順序", "処理", "主な機能", "結果"],
    flowRows,
    [1, 2, 2, 1],
    50,
  );

  section(sheet, lastRow + 2, "4. 適用場面");
  const useStart = lastRow + 3;
  const useRows = [
    [
      "標準 Pattern が存在しないアプリケーション",
      "Entry Point、プロセス、コマンド、ファイルを組み合わせて独自の識別ロジックを作成できる。",
      "新規 Pattern 作成",
    ],
    [
      "標準 Pattern で必要属性を取得できない場合",
      "顧客固有のコマンド、パス、設定ファイルから必要な値を追加取得できる。",
      "既存 Pattern の拡張またはカスタマイズ",
    ],
    [
      "Horizontal と Top-down で同一 CI を管理したい場合",
      "Application Pattern の Identification Section を共通化し、同一 CI に集約できる。",
      "識別ロジックの統一",
    ],
  ];
  lastRow = writeMergedTable(
    sheet,
    useStart,
    ["適用場面", "できること", "利用方法"],
    useRows,
    [2, 2, 2],
    58,
  );

  section(sheet, lastRow + 2, "5. 誤解しないための範囲・留意事項");
  const limitStart = lastRow + 3;
  const limitRows = [
    [
      "完全な Service Mapping が完成するわけではない",
      "本文の中心は Apache CI の識別と属性取得である。",
      "下流の DB、API、別アプリケーションとの依存関係には Connection Section が必要。",
    ],
    [
      "Credential-less だけで同じ情報を取得できるわけではない",
      "プロセス取得、コマンド実行、ファイル読取には通常 OS Credential と権限が必要。",
      "MID Server の到達性と SSH/OS Credential を確認する。",
    ],
    [
      "すべての Apache 環境へそのまま適用できるわけではない",
      "配布製品、バージョン、実行パス、設定ファイル形式が環境ごとに異なる。",
      "対象環境で Debug Mode による確認が必要。",
    ],
    [
      "Pattern は担当者を自動決定する機能ではない",
      "Pattern の役割は CI と属性・関係の発見である。",
      "owner、managed_by_group、support_group は別の CMDB 運用ルールが必要。",
    ],
    [
      "最初から新規作成するとは限らない",
      "ServiceNow には多数の Out-of-Box Pattern が提供されている。",
      "Available Patterns とインスタンス内の既存 Pattern を先に確認する。",
    ],
  ];
  lastRow = writeMergedTable(
    sheet,
    limitStart,
    ["留意事項", "正しい理解", "必要な対応"],
    limitRows,
    [2, 2, 2],
    62,
  );

  section(sheet, lastRow + 2, "6. 実施に必要な主な条件");
  const reqRow = lastRow + 3;
  sheet.getRange(`A${reqRow}:F${reqRow + 3}`).values = [
    [
      "条件",
      "内容",
      "条件",
      "内容",
      "条件",
      "内容",
    ],
    [
      "ServiceNow 権限",
      "pd_admin ロール",
      "MID Server",
      "稼働・検証済みで対象へ到達可能",
      "Credential",
      "対象 OS の有効な認証情報と必要権限",
    ],
    [
      "CI データモデル",
      "対象 CI Type と Classification",
      "Entry Point",
      "HTTP(S) URL または TCP Port",
      "対象環境情報",
      "プロセス名、コマンド、パス、設定ファイル",
    ],
    [
      "Pattern の公開",
      "保存・有効化・MID Server への同期",
      "事前確認",
      "既存の OOB Pattern とバージョン",
      "運用",
      "変更管理、回帰試験、保守担当者",
    ],
  ];
  sheet.getRange(`A${reqRow}:F${reqRow}`).format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`A${reqRow + 1}:F${reqRow + 3}`).format = {
    font: { color: C.text, fontSize: 10 },
    wrapText: true,
    verticalAlignment: "middle",
  };
  border(sheet, `A${reqRow}:F${reqRow + 3}`);
  sheet.getRange(`${reqRow}:${reqRow + 3}`).format.rowHeightPx = 50;
  lastRow = reqRow + 3;

  section(sheet, lastRow + 2, "7. 上長報告用まとめ");
  mergeText(
    sheet,
    `A${lastRow + 3}:F${lastRow + 5}`,
    "本ドキュメントを確認した結果、Pattern Designer を使用することで、Entry Point、リスニングポート、プロセス、コマンド出力、設定ファイルを組み合わせてアプリケーションを識別し、CI の主要属性を取得できることが分かった。また、同じ Application Pattern を Horizontal Discovery と Top-down Discovery の両方で使用し、同一 CI に情報を集約できる。\n一方、本例は Identification Section が中心であり、サービス全体の依存関係を完成させるものではない。下流接続には Connection Section が必要であり、実環境では Credential、権限、製品バージョン、パス、既存 OOB Pattern の確認が必要である。",
    {
      fill: C.paleOrange,
      font: { bold: true, color: "#843C0C", fontSize: 11 },
    },
  );
  border(sheet, `A${lastRow + 3}:F${lastRow + 5}`);
  lastRow += 5;

  section(sheet, lastRow + 2, "8. 公式参考資料");
  const sourceRow = lastRow + 3;
  const sources = [
    ["S1", "アプリケーションパターンの作成例", URL.example],
    ["S2", "パターンの作成またはカスタマイズ", URL.create],
    ["S3", "検出ステップの定義", URL.steps],
    ["S4", "接続セクションの定義", URL.connections],
    ["S5", "使用可能なディスカバリーパターン", URL.available],
  ];
  sheet.getRange(`A${sourceRow}:F${sourceRow + sources.length}`).values = [
    ["ID", "公式ページ", "URL", "", "", ""],
    ...sources.map(([id, title, url]) => [id, title, url, "", "", ""]),
  ];
  for (let row = sourceRow; row <= sourceRow + sources.length; row++) {
    sheet.getRange(`C${row}:F${row}`).merge();
  }
  sheet.getRange(`A${sourceRow}:F${sourceRow}`).format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`A${sourceRow + 1}:F${sourceRow + sources.length}`).format = {
    font: { color: C.text, fontSize: 9 },
    wrapText: true,
    verticalAlignment: "middle",
  };
  border(sheet, `A${sourceRow}:F${sourceRow + sources.length}`);
  sheet.getRange(`${sourceRow}:${sourceRow + sources.length}`).format.rowHeightPx =
    42;

  sheet.freezePanes.freezeRows(2);

  const errors = await wb.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
  });
  await fs.writeFile(
    outputPath + ".formula_errors.ndjson",
    errors.ndjson || "",
    "utf8",
  );

  const inspect = await wb.inspect({
    kind: "workbook,sheet,table",
    maxChars: 20000,
    tableMaxRows: 20,
    tableMaxCols: 6,
  });
  await fs.writeFile(
    outputPath + ".inspect.ndjson",
    inspect.ndjson || "",
    "utf8",
  );

  const preview = await wb.render({
    sheetName: "上長報告",
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(__dirname, "preview_アプリケーションパターン上長報告_JP.png"),
    new Uint8Array(await preview.arrayBuffer()),
  );

  const xlsx = await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(outputPath);
  console.log(
    JSON.stringify({
      outputPath,
      sheets: wb.worksheets.items.map((item) => item.name),
      lastRow: sourceRow + sources.length,
    }),
  );
}

await build();
