import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(
  __dirname,
  "ServiceNow_应用Pattern创建示例_官方文档解读_汇报资料_CN.xlsx",
);

const COLORS = {
  navy: "#17365D",
  blue: "#1F4E79",
  lightBlue: "#DDEBF7",
  green: "#548235",
  greenLight: "#E2F0D9",
  orange: "#C65911",
  orangeLight: "#FCE4D6",
  yellow: "#FFF2CC",
  red: "#C00000",
  redLight: "#F4CCCC",
  gray: "#F2F2F2",
  border: "#B4C6E7",
  white: "#FFFFFF",
};

const sourceUrls = {
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

function col(n) {
  let value = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}

function setup(sheet, widths, rowCount = 100) {
  sheet.showGridLines = false;
  widths.forEach((width, index) => {
    sheet.getRange(`${col(index + 1)}:${col(index + 1)}`).format.columnWidthPx =
      width;
  });
  for (let row = 1; row <= rowCount; row++) {
    sheet.getRange(`${row}:${row}`).format.rowHeightPx = 30;
  }
}

function title(sheet, text, range) {
  const target = sheet.getRange(range);
  target.merge();
  target.values = [[text]];
  target.format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, fontSize: 16 },
    horizontalAlignment: "left",
    verticalAlignment: "middle",
    wrapText: true,
  };
  target.format.borders = {
    preset: "outside",
    style: "thin",
    color: COLORS.navy,
  };
  const row = range.match(/\d+/)?.[0] ?? "1";
  sheet.getRange(`${row}:${row}`).format.rowHeightPx = 44;
}

function note(sheet, range, text, fill = COLORS.yellow, fontColor = "#7F6000") {
  const target = sheet.getRange(range);
  target.merge();
  target.values = [[text]];
  target.format = {
    fill,
    font: { color: fontColor, fontSize: 11 },
    horizontalAlignment: "left",
    verticalAlignment: "middle",
    wrapText: true,
  };
  target.format.borders = {
    preset: "outside",
    style: "thin",
    color: "#D6B656",
  };
}

function section(sheet, cell, text) {
  sheet.getRange(cell).values = [[text]];
  sheet.getRange(cell).format = {
    font: { bold: true, color: COLORS.blue, fontSize: 13 },
  };
}

