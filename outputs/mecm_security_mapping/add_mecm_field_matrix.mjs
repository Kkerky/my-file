import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(
  __dirname,
  "MECM读取信息到ServiceNow表字段映射_23项安全指摘_中文版.xlsx",
);
const outputPath = path.join(
  __dirname,
  "MECM读取信息到ServiceNow表字段映射_23项安全指摘_字段落表矩阵追加版.xlsx",
);

const URL = {
  snSccm:
    "https://www.servicenow.com/docs/r/servicenow-platform/service-graph-connectors/cmdb-integration-sccm.html",
  snClasses:
    "https://www.servicenow.com/docs/r/zurich/servicenow-platform/service-graph-connectors/cmdb-sccm-classes.html",
  msHardware:
    "https://learn.microsoft.com/en-us/intune/configmgr/develop/core/understand/sqlviews/hardware-inventory-views-configuration-manager",
  msUpdates:
    "https://learn.microsoft.com/en-us/intune/configmgr/develop/core/understand/sqlviews/software-updates-views-configuration-manager",
  msEndpoint:
    "https://learn.microsoft.com/en-us/intune/configmgr/develop/core/understand/sqlviews/endpoint-protection-views-configuration-manager",
};

const COLORS = {
  navy: "#17365D",
  blue: "#1F4E79",
  lightBlue: "#DDEBF7",
  green: "#548235",
  greenLight: "#E2F0D9",
  red: "#C00000",
  redLight: "#FCE4D6",
  yellow: "#FFF2CC",
  gray: "#F2F2F2",
  border: "#B4C6E7",
  white: "#FFFFFF",
};

const rows = [];

function add(
  no,
  category,
  issue,
  info,
  mecmField,
  mecmSource,
  snTable,
  snField,
  direct,
  reason,
  evidence,
  refs,
) {
  rows.push([
    no,
    category,
    issue,
    info,
    mecmField,
    mecmSource,
    snTable,
    snField,
    direct,
    reason,
    evidence,
    refs.map((key) => URL[key]).join("\n"),
  ]);
}

function addOsBase(no, category, issue) {
  add(
    no,
    category,
    issue,
    "OS 名称",
    "Caption0 / Name0（候选）",
    "v_GS_OPERATING_SYSTEM",
    "cmdb_ci_computer",
    "os",
    "O",
    "ServiceNow 官方目标类页面明确列出 cmdb_ci_computer.os。",
    "官方明确",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    "OS 版本",
    "Version0（候选）",
    "v_GS_OPERATING_SYSTEM",
    "cmdb_ci_computer",
    "os_version",
    "O",
    "ServiceNow 官方目标类页面明确列出 cmdb_ci_computer.os_version。",
    "官方明确",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    "OS Service Pack",
    "CSDVersion0 / ServicePackMajorVersion0（候选）",
    "v_GS_OPERATING_SYSTEM",
    "cmdb_ci_computer",
    "os_service_pack",
    "O",
    "标准目标字段存在；实际 MECM 列名和转换需在 IntegrationHub ETL Data Map 中复核。",
    "官方支持，映射需确认",
    ["snClasses", "snSccm", "msHardware"],
  );
}

