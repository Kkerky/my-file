import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(
  __dirname,
  "ServiceNow_应用Pattern创建示例_官方文档解读_汇报资料_CN.xlsx",
);

const C = {
  navy: "#17365D",
  blue: "#1F4E79",
  paleBlue: "#EAF2F8",
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

function writeTable(sheet, startRow, headers, rows, widths = null) {
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
    sheet.getRange(`${row}:${row}`).format.rowHeightPx = 58;
    if (index % 2 === 1) sheet.getRange(`A${row}:F${row}`).format.fill = "#FAFCFE";
  });
  if (widths) {
    widths.forEach((width, index) => {
      const letter = String.fromCharCode(65 + index);
      sheet.getRange(`${letter}:${letter}`).format.columnWidthPx = width;
    });
  }
  return endRow;
}

async function build() {
  const wb = Workbook.create();
  const sheet = wb.worksheets.add("Pattern示例汇报");
  sheet.showGridLines = false;
  [90, 190, 240, 260, 250, 255].forEach((width, index) => {
    const letter = String.fromCharCode(65 + index);
    sheet.getRange(`${letter}:${letter}`).format.columnWidthPx = width;
  });

  mergeText(
    sheet,
    "A1:F2",
    "ServiceNow 官方文档解读：应用 Pattern 创建示例",
    {
      fill: C.navy,
      font: { bold: true, color: C.white, fontSize: 17 },
    },
  );
  sheet.getRange("1:2").format.rowHeightPx = 28;

  mergeText(
    sheet,
    "A4:F5",
    "研究对象：Washington DC 日文官方文档《アプリケーションパターンの作成例》。文档以 Unix 上的 Apache Web Server 为例，说明如何使用 Pattern Designer 和 Debug Mode 建立应用识别逻辑。官方页面更新日：2024-02-01；本资料确认日：2026-06-24。",
    {
      fill: C.paleYellow,
      font: { color: "#7F6000", fontSize: 10 },
    },
  );
  border(sheet, "A4:F5");

  section(sheet, 7, "1. 核心结论");
  mergeText(
    sheet,
    "A8:F10",
    "这不是 Apache 安装指南，也不是完整 Service Mapping 教程。\n它主要演示：ServiceNow 如何从 HTTP(S)/TCP Entry Point 找到监听进程，确认该进程是 Apache，并采集安装目录、配置文件、版本和进程信息，最终创建或更新 Apache Application CI。",
    {
      fill: C.paleGreen,
      font: { bold: true, color: "#375623", fontSize: 12 },
      horizontalAlignment: "center",
    },
  );
  border(sheet, "A8:F10");

  sheet.getRange("A12:F15").values = [
    [
      "文档对象",
      "主要完成内容",
      "最终结果",
      "可用于",
      "没有完成",
      "前提",
    ],
    [
      "Unix 上的 Apache Web Server",
      "Application Pattern 的 Identification Section",
      "识别 Apache CI，并采集关键属性",
      "Horizontal Discovery\nTop-down Discovery",
      "完整下游依赖拓扑和负责人确定",
      "pd_admin、MID Server、有效 OS Credential、目标可达",
    ],
    [
      "关键输入",
      "HTTP(S) URL / TCP Port、监听进程、命令输出、配置文件",
      "关键属性",
      "name、version、安装目录、配置文件、Process/PID",
      "重要边界",
      "下游依赖仍需 Connection Section",
    ],
    [
      "汇报判断",
      "该示例证明 Pattern Designer 能建立应用识别与属性采集逻辑",
      "验收重点",
      "Horizontal 与 Top-down 应写入同一 CI，不产生重复记录",
      "实施原则",
      "先确认 OOB Pattern，再考虑扩展或自定义",
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
    horizontalAlignment: "left",
    verticalAlignment: "middle",
  };
  border(sheet, "A12:F15");
  sheet.getRange("12:15").format.rowHeightPx = 54;

  section(sheet, 17, "2. 文档中的执行逻辑");
  const flowRows = [
    [
      "1",
      "接收入口",
      "HTTP(S) URL / TCP Port",
      "Top-down 从 Entry Point 启动识别。",
      "启动 Pattern",
      "",
    ],
    [
      "2",
      "定位进程",
      "Listening Port Strategy",
      "找到监听该端口的 process。",
      "入口关联到实际进程",
      "",
    ],
    [
      "3",
      "确认 Apache",
      "Match httpd / apache",
      "可执行文件名不符合时停止 Pattern。",
      "防止错误识别",
      "",
    ],
    [
      "4",
      "采集属性",
      "Parse Variable / Command / File",
      "从 commandLine、httpd -V/-v、配置文件取得属性。",
      "得到路径、版本、配置文件",
      "",
    ],
    [
      "5",
      "补充运行信息",
      "Library Reference / Get Process",
      "复用共享步骤，并取得 Process 和 PID。",
      "丰富 Apache CI",
      "",
    ],
    [
      "6",
      "双路径验证",
      "Horizontal + Top-down",
      "分别执行两种发现并比较 CI。",
      "应更新同一 sys_id",
      "避免重复 CI",
    ],
  ];
  let lastRow = writeTable(
    sheet,
    18,
    ["顺序", "阶段", "主要操作", "做法", "目的", "验收重点"],
    flowRows,
  );

  section(sheet, lastRow + 2, "3. 能做什么，以及不能扩大解释的部分");
  const capStart = lastRow + 3;
  const capRows = [
    [
      "O",
      "识别应用",
      "根据入口、端口和进程判断目标是 Apache。",
      "X",
      "完整 Service Mapping",
      "Identification Section 不会自动发现所有下游依赖。",
    ],
    [
      "O",
      "采集属性",
      "取得版本、安装目录、配置文件、Process/PID。",
      "X",
      "无凭据发现全部信息",
      "命令、进程和文件读取通常需要有效 OS Credential。",
    ],
    [
      "O",
      "逐步调试",
      "Debug Mode 可以查看变量并逐步测试。",
      "X",
      "自动确定负责人",
      "Pattern 发现 CI/关系，不会自动补齐 owner 或 support_group。",
    ],
    [
      "O",
      "两种发现共用",
      "Application Pattern 可用于 Horizontal 和 Top-down。",
      "X",
      "适用于全部 Apache",
      "发行版、路径、命令和配置格式仍需实际验证。",
    ],
  ];
  lastRow = writeTable(
    sheet,
    capStart,
    ["判断", "可以做到", "说明", "判断", "不能直接认为", "正确理解"],
    capRows,
  );
  sheet.getRange(`A${capStart + 1}:A${lastRow}`).format = {
    fill: C.paleGreen,
    font: { bold: true, color: C.green, fontSize: 12 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`D${capStart + 1}:D${lastRow}`).format = {
    fill: C.paleRed,
    font: { bold: true, color: C.red, fontSize: 12 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };

  section(sheet, lastRow + 2, "4. 对当前 Azure PoC 的建议");
  const pocStart = lastRow + 3;
  const pocRows = [
    [
      "1",
      "准备目标",
      "在 Red Hat/Linux VM 安装并启动 Apache，开放 HTTP(S)。",
      "URL 可访问，httpd/apache2 正常监听。",
      "NSG、Palo Alto、OS Firewall",
      "必须",
    ],
    [
      "2",
      "Horizontal Discovery",
      "使用 IP Range + Linux Credential 扫描目标。",
      "发现 Host、Process 和 Apache CI。",
      "SSH、sudo、MID 路由",
      "必须",
    ],
    [
      "3",
      "Top-down Entry Point",
      "以 Apache URL/Port 作为 Entry Point。",
      "Service Mapping 识别同一个 Apache CI。",
      "入口、监听进程、Pattern 选择",
      "必须",
    ],
    [
      "4",
      "属性与重复检查",
      "确认版本/路径/配置文件，并比较两次发现的 sys_id。",
      "关键属性存在，且没有重复 CI。",
      "IRE、Identification Rule、Pattern Log",
      "必须",
    ],
    [
      "5",
      "简单关系",
      "在受控范围内验证 Apache/Tomcat 与一个后端的关系。",
      "显示基础 Application Service 拓扑。",
      "需要 Connection Section 或支持 Pattern",
      "范围控制",
    ],
  ];
  lastRow = writeTable(
    sheet,
    pocStart,
    ["顺序", "验证项", "操作", "预期结果", "失败时检查", "优先度"],
    pocRows,
  );

  section(sheet, lastRow + 2, "5. 实施前提与汇报建议");
  const riskRow = lastRow + 3;
  sheet.getRange(`A${riskRow}:F${riskRow + 3}`).values = [
    [
      "前提",
      "说明",
      "前提",
      "说明",
      "风险",
      "控制方法",
    ],
    [
      "权限",
      "需要 pd_admin；MID Server 可用。",
      "凭据",
      "需要目标 OS 的有效凭据和命令/文件读取权限。",
      "版本差异",
      "验证实际 Apache 发行版、路径和配置格式。",
    ],
    [
      "数据模型",
      "必须有目标 CI Type / Classification。",
      "入口",
      "HTTP(S) URL 或 TCP Port 可从 MID Server 访问。",
      "重复开发",
      "先查 Available Patterns 和实例中的 OOB Pattern。",
    ],
    [
      "发布管理",
      "Pattern 需保存、激活并同步到 MID Server。",
      "验收",
      "Horizontal 和 Top-down 必须指向同一 CI。",
      "维护",
      "自定义 Pattern 需要升级回归和维护负责人。",
    ],
  ];
  sheet.getRange(`A${riskRow}:F${riskRow}`).format = {
    fill: C.gray,
    font: { bold: true, color: C.navy, fontSize: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.getRange(`A${riskRow + 1}:F${riskRow + 3}`).format = {
    font: { color: C.text, fontSize: 10 },
    wrapText: true,
    verticalAlignment: "middle",
  };
  border(sheet, `A${riskRow}:F${riskRow + 3}`);
  sheet.getRange(`${riskRow}:${riskRow + 3}`).format.rowHeightPx = 52;
  lastRow = riskRow + 3;

  mergeText(
    sheet,
    `A${lastRow + 2}:F${lastRow + 4}`,
    "建议汇报表述：该官方示例可以证明 Pattern Designer 能把 Entry Point、监听进程、命令输出和配置文件组合成应用识别逻辑，并让 Horizontal Discovery 与 Top-down Discovery 共用同一个 Application CI。它不能单独证明整个业务服务拓扑已经完成；下游依赖仍需 Connection Section，客户环境也必须验证凭据、路径、版本和现有 OOB Pattern。",
    {
      fill: C.paleOrange,
      font: { bold: true, color: "#843C0C", fontSize: 11 },
    },
  );
  border(sheet, `A${lastRow + 2}:F${lastRow + 4}`);
  lastRow += 4;

  section(sheet, lastRow + 2, "6. 官方参考资料");
  const sourceRow = lastRow + 3;
  const sources = [
    ["S1", "应用 Pattern 创建示例", URL.example],
    ["S2", "Pattern 的创建或自定义", URL.create],
    ["S3", "Discovery Step 的定义", URL.steps],
    ["S4", "Connection Section 的定义", URL.connections],
    ["S5", "Available Discovery Patterns", URL.available],
  ];
  sheet.getRange(`A${sourceRow}:F${sourceRow + sources.length}`).values = [
    ["ID", "官方页面", "URL", "", "", ""],
    ...sources.map(([id, name, url]) => [id, name, url, "", "", ""]),
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
    tableMaxRows: 15,
    tableMaxCols: 6,
  });
  await fs.writeFile(
    outputPath + ".inspect.ndjson",
    inspect.ndjson || "",
    "utf8",
  );

  const preview = await wb.render({
    sheetName: "Pattern示例汇报",
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(__dirname, "preview_Pattern示例汇报_清爽版.png"),
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