function table(sheet, topLeft, headers, rows, options = {}) {
  const letters = topLeft.match(/[A-Z]+/)[0];
  const startRow = Number(topLeft.match(/\d+/)[0]);
  const startCol = letters
    .split("")
    .reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
  const endCol = startCol + headers.length - 1;
  const endRow = startRow + rows.length;
  const range = `${letters}${startRow}:${col(endCol)}${endRow}`;

  sheet.getRange(range).values = [headers, ...rows];
  sheet.getRange(`${letters}${startRow}:${col(endCol)}${startRow}`).format = {
    fill: options.headerFill ?? COLORS.blue,
    font: { bold: true, color: COLORS.white, fontSize: 11 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
  };
  sheet.getRange(range).format.borders = {
    preset: "all",
    style: "thin",
    color: COLORS.border,
  };
  sheet.getRange(`${letters}${startRow + 1}:${col(endCol)}${endRow}`).format = {
    wrapText: true,
    verticalAlignment: "top",
    horizontalAlignment: "left",
  };
  for (let row = startRow + 1; row <= endRow; row++) {
    if ((row - startRow) % 2 === 0) {
      sheet.getRange(`${letters}${row}:${col(endCol)}${row}`).format.fill =
        "#F7FBFF";
    }
    sheet.getRange(`${row}:${row}`).format.rowHeightPx =
      options.rowHeight ?? 70;
  }
  sheet.getRange(`${startRow}:${startRow}`).format.rowHeightPx =
    options.headerHeight ?? 48;
  return endRow;
}

function addExecutiveSummary(wb) {
  const sheet = wb.worksheets.add("01_一页汇报摘要");
  setup(sheet, [190, 360, 340, 420, 390], 55);
  title(
    sheet,
    "ServiceNow 官方文档解读：应用 Pattern 创建示例",
    "A1:E1",
  );
  note(
    sheet,
    "A3:E5",
    "研究对象：ServiceNow Washington DC 日文官方文档《アプリケーションパターンの作成例》。该文档以 Unix 上的 Apache Web Server 为例，演示如何使用 Pattern Designer 和 Debug Mode 创建 Application Pattern 的 Identification Section。官方页面更新日：2024-02-01；本资料确认日：2026-06-24。",
  );

  section(sheet, "A7", "一句话结论");
  note(
    sheet,
    "A8:E10",
    "这是一份“如何让 ServiceNow 正确识别 Apache 应用 CI，并采集其安装目录、配置文件、版本和进程信息”的实战教程；创建出的 Application Pattern 可同时用于 Horizontal Discovery 和 Service Mapping 的 Top-down Discovery。",
    COLORS.greenLight,
    "#375623",
  );

  const summaryRows = [
    [
      "文档在讲什么",
      "从 HTTP(S)/TCP Entry Point 找到监听进程，判断该进程是否为 Apache，再通过命令、文件和进程信息补充 Apache CI 属性。",
      "官方明确",
    ],
    [
      "最终得到什么",
      "Apache Web Server CI，以及 name、安装目录、配置文件路径、版本、相关进程和 PID 等信息。",
      "官方明确",
    ],
    [
      "为什么重要",
      "同一 Application Pattern 可以服务于水平发现和 Top-down 服务发现；正确的识别逻辑可以避免同一 Apache 被重复创建为多个 CI。",
      "官方明确",
    ],
    [
      "它没有完成什么",
      "示例重点是 Identification Section，并不等于已完成应用依赖拓扑。若要识别 Apache 的下游数据库、应用或外部服务，需要继续设计 Connection Section。",
      "官方明确 + 支持推论",
    ],
    [
      "适合什么场景",
      "开箱即用 Pattern 不支持某个应用、现有 Pattern 缺少关键属性，或需要适配客户特有命令、路径、配置文件时。",
      "官方支持推论",
    ],
    [
      "不建议怎么做",
      "不要看到 Apache 示例就直接从零重写 Pattern。应先确认官方 Available Patterns 和当前实例中的 OOB Pattern 能否满足要求。",
      "实施建议",
    ],
  ];
  section(sheet, "A12", "汇报要点");
  table(
    sheet,
    "A13",
    ["项目", "说明", "证据级别"],
    summaryRows,
    { headerFill: COLORS.green, rowHeight: 76 },
  );

  section(sheet, "A22", "对当前 Azure Discovery PoC 的意义");
  table(
    sheet,
    "A23",
    ["PoC 项目", "建议验证内容", "预期结果", "注意事项"],
    [
      [
        "Red Hat / Linux 上的 Apache",
        "先用官方 Apache Pattern；配置 HTTP(S) Entry Point，执行 Top-down Discovery。",
        "识别 Apache CI，取得版本、路径、配置文件和进程等信息。",
        "目标机需要可访问，并具备执行命令/读取文件所需的有效凭据和权限。",
      ],
      [
        "Horizontal Discovery",
        "通过 IP Range 对同一 Linux 主机执行 Credentialed Discovery。",
        "发现 Host、Process 和 Apache Application CI。",
        "仅凭 Credential-less Discovery 通常无法完成本文档中的命令和文件读取。",
      ],
      [
        "Top-down Service Mapping",
        "从 Apache 的 HTTP URL/Port 作为 Entry Point 启动。",
        "识别同一个 Apache CI，并作为 Application Service 的组成 CI。",
        "若要继续显示下游依赖，还需 Connection Section 或其他映射机制。",
      ],
      [
        "重复 CI 检查",
        "比较 Horizontal 与 Top-down 两次发现后的 CI sys_id。",
        "两种发现结果应更新同一条 CI，而不是生成重复记录。",
        "这是判断 Identification Section 是否正确的重要验收点。",
      ],
    ],
    { headerFill: COLORS.orange, rowHeight: 92 },
  );

  note(
    sheet,
    "A30:E32",
    "建议汇报表述：本官方示例可以证明 Pattern Designer 能把 Entry Point、进程、命令输出和配置文件组合成应用识别逻辑；但是否能够直接用于客户环境，仍取决于 OS、Apache 发行版、命令路径、权限、现有 OOB Pattern 和客户实际配置。",
    COLORS.orangeLight,
    "#843C0C",
  );
  sheet.freezePanes.freezeRows(1);
}

function addFlow(wb) {
  const sheet = wb.worksheets.add("02_文档流程图");
  setup(sheet, [95, 250, 330, 340, 350], 80);
  title(sheet, "文档示例的处理流程", "A1:E1");
  note(
    sheet,
    "A3:E5",
    "下面不是 Apache 的网络通信拓扑，而是 Pattern 执行时的逻辑顺序。前半部分负责“确认它是谁”，后半部分负责“补充它的属性”。",
  );

  const flowRows = [
    [
      "1",
      "接收 Entry Point",
      "HTTP(S) URL 或 TCP Port",
      "Top-down 示例使用 http://10.196.39.244:6080/ITO。",
      "启动识别流程",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "2",
      "定位监听进程",
      "Listening Port Strategy",
      "Debug Mode 自动填充 computer_system、entry_point、process。",
      "找到该端口对应的进程",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "3",
      "确认是否为 Apache",
      "Match：$process.executable",
      "可执行文件名称包含 httpd 或 apache；任一条件满足即可。",
      "不是 Apache 时停止执行",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "4",
      "设置基本属性",
      "Set Parameter Value",
      "将 CI 的显示名称设置为 Apache。",
      "生成基础 CI 属性",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "5",
      "解析启动命令",
      "Parse Variable",
      "从进程 commandLine 中读取安装目录或配置文件参数。",
      "优先使用现有命令行信息",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "6",
      "执行备用命令",
      "Parse Command Output",
      "信息不足时执行 httpd -V / -v，并解析 HTTPD_ROOT、SERVER_CONFIG_FILE 和版本。",
      "形成多路径、带前提条件的采集逻辑",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "7",
      "解析配置/版本文件",
      "Parse File",
      "必要时读取 version.signature 或 IHS.product，处理 IBM HTTP Server 等情况。",
      "补充不同发行版的版本信息",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "8",
      "复用共享步骤",
      "Library Reference",
      "调用 Apache Enrich Attributes，共享一组预先配置的子步骤。",
      "减少重复设计",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "9",
      "取得进程和 PID",
      "Get Process + Parse Variable",
      "取得 httpd 相关进程并整理 process_ids。",
      "补充应用运行信息",
    ],
    [
      "↓",
      "",
      "",
      "",
      "",
    ],
    [
      "10",
      "双路径验证",
      "Horizontal + Top-down",
      "分别执行水平发现和 Top-down 发现，检查 Apache 表中的 CI。",
      "两种方式应写入同一 CI，不产生重复记录",
    ],
  ];
  table(
    sheet,
    "A7",
    ["序号", "阶段", "Pattern 操作/输入", "实际做法", "目的"],
    flowRows,
    { headerFill: COLORS.blue, rowHeight: 64 },
  );

  for (let row = 9; row <= 25; row += 2) {
    sheet.getRange(`A${row}:E${row}`).format = {
      fill: COLORS.gray,
      font: { bold: true, color: COLORS.blue, fontSize: 14 },
      horizontalAlignment: "center",
      verticalAlignment: "middle",
    };
    sheet.getRange(`${row}:${row}`).format.rowHeightPx = 24;
  }
  sheet.freezePanes.freezeRows(7);
}

function addStepDetails(wb) {
  const sheet = wb.worksheets.add("03_关键步骤解读");
  setup(sheet, [70, 200, 250, 320, 350, 350], 80);
  title(sheet, "Pattern Designer 关键步骤与作用", "A1:F1");
  note(
    sheet,
    "A3:F5",
    "文档展示的重点不是某一条固定脚本，而是 Pattern 的设计方法：条件匹配、变量处理、命令输出解析、文件解析、备用路径、共享步骤和逐步调试。",
  );

  const rows = [
    [
      "1",
      "Pattern 基本属性",
      "Application / Apache Web Server / Unix 系 OS",
      "确定 Pattern 的目标 CI 类型、适用 OS 和执行范围。",
      "Application Pattern 可供 Horizontal Discovery 和 Top-down Discovery 共用。",
      "官方明确",
    ],
    [
      "2",
      "Identification Section",
      "HTTP(S)、TCP Entry Point；Listening Port",
      "定义从哪个入口开始，以及怎样找到该入口背后的进程。",
      "回答“这个入口背后运行的是什么应用”。",
      "官方明确",
    ],
    [
      "3",
      "Debug Mode",
      "Top-down + HTTP(S) URL",
      "连接实际目标，将 host、entry point、process 等临时变量带入设计器。",
      "可以逐步执行和测试 Pattern，而不是一次性盲目运行。",
      "官方明确",
    ],
    [
      "4",
      "Match",
      "httpd / apache",
      "检查进程可执行文件名，不符合条件时停止当前 Pattern。",
      "避免把其他监听 HTTP 端口的应用误识别为 Apache。",
      "官方明确",
    ],
    [
      "5",
      "Set Parameter Value",
      "$name、$conf_file 等",
      "设置 CI 属性或临时变量，也可处理默认值和路径拼接。",
      "把采集结果转换为后续步骤可使用的值。",
      "官方明确",
    ],
    [
      "6",
      "Parse Variable",
      "process.commandLine",
      "从已有变量中解析 -d、-f 等启动参数。",
      "尽量不额外执行命令，直接复用现有进程信息。",
      "官方明确",
    ],
    [
      "7",
      "Parse Command Output",
      "httpd -V / -v",
      "执行命令并按行、分隔符或位置解析输出。",
      "取得 HTTPD_ROOT、SERVER_CONFIG_FILE、Server version。",
      "官方明确",
    ],
    [
      "8",
      "Precondition",
      "变量为空时才执行备用步骤",
      "只有前一条采集路径没有得到值时，才执行命令或读取文件。",
      "构成容错和多版本适配逻辑，减少不必要操作。",
      "官方明确",
    ],
    [
      "9",
      "Parse File",
      "version.signature / IHS.product",
      "从文本或 XML 文件提取版本。",
      "兼容 Apache/IBM HTTP Server 的不同版本来源。",
      "官方明确",
    ],
    [
      "10",
      "Library Reference",
      "Apache Enrich Attributes",
      "插入预先配置的一组共享子步骤。",
      "提高复用性和一致性，减少多个 Pattern 重复维护。",
      "官方明确",
    ],
    [
      "11",
      "Get Process",
      "httpd",
      "取得符合条件的进程集合，再提取 PID。",
      "补充应用运行态信息。",
      "官方明确",
    ],
    [
      "12",
      "Activate / Sync",
      "Pattern 激活并同步到 MID Server",
      "保存设计后，还需要使 Pattern 可用并同步到执行端。",
      "没有激活和同步，MID Server 不会按新逻辑执行。",
      "官方明确",
    ],
  ];
  table(
    sheet,
    "A7",
    ["#", "功能", "示例中的输入", "作用", "业务意义", "证据"],
    rows,
    { headerFill: COLORS.green, rowHeight: 82 },
  );
  sheet.freezePanes.freezeRows(7);
}

function addCapabilities(wb) {
  const sheet = wb.worksheets.add("04_能做与不能做");
  setup(sheet, [185, 350, 380, 180], 70);
  title(sheet, "该文档能支持什么，不能直接证明什么", "A1:D1");
  note(
    sheet,
    "A3:D5",
    "这是汇报时最需要控制的边界。Pattern Designer 很强，但文档展示的是一个具体 Application Pattern 的 Identification Section 示例，不能扩大解释为自动完成整个 CMDB 或全部 Service Mapping。",
  );

  section(sheet, "A7", "可以做到");
  table(
    sheet,
    "A8",
    ["能力", "说明", "示例证据", "判断"],
    [
      [
        "识别特定应用",
        "根据 Entry Point、监听端口和进程名称判断目标是否为 Apache。",
        "HTTP(S)/TCP + Listening Port + Match httpd/apache",
        "O",
      ],
      [
        "采集应用属性",
        "通过命令、文件、进程和变量取得 name、安装目录、配置文件、版本、PID 等。",
        "Parse Variable / Command Output / File / Get Process",
        "O",
      ],
      [
        "适配多个采集路径",
        "使用 Precondition，在信息缺失时执行备用命令或读取备用文件。",
        "变量为空时执行 httpd -V、IHS.product 等",
        "O",
      ],
      [
        "逐步调试",
        "Debug Mode 可连接实际目标、查看变量并测试每一步输出。",
        "Top-down Debug + Test",
        "O",
      ],
      [
        "复用通用逻辑",
        "Shared Step Library 可将公共步骤插入多个 Pattern。",
        "Apache Enrich Attributes",
        "O",
      ],
      [
        "Horizontal/Top-down 共用",
        "Application Pattern 可用于 Discovery 的水平发现和 Service Mapping 的 Top-down 发现。",
        "最终验证两种发现写入同一 CI",
        "O",
      ],
    ],
    { headerFill: COLORS.green, rowHeight: 76 },
  );
  sheet.getRange("D9:D14").format = {
    fill: COLORS.greenLight,
    font: { bold: true, color: COLORS.green, fontSize: 12 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };

  section(sheet, "A17", "不能直接认为已经做到");
  table(
    sheet,
    "A18",
    ["误解", "正确理解", "还需要什么", "判断"],
    [
      [
        "已经完成完整 Service Mapping",
        "本文重点是识别 Apache CI 和补充属性。",
        "若要发现下游依赖，需要 Connection Section、Create Connection 等步骤。",
        "X",
      ],
      [
        "不需要凭据",
        "示例执行命令、读取文件和获取进程，通常需要目标 OS 的有效凭据和权限。",
        "MID Server 可达性、SSH/OS Credential、命令与文件读取权限。",
        "X",
      ],
      [
        "自动确定业务负责人",
        "Pattern 负责发现 CI 和关系，不会凭空确定 owner/managed_by/support_group。",
        "CMDB 治理规则、服务负责人数据、组织归属或自定义流程。",
        "X",
      ],
      [
        "适用于所有 Apache 环境",
        "示例声明面向 Unix Apache，且示例描述为版本 2.4 及以前。",
        "客户实际发行版、路径、命令、权限和配置格式验证。",
        "X",
      ],
      [
        "照抄即可用于生产",
        "示例 URL、路径和命令是教学样例。",
        "非生产环境调试、异常处理、性能、安全审查和升级维护设计。",
        "X",
      ],
      [
        "必须从零创建 Apache Pattern",
        "ServiceNow 已提供大量 OOB Patterns，应先检查现有 Pattern。",
        "Available Patterns、实例中 Pattern 版本和扩展能力评估。",
        "X",
      ],
    ],
    { headerFill: COLORS.red, rowHeight: 82 },
  );
  sheet.getRange("D19:D24").format = {
    fill: COLORS.redLight,
    font: { bold: true, color: COLORS.red, fontSize: 12 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
  };
  sheet.freezePanes.freezeRows(8);
}

function addPrerequisites(wb) {
  const sheet = wb.worksheets.add("05_前提条件与风险");
  setup(sheet, [190, 330, 360, 350, 175], 80);
  title(sheet, "实施前提、风险和确认事项", "A1:E1");
  note(
    sheet,
    "A3:E5",
    "官方示例能够说明 Pattern 的设计方式，但真正落地必须结合客户实例、目标应用版本、网络、权限和已有 Pattern。以下项目建议在 PoC 开始前确认。",
  );
  table(
    sheet,
    "A7",
    ["类别", "前提/风险", "为什么重要", "确认方法", "性质"],
    [
      [
        "ServiceNow 权限",
        "用户具有 pd_admin 角色。",
        "没有该角色无法创建和调试 Pattern。",
        "检查用户角色和 Pattern Designer 菜单。",
        "官方前提",
      ],
      [
        "数据模型",
        "已存在目标 CI Type 和 CI Classification。",
        "Pattern 必须知道识别结果写入哪一种 CI。",
        "Class Manager / CI Type 中确认 Apache Web Server。",
        "官方前提",
      ],
      [
        "MID Server",
        "MID Server 已验证，可访问目标主机和 ServiceNow。",
        "Pattern 的命令、文件和进程采集由 MID Server 执行。",
        "MID Server 状态、Capability、路由和防火墙测试。",
        "实施前提",
      ],
      [
        "凭据和权限",
        "目标 Unix/Linux 的 SSH/OS Credential 可用。",
        "读取进程、执行 httpd 命令和读取配置文件需要权限。",
        "Credential Test、Quick Discovery、命令/文件权限测试。",
        "实施前提",
      ],
      [
        "Entry Point",
        "Top-down 测试有可访问的 HTTP(S) URL 或 TCP Port。",
        "Identification Section 从 Entry Point 开始查找监听进程。",
        "浏览器/curl 连通性、端口监听、Load Balancer/NAT 确认。",
        "官方前提",
      ],
      [
        "应用差异",
        "Apache/httpd 路径、命令选项和配置文件位置可能不同。",
        "照抄示例可能拿不到值或误判。",
        "在目标机确认 process、commandLine、httpd -V/-v、配置路径。",
        "实例依赖",
      ],
      [
        "OOB Pattern",
        "当前实例可能已有 Apache Pattern。",
        "从零复制可能增加重复逻辑和升级维护负担。",
        "检查 Available Patterns、Pattern 列表和版本。",
        "实施建议",
      ],
      [
        "CI 重复",
        "Horizontal 与 Top-down 必须识别为同一 CI。",
        "否则会污染 CMDB，并破坏 Service Mapping 结果。",
        "比较 CI sys_id、IRE 日志、Identification Rule 和源历史。",
        "验收重点",
      ],
      [
        "拓扑范围",
        "Identification Section 只说明当前 Apache 是谁。",
        "无法自动说明它连接了哪些数据库、API 或下游应用。",
        "检查是否需要 Connection Section 和 Create Connection。",
        "范围边界",
      ],
      [
        "变更与升级",
        "自定义 Pattern 需要版本、测试和发布管理。",
        "ServiceNow 升级、应用升级或路径变化后可能失效。",
        "Update Set/应用包、回归测试、Owner 和维护流程。",
        "运维风险",
      ],
    ],
    { headerFill: COLORS.orange, rowHeight: 82 },
  );
  sheet.freezePanes.freezeRows(7);
}

function addPocProposal(wb) {
  const sheet = wb.worksheets.add("06_PoC验证建议");
  setup(sheet, [70, 220, 330, 340, 330, 250], 90);
  title(sheet, "结合当前 Azure PoC 的推荐验证方案", "A1:F1");
  note(
    sheet,
    "A3:F5",
    "建议把此文档作为“Application Pattern / Top-down Entry Point 的原理依据”，而不是要求在 PoC 中完整复刻全部步骤。PoC 目标应控制在：发现 Apache、识别同一 CI、采集关键属性，并展示基础服务关系。",
  );

  table(
    sheet,
    "A7",
    ["顺序", "验证项", "操作", "验收证据", "失败时检查", "建议"],
    [
      [
        "1",
        "准备 Apache 目标",
        "在 Red Hat/Linux VM 安装并启动 Apache，开放 HTTP/HTTPS。",
        "URL 可访问，httpd/apache2 进程监听预定端口。",
        "NSG、Palo Alto、OS Firewall、Service 状态。",
        "必须",
      ],
      [
        "2",
        "Credentialed Horizontal Discovery",
        "通过 IP Range 和 Linux Credential 发现主机。",
        "Linux Host、进程和 Apache CI 被创建/更新。",
        "SSH、sudo、MID 路由、Pattern 日志。",
        "必须",
      ],
      [
        "3",
        "确认 OOB Apache Pattern",
        "检查 Available Patterns 和实例 Pattern 列表。",
        "确认目标版本/发行版是否受支持。",
        "Pattern 版本、CI Type、适用 OS、执行顺序。",
        "必须",
      ],
      [
        "4",
        "Top-down Entry Point",
        "以 Apache HTTP(S) URL/Port 创建 Top-down Entry Point。",
        "Service Mapping 成功识别 Apache Application CI。",
        "Entry Point、监听进程、URL/NAT、Pattern 选择。",
        "必须",
      ],
      [
        "5",
        "属性确认",
        "检查 name、version、安装目录、配置文件、进程等。",
        "至少取得可说明 Pattern 有效的核心属性。",
        "commandLine、httpd -V/-v、文件权限和路径。",
        "必须",
      ],
      [
        "6",
        "同一 CI 验证",
        "比较 Horizontal 与 Top-down 结果的 sys_id。",
        "两种方式指向同一 Apache CI，没有重复记录。",
        "Identification Rule、IRE、CI Type、name/version 组合。",
        "必须",
      ],
      [
        "7",
        "简单依赖关系",
        "让 Apache/Tomcat 连接一个简单后端，确认基础 Application Service 拓扑。",
        "服务图中至少能看到 Entry Point、应用和必要的 Host/连接。",
        "Connection Section、端口、进程通信、支持 Pattern。",
        "范围控制",
      ],
      [
        "8",
        "自定义 Pattern 演示",
        "仅当 OOB Pattern 缺失关键属性时，增加一条小范围扩展/自定义步骤。",
        "能通过 Debug Mode 测试并取得新增属性。",
        "不要在 PoC 中从零重写完整 Apache Pattern。",
        "可选",
      ],
    ],
    { headerFill: COLORS.green, rowHeight: 88 },
  );

  note(
    sheet,
    "A18:F21",
    "建议验收口径：PoC 成功不要求完全复制官方示例中的每个命令和文件分支。只要能够证明 Entry Point → 监听进程 → Apache CI 的识别链路成立，关键属性可采集，Horizontal 与 Top-down 指向同一 CI，并能展示受控范围内的服务关系，即可达到本阶段验证目的。",
    COLORS.greenLight,
    "#375623",
  );
  sheet.freezePanes.freezeRows(7);
}

function addSources(wb) {
  const sheet = wb.worksheets.add("07_官方资料URL");
  setup(sheet, [70, 360, 780, 520, 160], 50);
  title(sheet, "官方依据与证据级别", "A1:E1");
  note(
    sheet,
    "A3:E5",
    "以下全部为 ServiceNow 官方文档。主要研究对象是 Washington DC 日文版本；页面内容可能随产品版本、ITOM Visibility 内容包和 Pattern 版本发生变化，实施时应同时核对客户实例。",
  );
  table(
    sheet,
    "A7",
    ["ID", "官方页面", "URL", "本资料使用目的", "证据级别"],
    [
      [
        "S1",
        "アプリケーションパターンの作成例",
        sourceUrls.example,
        "Apache on Unix 的完整 Application Pattern Identification Section 示例、Debug Mode、属性采集和双路径验证。",
        "官方明确",
      ],
      [
        "S2",
        "パターンの作成またはカスタマイズ",
        sourceUrls.create,
        "Pattern 类型、CI Type、适用 OS、Entry Point、Process Strategy、Horizontal/Top-down 共用和 MID 同步。",
        "官方明确",
      ],
      [
        "S3",
        "検出ステップの定義",
        sourceUrls.steps,
        "Pattern 可使用的操作、变量、前提条件、Debug Test、激活和步骤执行机制。",
        "官方明确",
      ],
      [
        "S4",
        "接続セクションの定義",
        sourceUrls.connections,
        "Connection Section 用于发现 CI 的发信连接和创建 Application Flow/Containment 等关系。",
        "官方明确",
      ],
      [
        "S5",
        "使用可能なディスカバリーパターン",
        sourceUrls.available,
        "实施前确认官方 OOB Pattern，避免不必要地从零自定义。",
        "官方参考",
      ],
    ],
    { headerFill: COLORS.blue, rowHeight: 82 },
  );

  section(sheet, "A15", "证据标签说明");
  table(
    sheet,
    "A16",
    ["标签", "含义"],
    [
      ["官方明确", "官方页面直接陈述该行为或步骤。"],
      [
        "官方支持推论",
        "多个官方事实支持该结论，但官方没有逐字写出相同结论。",
      ],
      [
        "实例依赖",
        "结果取决于版本、插件、Pattern、CI Type、权限、凭据和客户配置。",
      ],
      [
        "需要运行验证",
        "应通过 Pattern Debug、Discovery Status、IRE/CMDB 记录和实际属性进行确认。",
      ],
    ],
    { headerFill: COLORS.orange, rowHeight: 62 },
  );
  sheet.freezePanes.freezeRows(7);
}

async function build() {
  const wb = Workbook.create();
  addExecutiveSummary(wb);
  addFlow(wb);
  addStepDetails(wb);
  addCapabilities(wb);
  addPrerequisites(wb);
  addPocProposal(wb);
  addSources(wb);

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
    maxChars: 24000,
    tableMaxRows: 12,
    tableMaxCols: 8,
  });
  await fs.writeFile(
    outputPath + ".inspect.ndjson",
    inspect.ndjson || "",
    "utf8",
  );

  for (const sheetName of ["01_一页汇报摘要", "02_文档流程图", "04_能做与不能做"]) {
    const preview = await wb.render({
      sheetName,
      autoCrop: "all",
      scale: 1,
      format: "png",
    });
    await fs.writeFile(
      path.join(__dirname, `preview_${sheetName}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }

  const xlsx = await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(outputPath);
  console.log(
    JSON.stringify({
      outputPath,
      sheets: wb.worksheets.items.map((sheet) => sheet.name),
    }),
  );
}

await build();