function addSoftwareBase(no, category, issue, productType = "软件") {
  add(
    no,
    category,
    issue,
    `${productType}名称`,
    "ProductName0 / DisplayName0（候选）",
    "v_GS_INSTALLED_SOFTWARE / v_GS_ADD_REMOVE_PROGRAMS",
    "cmdb_sam_sw_install（有 SAM）\ncmdb_software_instance / cmdb_ci_spkg（无 SAM）",
    "display_name\n或 name",
    "O",
    "标准 Connector 支持软件安装信息。有 SAM 时优先落 cmdb_sam_sw_install；无 SAM 时使用 Software Instance/Software。",
    "官方明确",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    `${productType}版本`,
    "ProductVersion0 / Version0（候选）",
    "v_GS_INSTALLED_SOFTWARE / v_GS_ADD_REMOVE_PROGRAMS",
    "cmdb_sam_sw_install（有 SAM）\ncmdb_ci_spkg（无 SAM）",
    "version",
    "O",
    "标准目标字段明确包含 version。",
    "官方明确",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    `${productType}Publisher/厂商`,
    "Publisher0（候选）",
    "v_GS_INSTALLED_SOFTWARE / v_GS_ADD_REMOVE_PROGRAMS",
    "cmdb_sam_sw_install（有 SAM）\ncmdb_ci_spkg（无 SAM）",
    "publisher\n或 vendor/manufacturer",
    "O",
    "标准目标字段明确包含 publisher；无 SAM 时可由 Software 表的 vendor/manufacturer 承接。",
    "官方明确",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    `${productType}安装日期`,
    "InstallDate0（候选）",
    "v_GS_INSTALLED_SOFTWARE / v_GS_ADD_REMOVE_PROGRAMS",
    "cmdb_sam_sw_install\n或 cmdb_software_instance",
    "install_date",
    "O",
    "标准目标字段明确包含 install_date；源值是否存在取决于 MECM 库存数据。",
    "官方明确，源值依实例",
    ["snClasses", "msHardware"],
  );
  add(
    no,
    category,
    issue,
    "安装目标 CI",
    "ResourceID（用于关联设备）",
    "MECM 各客户端库存 View",
    "cmdb_sam_sw_install\n或 cmdb_software_instance",
    "installed_on",
    "O",
    "标准目标字段 installed_on 引用 Computer CI。ResourceID 到 CI 的匹配由 Connector/IRE 映射处理。",
    "官方明确",
    ["snClasses", "snSccm"],
  );
}

// #1-3 OS lifecycle
addOsBase(1, "OS 生命周期", "OS 支持期限结束");
add(
  1,
  "OS 生命周期",
  "OS 支持期限结束",
  "OS Build Number",
  "BuildNumber0（候选）",
  "v_GS_OPERATING_SYSTEM",
  "无明确标准目标字段",
  "-",
  "X",
  "官方 SG-SCCM 目标字段清单未列独立 Build Number。可自定义映射，或由 os_version 组合表达。",
  "官方支持推论",
  ["snClasses", "msHardware"],
);
add(
  1,
  "OS 生命周期",
  "OS 支持期限结束",
  "最后硬件库存/发现时间",
  "LastHWScan（候选）",
  "v_GS_WORKSTATION_STATUS",
  "cmdb_ci_computer",
  "last_discovered",
  "O",
  "标准目标字段明确包含 last_discovered；应核对 ETL 是否以 LastHWScan 写入。",
  "官方支持，映射需确认",
  ["snClasses", "msHardware", "snSccm"],
);
add(
  1,
  "OS 生命周期",
  "OS 支持期限结束",
  "支持结束日期",
  "客户生命周期主数据中的 EOL Date",
  "非 MECM 原始库存字段",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "需要与客户维护的 OS 生命周期主数据匹配，标准 SG-SCCM 不产生该日期。",
  "客户规则",
  ["snClasses"],
);
add(
  1,
  "OS 生命周期",
  "OS 支持期限结束",
  "生命周期阶段 / EOL 判定结果",
  "由 OS 名称、版本与生命周期主数据计算",
  "客户规则引擎/外部主数据",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "这是派生的审计结果，不是 MECM 的基础资产字段。建议落自定义 finding 表。",
  "客户规则",
  ["snClasses"],
);

