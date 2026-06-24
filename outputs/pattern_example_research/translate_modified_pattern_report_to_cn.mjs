import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(
  __dirname,
  "ServiceNow_アプリケーションパターン作成例_上長報告資料_JP.xlsx",
);
const outputPath = path.join(
  __dirname,
  "ServiceNow_ApplicationPattern创建示例_组长汇报资料_CN_对照版.xlsx",
);

const translations = {
  A1: "ServiceNow 官方文档调查报告\n《Application Pattern 创建示例》能够实现什么",
  A5: "1. 本资料要点",
  A6: "本文档说明了如何从 HTTP(S) 或 TCP Entry Point 定位目标进程，在确认该进程为 Apache 后，获取安装位置、配置文件、版本和进程信息，并创建或更新 Apache Application CI。",

  A10: "对象",
  B10: "主要内容",
  C10: "创建或更新的对象",
  D10: "可使用的发现方式",
  E10: "主要获取信息",
  F10: "重要结论",
  A11: "Unix 上的 Apache Web Server",
  B11: "Application Pattern 的 Identification Section 创建示例",
  C11: "Apache Web Server 的 Application CI",
  D11: "Horizontal Discovery\nTop-down Discovery",
  E11: "name、version、安装位置、配置文件、Process/PID",
  F11: "同一个 Pattern 可以用于两种发现方式",
  A12: "起点",
  B12: "HTTP(S) URL 或 TCP Port",
  C12: "与 Entry Point 对应的监听进程",
  D12: "Pattern Designer 的 Debug Mode",
  E12: "computer_system、entry_point、process 变量",
  F12: "可以一边确认真实设备的数据，一边按步骤创建 Pattern",
  A13: "最终确认",
  B13: "分别执行 Horizontal 和 Top-down",
  C13: "CMDB 中的同一个 Apache CI",
  D13: "同一张表、同一条记录",
  E13: "是否存在重复 CI",
  F13: "两种方式能够更新同一个 CI，说明识别处理正常",
  A14: "对象：识别 Unix 上的 Apache Web Server，并将其注册或更新为 Application CI。",
  A15: "起点：从 HTTP(S) URL 或 TCP Port 定位对应的监听进程。",
  A16: "最终确认：确认 Horizontal 和 Top-down 的结果更新同一个 Apache CI，并且没有产生重复记录。",

  A18: "2. 参考本文档可以实现的功能",
  B19: "可以实现的功能",
  C19: "概要",
  D19: "文档中的实现方法",
  E19: "效果",
  F19: "依据",
  B20: "识别应用",
  C20: "从 Entry Point 和监听端口定位实际运行进程。",
  D20: "确认进程名称中是否包含 httpd 或 apache。",
  E20: "防止将其他 HTTP 应用错误识别为 Apache。",
  F20: "官方文档明确说明",
  B21: "获取 CI 属性",
  C21: "解析进程的 commandLine、命令输出和配置文件。",
  D21: "获取安装位置、配置文件和版本等信息。",
  E21: "补充并完善 Apache CI 的信息。",
  F21: "官方文档明确说明",
  B22: "支持多种信息获取路径",
  C22: "仅在无法取得值时，继续检查其他命令或文件。",
  D22: "使用 Precondition 执行备用处理。",
  E22: "更容易适配不同的 Apache 发行方式和配置差异。",
  F22: "官方文档明确说明",
  B23: "按步骤调试",
  C23: "连接真实设备，确认变量值和每个步骤的输出。",
  D23: "使用 Debug Mode 的 Test 功能。",
  E23: "可以在运行整个 Pattern 前发现问题位置。",
  F23: "官方文档明确说明",
  B24: "复用公共处理",
  C24: "调用 Shared Step Library，复用通用步骤。",
  D24: "示例中使用 Apache Enrich Attributes。",
  E24: "减少多个 Pattern 之间的重复实现和维护负担。",
  F24: "官方文档明确说明",
  B25: "两种发现方式共用",
  C25: "Application Pattern 可以同时用于 Horizontal 和 Top-down。",
  D25: "确认两种发现结果更新 CMDB 中的同一个 CI。",
  E25: "避免重复创建 CI。",
  F25: "官方文档明确说明",

  A27: "3. 处理流程",
  A28: "顺序",
  B28: "处理",
  D28: "主要功能",
  F28: "结果",
  B29: "接收 Entry Point",
  F29: "确定 Pattern 的起点。",
  B30: "定位监听进程",
  F30: "获取与端口对应的 process。",
  B31: "确认目标是 Apache",
  D31: "Match：httpd / apache",
  F31: "不满足条件时停止处理。",
  B32: "获取属性",
  F32: "获取路径、配置文件和版本。",
  B33: "补充进程信息",
  F33: "获取相关进程和 PID。",
  B34: "确认是同一个 CI",
  F34: "确认两种发现结果更新同一个 CI。",

  A36: "4. 适用场景",
  A37: "适用场景",
  C37: "可以实现的内容",
  E37: "使用方式",
  A38: "没有标准 Pattern 的应用",
  C38: "组合 Entry Point、进程、命令和文件，创建自定义识别逻辑。",
  E38: "新建 Pattern",
  A39: "标准 Pattern 无法获取必要属性时",
  C39: "从客户特有的命令、路径和配置文件中追加获取所需数据。",
  E39: "扩展或自定义现有 Pattern",
  A40: "希望通过 Horizontal 和 Top-down 管理同一个 CI 时",
  C40: "共用 Application Pattern 的 Identification Section，将信息集中到同一个 CI。",
  E40: "统一识别逻辑",

  A42: "5. 范围和注意事项",
  A43: "注意事项",
  C43: "正确理解",
  E43: "需要的处理",
  A44: "并不代表已经完成完整的 Service Mapping",
  C44: "本文的重点是识别 Apache CI 并获取属性。",
  E44: "要发现下游数据库、API 或其他应用的依赖关系，还需要 Connection Section。",
  A45: "并不是只靠 Credential-less 就能获取相同信息",
  C45: "获取进程、执行命令和读取文件通常需要 OS Credential 及相应权限。",
  E45: "需要确认 MID Server 的可达性以及 SSH/OS Credential。",
  A46: "不能直接适用于所有 Apache 环境",
  C46: "发行产品、版本、执行路径和配置文件格式可能因环境而异。",
  E46: "需要在目标环境中使用 Debug Mode 进行确认。",
  A47: "Pattern 不会自动确定负责人",
  C47: "Pattern 的作用是发现 CI、属性和关系。",
  E47: "owner、managed_by_group、support_group 需要单独的 CMDB 运营规则。",
  A48: "并非一定要从零开始新建",
  C48: "ServiceNow 已提供大量 Out-of-Box Pattern。",
  E48: "应先确认 Available Patterns 和实例中现有的 Pattern。",

  A50: "6. 实施所需的主要条件",
  A51: "条件",
  B51: "内容",
  C51: "条件",
  D51: "内容",
  E51: "条件",
  F51: "内容",
  A52: "ServiceNow 权限",
  B52: "pd_admin 角色",
  D52: "已经运行并验证，且能够访问目标",
  F52: "目标 OS 的有效认证信息及所需权限",
  A53: "CI 数据模型",
  B53: "目标 CI Type 和 Classification",
  D53: "HTTP(S) URL 或 TCP Port",
  E53: "目标环境信息",
  F53: "进程名、命令、路径和配置文件",
  A54: "发布 Pattern",
  B54: "保存、启用并同步到 MID Server",
  C54: "事前确认",
  D54: "现有 OOB Pattern 及其版本",
  E54: "运营",
  F54: "变更管理、回归测试和维护负责人",

  A56: "7. 组长汇报总结",
  A57: "通过确认本文档，可以看出 Pattern Designer 能够将 Entry Point、监听端口、进程、命令输出和配置文件组合起来识别应用，并获取 CI 的主要属性；同一个 Application Pattern 还可以同时用于 Horizontal Discovery 和 Top-down Discovery，将信息集中到同一个 CI。\n需要注意的是，本示例主要说明 Identification Section，并不负责完成整个服务的依赖关系；下游连接还需要 Connection Section，实际环境中也必须确认 Credential、权限、产品版本、路径和现有 OOB Pattern。",

  A61: "8. 官方参考资料",
  B62: "官方页面",
  B63: "Application Pattern 创建示例",
  B64: "创建或自定义 Pattern",
  B65: "定义 Discovery Step",
  B66: "定义 Connection Section",
  B67: "可用的 Discovery Patterns",
};

async function build() {
  const sourceBytes = await fs.readFile(sourcePath);
  const workbook = await SpreadsheetFile.importXlsx(sourceBytes);
  const sheet = workbook.worksheets.getItem("上長報告");

  for (const [address, value] of Object.entries(translations)) {
    sheet.getRange(address).values = [[value]];
  }
  sheet.name = "组长汇报";

  const formulaErrors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
  });
  await fs.writeFile(
    outputPath + ".formula_errors.ndjson",
    formulaErrors.ndjson || "",
    "utf8",
  );

  const inspect = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 40000,
    tableMaxRows: 80,
    tableMaxCols: 6,
  });
  await fs.writeFile(
    outputPath + ".inspect.ndjson",
    inspect.ndjson || "",
    "utf8",
  );

  const preview = await workbook.render({
    sheetName: "组长汇报",
    range: "A1:F67",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(__dirname, "preview_ApplicationPattern组长汇报_CN_对照版.png"),
    new Uint8Array(await preview.arrayBuffer()),
  );

  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(outputPath);
  console.log(
    JSON.stringify({
      sourcePath,
      outputPath,
      sheets: workbook.worksheets.items.map((item) => item.name),
      translatedCells: Object.keys(translations).length,
    }),
  );
}

await build();