addOsBase(2, "OS 生命周期", "OS 移行期限结束前 3 个月");
add(
  2,
  "OS 生命周期",
  "OS 移行期限结束前 3 个月",
  "OS Build Number",
  "BuildNumber0（候选）",
  "v_GS_OPERATING_SYSTEM",
  "无明确标准目标字段",
  "-",
  "X",
  "标准目标字段清单没有独立 Build Number。",
  "官方支持推论",
  ["snClasses", "msHardware"],
);
add(
  2,
  "OS 生命周期",
  "OS 移行期限结束前 3 个月",
  "移行期限日",
  "客户生命周期主数据中的 Migration Due Date",
  "非 MECM 原始库存字段",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "需要客户主数据；不是标准 SG-SCCM 映射字段。",
  "客户规则",
  ["snClasses"],
);
add(
  2,
  "OS 生命周期",
  "OS 移行期限结束前 3 个月",
  "距离期限的剩余天数",
  "Migration Due Date - 判定日",
  "计算字段",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "属于派生计算值，建议存入审计/合规结果表。",
  "客户规则",
  ["snClasses"],
);
add(
  2,
  "OS 生命周期",
  "OS 移行期限结束前 3 个月",
  "3 个月前警告判定",
  "生命周期规则计算结果",
  "客户规则引擎",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "标准 CMDB 只承接 OS 基础属性，不承接客户定义的警告结论。",
  "客户规则",
  ["snClasses"],
);

addOsBase(3, "OS 生命周期", "OS 移行期间中");
add(
  3,
  "OS 生命周期",
  "OS 移行期间中",
  "生命周期阶段",
  "客户生命周期主数据中的 Stage",
  "非 MECM 原始库存字段",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "移行期间是客户业务判定，不是标准 SG-SCCM 目标字段。",
  "客户规则",
  ["snClasses"],
);
add(
  3,
  "OS 生命周期",
  "OS 移行期间中",
  "移行期间判定结果",
  "OS 名称/版本与生命周期主数据匹配结果",
  "客户规则引擎",
  "无标准 CMDB 目标字段",
  "-",
  "X",
  "应作为审计发现保存，不建议直接新增到 cmdb_ci_computer。",
  "客户规则",
  ["snClasses"],
);

// #4-5 missing Windows patches
for (const [no, issue] of [
  [4, "Windows 补丁未适用（公开后第 2 周以后）"],
  [5, "Windows 补丁未适用（公开翌周）"],
]) {
  add(
    no,
    "Windows 补丁",
    issue,
    "KB / Article ID",
    "ArticleID",
    "v_UpdateInfo / v_UpdateCIs",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 能提供更新元数据，但 ServiceNow 官方 SG-SCCM 目标字段清单不包含补丁合规明细。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "补丁标题",
    "Title",
    "v_UpdateInfo",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "可自定义导入到补丁合规表，不能按标准 Connector 直接落 CMDB 字段。",
    "官方支持推论",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "补丁发布日期",
    "DateCreated / DatePosted（候选）",
    "v_UpdateInfo / v_UpdateCIs",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 有更新日期信息，标准 SG-SCCM 目标映射未覆盖。",
    "官方支持推论",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "补丁严重度",
    "Severity",
    "v_UpdateInfo / v_UpdateCIs",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 有严重度，标准 SG-SCCM 目标映射未覆盖。",
    "官方支持推论",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "设备补丁合规/检测状态",
    "Status / Detection State",
    "v_Update_ComplianceStatus / v_UpdateState_Combined",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "这是设备与补丁之间的多对多合规结果，不能放进单一 Computer CI 字段。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "最后状态检查时间",
    "LastStatusCheckTime",
    "v_Update_ComplianceStatus",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "属于补丁合规事件时间，不是标准 CMDB 资产属性。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "最后更新扫描时间",
    "LastScanTime",
    "v_UpdateScanStatus",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 有该信息，但 SG-SCCM 标准目标字段不包含 Windows Update 扫描时间。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msUpdates", "snClasses"],
  );
  add(
    no,
    "Windows 补丁",
    issue,
    "未适用天数 / 周数与最终判定",
    "判定日 - 补丁发布日期；结合 Compliance Status",
    "计算字段",
    "无标准 CMDB 目标字段",
    "-",
    "X",
    "公开翌周/翌々周规则是客户审计逻辑，应保存在自定义合规发现中。",
    "客户规则",
    ["msUpdates", "snClasses"],
  );
}

// #6-10 local security and Windows services
for (const item of [
  ["账户名称", "Name0", "v_GS_SYSTEM_ACCOUNT"],
  ["账户 SID", "SID0", "v_GS_SYSTEM_ACCOUNT"],
  ["账户是否启用", "Disabled0 / Enabled（候选）", "v_GS_SYSTEM_ACCOUNT / Compliance Baseline"],
  ["本地/域账户属性", "Domain0 / LocalAccount0（候选）", "v_GS_SYSTEM_ACCOUNT"],
  ["Guest 有效判定", "Name='Guest' 且 Enabled=true", "计算字段"],
]) {
  add(
    6,
    "本地安全设置",
    "GUEST 账户有效",
    item[0],
    item[1],
    item[2],
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 可通过库存或 Compliance Baseline 取得，但官方 SG-SCCM 目标字段没有本地账户配置。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msHardware", "snClasses"],
  );
}

for (const item of [
  ["AutoAdminLogon 值", "AutoAdminLogon", "自定义注册表库存 / Compliance Baseline"],
  ["DefaultUserName", "DefaultUserName", "自定义注册表库存 / Compliance Baseline"],
  ["注册表路径", "RegistryKey / RegistryPath（候选）", "自定义注册表库存"],
  ["自动登录有效判定", "AutoAdminLogon='1'", "计算字段"],
]) {
  add(
    7,
    "本地安全设置",
    "自动登录设置有效",
    item[0],
    item[1],
    item[2],
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "这是注册表/策略合规信息。标准 Connector 不会默认把任意注册表值映射为 CMDB 字段。",
    "实例依赖",
    ["msHardware", "snClasses"],
  );
}

for (const item of [
  ["屏幕保护程序是否启用", "ScreenSaveActive / Policy Result（候选）"],
  ["是否启用密码保护", "ScreenSaverIsSecure / ScreenSaverSecure（候选）"],
  ["屏保超时时间", "ScreenSaveTimeOut（候选）"],
  ["策略/注册表路径", "PolicyPath / RegistryPath（候选）"],
  ["屏保密码保护无效判定", "启用状态 + 密码保护 + 超时规则"],
]) {
  add(
    8,
    "本地安全设置",
    "屏幕保护密码保护无效",
    item[0],
    item[1],
    "自定义注册表库存 / Compliance Baseline / v_GS_DESKTOP",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "属于安全策略状态，不是标准 Computer CI 字段。",
    "实例依赖",
    ["msHardware", "snClasses"],
  );
}

for (const item of [
  ["Windows Update 自动更新策略", "AUOptions / NoAutoUpdate（候选）", "自定义注册表库存 / Compliance Baseline"],
  ["最后更新扫描状态", "LastScanState", "v_UpdateScanStatus"],
  ["最后更新扫描时间", "LastScanTime", "v_UpdateScanStatus"],
  ["最后扫描错误码", "LastErrorCode", "v_UpdateScanStatus"],
  ["Windows Update Agent 版本", "LastWUAVersion", "v_UpdateScanStatus"],
  ["自动更新无效判定", "策略值 + 扫描状态的判定结果", "计算字段"],
]) {
  add(
    9,
    "Windows Update 设置",
    "Windows 自动更新无效",
    item[0],
    item[1],
    item[2],
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 更新 View 可提供部分信息，但标准 SG-SCCM 目标映射没有这些字段。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msUpdates", "snClasses"],
  );
}

for (const item of [
  ["Windows Service 名称", "Name0"],
  ["显示名称", "DisplayName0"],
  ["运行状态", "State0"],
  ["启动类型", "StartMode0"],
  ["可执行文件路径", "PathName0"],
  ["运行账户", "StartName0"],
  ["不必要服务判定", "服务清单匹配 + State='Running'"],
]) {
  add(
    10,
    "Windows Service",
    "不必要的服务正在运行",
    item[0],
    item[1],
    "v_GS_SERVICE",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 能采集 Windows Service，但 ServiceNow 官方 SG-SCCM 目标类不包含 Windows Service 库存。不能写入 cmdb_ci_service。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msHardware", "snClasses"],
  );
}

// #11-16 endpoint protection
addSoftwareBase(11, "AV / Endpoint Protection", "病毒对策产品不是指定产品", "AV 产品");
for (const item of [
  ["AV/Antimalware 是否启用", "AntivirusEnabled / AntimalwareEnabled（候选）", "v_GS_AntimalwareHealthStatus"],
  ["Endpoint Protection 是否受保护", "Protected / AtRisk / Supported（候选）", "v_EndpointProtectionStatus"],
  ["指定 AV 产品匹配结果", "安装产品与客户指定 AV 清单的比较结果", "客户规则引擎"],
  ["AV 产品支持状态", "产品版本与生命周期主数据匹配结果", "客户生命周期主数据"],
  ["未安装/非指定/支持结束判定", "软件库存 + AV 健康状态 + 客户规则", "计算字段"],
]) {
  add(
    11,
    "AV / Endpoint Protection",
    "病毒对策产品不是指定产品",
    item[0],
    item[1],
    item[2],
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "软件安装信息可标准落表，但 AV 健康、指定产品和生命周期判定不在标准目标字段中。",
    "官方支持推论/客户规则",
    ["msEndpoint", "snClasses"],
  );
}

for (const [no, issue] of [
  [12, "AV 产品移行期限结束前 3 个月"],
  [13, "AV 产品移行期间中"],
]) {
  addSoftwareBase(no, "AV / Endpoint Protection", issue, "AV 产品");
  for (const item of [
    ["生命周期阶段", "客户 AV 生命周期主数据中的 Stage"],
    ["移行期限日", "客户 AV 生命周期主数据中的 Due Date"],
    ["剩余天数", "Due Date - 判定日"],
    ["移行阶段判定结果", "产品名/版本与生命周期主数据的匹配结果"],
  ]) {
    add(
      no,
      "AV / Endpoint Protection",
      issue,
      item[0],
      item[1],
      "客户生命周期主数据 / 计算字段",
      "无标准 SG-SCCM CMDB 目标字段",
      "-",
      "X",
      "产品安装信息可标准落表；移行期限和阶段是客户维护的业务规则。",
      "客户规则",
      ["snClasses"],
    );
  }
}

addSoftwareBase(14, "AV / Endpoint Protection", "AutoProtect 未设定", "AV 产品");
for (const item of [
  ["AutoProtect/实时保护是否启用", "RealTimeProtectionEnabled / AutoProtectEnabled（产品依赖）"],
  ["AV 策略适用状态", "Policy State / Compliance Result（产品依赖）"],
  ["AutoProtect 未设定判定", "实时保护值 + 产品策略规则"],
]) {
  add(
    14,
    "AV / Endpoint Protection",
    "AutoProtect 未设定",
    item[0],
    item[1],
    "v_GS_AntimalwareHealthStatus / 产品专用 WMI / Compliance Baseline",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "AutoProtect 是产品依赖的健康/策略字段，标准 SG-SCCM CMDB 目标字段未覆盖。",
    "实例依赖",
    ["msEndpoint", "snClasses"],
  );
}

addSoftwareBase(15, "AV / Endpoint Protection", "AV 定义文件不是最新", "AV 产品");
for (const item of [
  ["定义文件/安全情报版本", "DefinitionVersion / SignatureVersion（候选）"],
  ["定义文件最后更新时间", "DefinitionLastUpdated / SignatureUpdated（候选）"],
  ["Antimalware Engine 版本", "EngineVersion（候选）"],
  ["AV 是否启用", "AntivirusEnabled / AntimalwareEnabled（候选）"],
  ["定义文件经过天数", "判定日 - 定义文件最后更新时间"],
  ["超过 1 周未更新判定", "经过天数 >= 客户阈值"],
]) {
  add(
    15,
    "AV / Endpoint Protection",
    "AV 定义文件不是最新",
    item[0],
    item[1],
    "v_GS_AntimalwareHealthStatus / v_EndpointProtectionStatus / 计算字段",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM Endpoint Protection 可提供健康信息，但标准 SG-SCCM CMDB 目标字段未覆盖定义文件与健康状态。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msEndpoint", "snClasses"],
  );
}

addSoftwareBase(16, "AV / Endpoint Protection", "AV 定时扫描超过 1 周未实施", "AV 产品");
for (const item of [
  ["最后扫描时间", "LastScanTime / LastFullScanTime / LastQuickScanTime（候选）"],
  ["扫描类型", "Full / Quick / Scheduled（候选）"],
  ["扫描结果/健康状态", "Scan Result / Health State（候选）"],
  ["距离最后扫描的天数", "判定日 - LastScanTime"],
  ["超过 1 周未扫描判定", "经过天数 >= 客户阈值"],
]) {
  add(
    16,
    "AV / Endpoint Protection",
    "AV 定时扫描超过 1 周未实施",
    item[0],
    item[1],
    "v_GS_AntimalwareHealthStatus / 计算字段",
    "无标准 SG-SCCM CMDB 目标字段",
    "-",
    "X",
    "MECM 能提供扫描健康信息，但标准 SG-SCCM 目标字段没有 AV 扫描历史。",
    "Microsoft 官方 + ServiceNow 目标表核对",
    ["msEndpoint", "snClasses"],
  );
}

// #17 disk encryption
for (const item of [
  ["磁盘/卷名称", "Name0 / DeviceID0 / DriveLetter0（候选）", "cmdb_ci_disk", "name / device_id", "O", "标准 SG-SCCM 可导入 Disk 身份信息；须能与加密 View 中的卷对应。"],
  ["磁盘容量", "Size0（候选）", "cmdb_ci_disk", "size_bytes / disk_space", "O", "标准目标字段明确包含磁盘容量。"],
  ["驱动器类型", "DriveType0（候选）", "cmdb_ci_disk", "drive_type", "O", "标准目标字段明确包含 drive_type。"],
  ["BitLocker 保护状态", "ProtectionStatus0（候选）", "无标准目标字段", "-", "X", "标准 cmdb_ci_disk 目标字段没有加密保护状态。"],
  ["加密转换状态", "ConversionStatus0（候选）", "无标准目标字段", "-", "X", "标准 cmdb_ci_disk 目标字段没有转换状态。"],
  ["加密方法", "EncryptionMethod0（候选）", "无标准目标字段", "-", "X", "标准 cmdb_ci_disk 目标字段没有加密方法。"],
  ["TPM 状态/版本", "TPM 属性（候选）", "无标准目标字段", "-", "X", "MECM 可收集 TPM，但 SG-SCCM 标准目标类清单未列 TPM 目标表/字段。"],
  ["HDD 未加密判定", "ProtectionStatus + 客户判定规则", "无标准目标字段", "-", "X", "这是合规判定结果，应落自定义安全发现表。"],
]) {
  add(
    17,
    "磁盘加密",
    "HDD 未加密",
    item[0],
    item[1],
    "v_GS_ENCRYPTABLE_VOLUME / v_GS_PROTECTED_VOLUME_INFO / v_GS_TPM / v_GS_DISK",
    item[2],
    item[3],
    item[4],
    item[5],
    item[4] === "O" ? "官方支持，关联需确认" : "官方支持推论",
    ["msHardware", "snClasses"],
  );
}

// #18-20 forbidden software
for (const [no, issue, risk] of [
  [18, "不适切软件已安装（高）", "High"],
  [19, "不适切软件已安装（中）", "Medium"],
  [20, "不适切软件已安装（低）", "Low"],
]) {
  addSoftwareBase(no, "不适切软件", issue, "软件");
  for (const item of [
    ["软件分类/Category", "CategoryID / Category Name（Asset Intelligence 候选）"],
    ["禁止软件清单匹配结果", "软件名/版本与客户禁止清单的匹配结果"],
    ["风险等级", `客户规则固定/计算为 ${risk}`],
    ["最终指摘判定", "已安装软件 + 禁止清单 + 风险等级"],
  ]) {
    add(
      no,
      "不适切软件",
      issue,
      item[0],
      item[1],
      "v_GS_INSTALLED_SOFTWARE_CATEGORIZED / 客户禁止软件主数据 / 计算字段",
      "无标准 SG-SCCM CMDB 目标字段",
      "-",
      "X",
      "标准 Connector 能导入软件安装信息，但客户定义的不适切分类、风险等级和最终判定没有标准 CMDB 字段。",
      "客户规则",
      ["msHardware", "snClasses"],
    );
  }
}

// #21-23 product lifecycle
for (const [no, issue, stage] of [
  [21, "支持结束产品已安装", "EOL"],
  [22, "产品移行期限结束前 3 个月", "Warning"],
  [23, "产品处于移行期间", "Migration"],
]) {
  addSoftwareBase(no, "产品生命周期", issue, "软件");
  for (const item of [
    ["产品生命周期阶段", `客户产品生命周期主数据中的 Stage=${stage}`],
    ["支持结束日/移行期限日", "客户产品生命周期主数据中的 Date"],
    ["距离期限的剩余天数", "期限日 - 判定日"],
    ["生命周期指摘判定", "软件名/版本与生命周期主数据匹配结果"],
  ]) {
    add(
      no,
      "产品生命周期",
      issue,
      item[0],
      item[1],
      "客户产品生命周期主数据 / 计算字段",
      "无标准 SG-SCCM CMDB 目标字段",
      "-",
      "X",
      "软件安装信息可标准落表；支持结束和移行判定不是 MECM 原始库存字段。",
      "客户规则",
      ["snClasses", "msHardware"],
    );
  }
}

function col(n) {
  let value = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    n = Math.floor((n - 1) / 26);
  }
  return value;
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRange(`${col(index + 1)}:${col(index + 1)}`).format.columnWidthPx =
      width;
  });
}

async function build() {
  const inputBytes = await fs.readFile(inputPath);
  const wb = await SpreadsheetFile.importXlsx(inputBytes);
  const sheet = wb.worksheets.add("11_字段落表矩阵_CN");

  sheet.showGridLines = false;
  setWidths(sheet, [48, 135, 205, 190, 225, 250, 240, 210, 72, 380, 150, 440]);

  sheet.getRange("A1:L1").merge();
  sheet.getRange("A1").values = [
    ["MECM 23 项安全指摘：抽取字段与 ServiceNow 标准落表 O/X 矩阵"],
  ];
  sheet.getRange("A1:L1").format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, fontSize: 16 },
    verticalAlignment: "middle",
    horizontalAlignment: "left",
  };
  sheet.getRange("1:1").format.rowHeightPx = 44;

  sheet.getRange("A3:L5").merge();
  sheet.getRange("A3").values = [[
    "判断口径：O = ServiceNow 官方 SG-SCCM 目标类页面明确存在标准目标表/字段；X = MECM 虽可抽取，但标准 Connector 没有对应字段，或该值属于客户生命周期、合规、风险规则的计算结果。O 不代表所有实例必然已有值，仍需在客户实例检查 IntegrationHub ETL Data Map、插件/SAM 状态和 MECM 实际库存列。访问日期：2026-06-24。",
  ]];
  sheet.getRange("A3:L5").format = {
    fill: COLORS.yellow,
    font: { color: "#7F6000", fontSize: 11 },
    wrapText: true,
    verticalAlignment: "middle",
  };
  sheet.getRange("A3:L5").format.borders = {
    preset: "outside",
    style: "thin",
    color: "#D6B656",
  };

  const oCount = rows.filter((row) => row[8] === "O").length;
  const xCount = rows.length - oCount;
  const summary = [
    ["字段行总数", rows.length, "O：标准可落表", oCount, "X：不能标准直落", xCount],
    [
      "核心结论",
      "设备/OS/软件安装/磁盘身份等基础资产字段可部分标准落表；23 项安全指摘的最终判定绝大多数必须进入自定义安全发现或合规表。",
      "",
      "",
      "",
      "",
    ],
  ];
  sheet.getRange("A7:F8").values = summary;
  sheet.getRange("A7:F8").format = {
    wrapText: true,
    verticalAlignment: "middle",
  };
  sheet.getRange("A7:F8").format.borders = {
    preset: "all",
    style: "thin",
    color: COLORS.border,
  };
  sheet.getRange("A7:F7").format.fill = COLORS.lightBlue;
  sheet.getRange("A7:F7").format.font = { bold: true, color: COLORS.navy };
  sheet.getRange("B8:F8").merge();
  sheet.getRange("7:8").format.rowHeightPx = 34;

  const headers = [
    "#",
    "分类",
    "指摘内容",
    "具体抽取信息",
    "MECM 候选字段/属性",
    "MECM 来源",
    "ServiceNow 标准表",
    "ServiceNow 标准字段",
    "直接落 CMDB\nO / X",
    "判断说明",
    "证据级别",
    "参考资料 URL",
  ];
  const startRow = 10;
  const endRow = startRow + rows.length;
  sheet.getRange(`A${startRow}:L${endRow}`).values = [headers, ...rows];
  sheet.getRange(`A${startRow}:L${startRow}`).format = {
    fill: COLORS.blue,
    font: { bold: true, color: COLORS.white, fontSize: 11 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
  };
  sheet.getRange(`A${startRow}:L${endRow}`).format.borders = {
    preset: "all",
    style: "thin",
    color: COLORS.border,
  };
  sheet.getRange(`A${startRow + 1}:L${endRow}`).format = {
    wrapText: true,
    verticalAlignment: "top",
    horizontalAlignment: "left",
  };
  sheet.getRange(`A${startRow + 1}:A${endRow}`).format.horizontalAlignment =
    "center";
  sheet.getRange(`I${startRow + 1}:I${endRow}`).format = {
    bold: true,
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    font: { fontSize: 12 },
  };

  let previousNo = null;
  let useBlue = false;
  for (let index = 0; index < rows.length; index++) {
    const excelRow = startRow + 1 + index;
    const currentNo = rows[index][0];
    if (currentNo !== previousNo) {
      useBlue = !useBlue;
      previousNo = currentNo;
    }
    if (useBlue) {
      sheet.getRange(`A${excelRow}:L${excelRow}`).format.fill = "#F7FBFF";
    }
    const direct = rows[index][8];
    sheet.getRange(`I${excelRow}`).format.fill =
      direct === "O" ? COLORS.greenLight : COLORS.redLight;
    sheet.getRange(`I${excelRow}`).format.font = {
      bold: true,
      color: direct === "O" ? COLORS.green : COLORS.red,
      fontSize: 12,
    };
    sheet.getRange(`${excelRow}:${excelRow}`).format.rowHeightPx = 82;
  }
  sheet.getRange(`${startRow}:${startRow}`).format.rowHeightPx = 54;
  sheet.freezePanes.freezeRows(startRow);

  const formulaErrors = await wb.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 200 },
  });
  await fs.writeFile(
    outputPath + ".formula_errors.ndjson",
    formulaErrors.ndjson || "",
    "utf8",
  );

  const matrixInspect = await wb.inspect({
    kind: "table",
    range: `11_字段落表矩阵_CN!A1:L${endRow}`,
    tableMaxRows: 20,
    tableMaxCols: 12,
    maxChars: 30000,
  });
  await fs.writeFile(
    outputPath + ".inspect.ndjson",
    matrixInspect.ndjson || "",
    "utf8",
  );

  const preview = await wb.render({
    sheetName: "11_字段落表矩阵_CN",
    range: "A1:L36",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(__dirname, "preview_11_字段落表矩阵_CN.png"),
    new Uint8Array(await preview.arrayBuffer()),
  );

  const xlsx = await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(outputPath);
  console.log(
    JSON.stringify({
      outputPath,
      matrixRows: rows.length,
      oCount,
      xCount,
      lastRow: endRow,
    }),
  );
}

await build();
