import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workbookPath = path.join(
  __dirname,
  "MECM读取信息到ServiceNow表字段映射_23项安全指摘_字段落表矩阵追加版.xlsx",
);

const COLORS = {
  navy: "#17365D",
  blue: "#1F4E79",
  lightBlue: "#DDEBF7",
  green: "#548235",
  greenLight: "#E2F0D9",
  red: "#C00000",
  redLight: "#FCE4D6",
  yellow: "#FFF2CC",
  border: "#B4C6E7",
  white: "#FFFFFF",
};

const categoryMap = {
  "OS 生命周期": "OS ライフサイクル",
  "Windows 补丁": "Windows パッチ",
  本地安全设置: "ローカルセキュリティ設定",
  "Windows Update 设置": "Windows Update 設定",
  "Windows Service": "Windows Service",
  "AV / Endpoint Protection": "AV / Endpoint Protection",
  磁盘加密: "ディスク暗号化",
  不适切软件: "不適切ソフトウェア",
  产品生命周期: "製品ライフサイクル",
};

const issueMap = {
  "OS 支持期限结束": "OS サポート期限切れ",
  "OS 移行期限结束前 3 个月": "OS 移行期限終了 3 か月前",
  "OS 移行期间中": "OS 移行期間中",
  "Windows 补丁未适用（公开后第 2 周以后）":
    "Windows パッチ未適用（公開後、翌々週以降）",
  "Windows 补丁未适用（公开翌周）":
    "Windows パッチ未適用（公開翌週）",
  "GUEST 账户有效": "GUEST アカウント有効",
  自动登录设置有效: "自動ログオン設定有効",
  屏幕保护密码保护无效: "スクリーンセーバーのパスワード保護無効",
  "Windows 自动更新无效": "Windows 自動更新無効",
  不必要的服务正在运行: "不要なサービスが実行中",
  病毒对策产品不是指定产品: "ウイルス対策製品が指定製品ではない",
  "AV 产品移行期限结束前 3 个月": "AV 製品移行期限終了 3 か月前",
  "AV 产品移行期间中": "AV 製品移行期間中",
  "AutoProtect 未设定": "AutoProtect 未設定",
  "AV 定义文件不是最新": "AV 定義ファイルが最新ではない",
  "AV 定时扫描超过 1 周未实施": "AV 定期スキャンが 1 週間以上未実施",
  "HDD 未加密": "HDD 未暗号化",
  "不适切软件已安装（高）": "不適切ソフトウェア導入済み（高）",
  "不适切软件已安装（中）": "不適切ソフトウェア導入済み（中）",
  "不适切软件已安装（低）": "不適切ソフトウェア導入済み（低）",
  支持结束产品已安装: "サポート終了製品導入済み",
  "产品移行期限结束前 3 个月": "製品移行期限終了 3 か月前",
  产品处于移行期间: "製品移行期間中",
};

const infoMap = {
  "OS 名称": "OS 名",
  "OS 版本": "OS バージョン",
  "OS Service Pack": "OS Service Pack",
  "OS Build Number": "OS Build Number",
  "最后硬件库存/发现时间": "最終ハードウェアインベントリ / 検出日時",
  支持结束日期: "サポート終了日",
  "生命周期阶段 / EOL 判定结果":
    "ライフサイクル段階 / EOL 判定結果",
  移行期限日: "移行期限日",
  距离期限的剩余天数: "期限までの残日数",
  "3 个月前警告判定": "3 か月前警告判定",
  生命周期阶段: "ライフサイクル段階",
  移行期间判定结果: "移行期間判定結果",
  "KB / Article ID": "KB / Article ID",
  补丁标题: "パッチタイトル",
  补丁发布日期: "パッチ公開日",
  补丁严重度: "パッチ重要度",
  "设备补丁合规/检测状态": "端末のパッチ準拠 / 検出状態",
  最后状态检查时间: "最終ステータス確認日時",
  最后更新扫描时间: "最終更新スキャン日時",
  "未适用天数 / 周数与最终判定": "未適用日数 / 週数および最終判定",
  账户名称: "アカウント名",
  "账户 SID": "アカウント SID",
  账户是否启用: "アカウントの有効 / 無効",
  "本地/域账户属性": "ローカル / ドメインアカウント属性",
  "Guest 有效判定": "Guest 有効判定",
  "AutoAdminLogon 值": "AutoAdminLogon 値",
  DefaultUserName: "DefaultUserName",
  注册表路径: "レジストリパス",
  自动登录有效判定: "自動ログオン有効判定",
  屏幕保护程序是否启用: "スクリーンセーバーの有効 / 無効",
  是否启用密码保护: "パスワード保護の有効 / 無効",
  屏保超时时间: "スクリーンセーバーのタイムアウト",
  "策略/注册表路径": "ポリシー / レジストリパス",
  屏保密码保护无效判定: "スクリーンセーバーのパスワード保護無効判定",
  "Windows Update 自动更新策略": "Windows Update 自動更新ポリシー",
  最后更新扫描状态: "最終更新スキャン状態",
  最后扫描错误码: "最終スキャンエラーコード",
  "Windows Update Agent 版本": "Windows Update Agent バージョン",
  自动更新无效判定: "自動更新無効判定",
  "Windows Service 名称": "Windows Service 名",
  显示名称: "表示名",
  运行状态: "実行状態",
  启动类型: "起動種類",
  可执行文件路径: "実行ファイルパス",
  运行账户: "実行アカウント",
  不必要服务判定: "不要サービス判定",
  "AV 产品名称": "AV 製品名",
  "AV 产品版本": "AV 製品バージョン",
  "AV 产品Publisher/厂商": "AV 製品 Publisher / ベンダー",
  "AV 产品安装日期": "AV 製品インストール日",
  "安装目标 CI": "インストール先 CI",
  "AV/Antimalware 是否启用": "AV / Antimalware の有効 / 無効",
  "Endpoint Protection 是否受保护": "Endpoint Protection の保護状態",
  "指定 AV 产品匹配结果": "指定 AV 製品との照合結果",
  "AV 产品支持状态": "AV 製品サポート状態",
  "未安装/非指定/支持结束判定":
    "未導入 / 指定外 / サポート終了判定",
  剩余天数: "残日数",
  移行阶段判定结果: "移行段階判定結果",
  "AutoProtect/实时保护是否启用":
    "AutoProtect / リアルタイム保護の有効 / 無効",
  "AV 策略适用状态": "AV ポリシー適用状態",
  "AutoProtect 未设定判定": "AutoProtect 未設定判定",
  "定义文件/安全情报版本": "定義ファイル / セキュリティインテリジェンスバージョン",
  定义文件最后更新时间: "定義ファイル最終更新日時",
  "Antimalware Engine 版本": "Antimalware Engine バージョン",
  "AV 是否启用": "AV の有効 / 無効",
  定义文件经过天数: "定義ファイル更新後の経過日数",
  "超过 1 周未更新判定": "1 週間以上未更新の判定",
  最后扫描时间: "最終スキャン日時",
  扫描类型: "スキャン種別",
  "扫描结果/健康状态": "スキャン結果 / ヘルス状態",
  距离最后扫描的天数: "最終スキャンからの経過日数",
  "超过 1 周未扫描判定": "1 週間以上未スキャンの判定",
  "磁盘/卷名称": "ディスク / ボリューム名",
  磁盘容量: "ディスク容量",
  驱动器类型: "ドライブ種類",
  "BitLocker 保护状态": "BitLocker 保護状態",
  加密转换状态: "暗号化変換状態",
  加密方法: "暗号化方式",
  "TPM 状态/版本": "TPM 状態 / バージョン",
  "HDD 未加密判定": "HDD 未暗号化判定",
  软件名称: "ソフトウェア名",
  软件版本: "ソフトウェアバージョン",
  "软件Publisher/厂商": "ソフトウェア Publisher / ベンダー",
  软件安装日期: "ソフトウェアインストール日",
  "软件分类/Category": "ソフトウェア分類 / Category",
  禁止软件清单匹配结果: "禁止ソフトウェアリストとの照合結果",
  风险等级: "リスクレベル",
  最终指摘判定: "最終指摘判定",
  产品生命周期阶段: "製品ライフサイクル段階",
  "支持结束日/移行期限日": "サポート終了日 / 移行期限日",
  生命周期指摘判定: "ライフサイクル指摘判定",
};

const sourceMap = {
  "非 MECM 原始库存字段": "MECM の原始インベントリ項目ではない",
  "客户规则引擎/外部主数据": "顧客ルールエンジン / 外部マスタ",
  计算字段: "算出項目",
  客户规则引擎: "顧客ルールエンジン",
  "v_GS_SYSTEM_ACCOUNT / Compliance Baseline":
    "v_GS_SYSTEM_ACCOUNT / Compliance Baseline",
  "自定义注册表库存 / Compliance Baseline":
    "カスタムレジストリインベントリ / Compliance Baseline",
  自定义注册表库存: "カスタムレジストリインベントリ",
  "自定义注册表库存 / Compliance Baseline / v_GS_DESKTOP":
    "カスタムレジストリインベントリ / Compliance Baseline / v_GS_DESKTOP",
  "MECM 各客户端库存 View": "MECM クライアント別インベントリ View",
  客户生命周期主数据: "顧客ライフサイクルマスタ",
  "客户生命周期主数据 / 计算字段":
    "顧客ライフサイクルマスタ / 算出項目",
  "v_GS_AntimalwareHealthStatus / 产品专用 WMI / Compliance Baseline":
    "v_GS_AntimalwareHealthStatus / 製品固有 WMI / Compliance Baseline",
  "v_GS_AntimalwareHealthStatus / v_EndpointProtectionStatus / 计算字段":
    "v_GS_AntimalwareHealthStatus / v_EndpointProtectionStatus / 算出項目",
  "v_GS_AntimalwareHealthStatus / 计算字段":
    "v_GS_AntimalwareHealthStatus / 算出項目",
  "v_GS_INSTALLED_SOFTWARE_CATEGORIZED / 客户禁止软件主数据 / 计算字段":
    "v_GS_INSTALLED_SOFTWARE_CATEGORIZED / 顧客禁止ソフトウェアマスタ / 算出項目",
  "客户产品生命周期主数据 / 计算字段":
    "顧客製品ライフサイクルマスタ / 算出項目",
};

const tableMap = {
  无明确标准目标字段: "明確な標準ターゲット項目なし",
  无标准CMDB目标字段: "標準 CMDB ターゲット項目なし",
  "无标准 CMDB 目标字段": "標準 CMDB ターゲット項目なし",
  "无标准 SG-SCCM CMDB 目标字段":
    "標準 SG-SCCM CMDB ターゲット項目なし",
  "cmdb_sam_sw_install（有 SAM）\ncmdb_software_instance / cmdb_ci_spkg（无 SAM）":
    "cmdb_sam_sw_install（SAM あり）\ncmdb_software_instance / cmdb_ci_spkg（SAM なし）",
  "cmdb_sam_sw_install（有 SAM）\ncmdb_ci_spkg（无 SAM）":
    "cmdb_sam_sw_install（SAM あり）\ncmdb_ci_spkg（SAM なし）",
  "cmdb_sam_sw_install\n或 cmdb_software_instance":
    "cmdb_sam_sw_install\nまたは cmdb_software_instance",
  无标准目标字段: "標準ターゲット項目なし",
};

const evidenceMap = {
  官方明确: "公式明記",
  "官方支持，映射需确认": "公式サポート・マッピング要確認",
  官方支持推论: "公式情報に基づく推定",
  客户规则: "顧客ルール",
  "Microsoft 官方 + ServiceNow 目标表核对":
    "Microsoft 公式 + ServiceNow ターゲット表照合",
  实例依赖: "インスタンス依存",
  "官方明确，源值依实例": "公式明記・ソース値は環境依存",
  "官方支持推论/客户规则": "公式情報に基づく推定 / 顧客ルール",
  "官方支持，关联需确认": "公式サポート・関連付け要確認",
};

const reasonMap = {
  "ServiceNow 官方目标类页面明确列出 cmdb_ci_computer.os。":
    "ServiceNow 公式ターゲットクラス資料に cmdb_ci_computer.os が明記されている。",
  "ServiceNow 官方目标类页面明确列出 cmdb_ci_computer.os_version。":
    "ServiceNow 公式ターゲットクラス資料に cmdb_ci_computer.os_version が明記されている。",
  "标准目标字段存在；实际 MECM 列名和转换需在 IntegrationHub ETL Data Map 中复核。":
    "標準ターゲット項目は存在する。実際の MECM 列名と変換内容は IntegrationHub ETL Data Map で確認する。",
  "官方 SG-SCCM 目标字段清单未列独立 Build Number。可自定义映射，或由 os_version 组合表达。":
    "公式 SG-SCCM ターゲット項目一覧には独立した Build Number がない。カスタムマッピング、または os_version との組み合わせで表現する。",
  "标准目标字段明确包含 last_discovered；应核对 ETL 是否以 LastHWScan 写入。":
    "標準ターゲット項目に last_discovered が明記されている。ETL が LastHWScan を書き込むか確認が必要。",
  "需要与客户维护的 OS 生命周期主数据匹配，标准 SG-SCCM 不产生该日期。":
    "顧客管理の OS ライフサイクルマスタとの照合が必要であり、標準 SG-SCCM はこの日付を生成しない。",
  "这是派生的审计结果，不是 MECM 的基础资产字段。建议落自定义 finding 表。":
    "MECM の基本資産項目ではなく、算出された監査結果である。カスタム finding テーブルへの格納を推奨する。",
  "标准目标字段清单没有独立 Build Number。":
    "標準ターゲット項目一覧に独立した Build Number はない。",
  "需要客户主数据；不是标准 SG-SCCM 映射字段。":
    "顧客マスタが必要であり、標準 SG-SCCM のマッピング項目ではない。",
  "属于派生计算值，建议存入审计/合规结果表。":
    "算出値のため、監査 / コンプライアンス結果テーブルへの格納を推奨する。",
  "标准 CMDB 只承接 OS 基础属性，不承接客户定义的警告结论。":
    "標準 CMDB は OS の基本属性を格納するが、顧客定義の警告判定は格納しない。",
  "移行期间是客户业务判定，不是标准 SG-SCCM 目标字段。":
    "移行期間は顧客業務ルールによる判定であり、標準 SG-SCCM ターゲット項目ではない。",
  "应作为审计发现保存，不建议直接新增到 cmdb_ci_computer。":
    "監査上の発見事項として保存し、cmdb_ci_computer への直接追加は推奨しない。",
  "MECM 能提供更新元数据，但 ServiceNow 官方 SG-SCCM 目标字段清单不包含补丁合规明细。":
    "MECM は更新メタデータを提供できるが、ServiceNow 公式 SG-SCCM ターゲット項目にはパッチ準拠明細が含まれない。",
  "可自定义导入到补丁合规表，不能按标准 Connector 直接落 CMDB 字段。":
    "カスタム連携でパッチ準拠テーブルへ取り込めるが、標準 Connector では CMDB 項目へ直接格納できない。",
  "MECM 有更新日期信息，标准 SG-SCCM 目标映射未覆盖。":
    "MECM には更新日情報があるが、標準 SG-SCCM ターゲットマッピングの対象外である。",
  "MECM 有严重度，标准 SG-SCCM 目标映射未覆盖。":
    "MECM には重要度情報があるが、標準 SG-SCCM ターゲットマッピングの対象外である。",
  "这是设备与补丁之间的多对多合规结果，不能放进单一 Computer CI 字段。":
    "端末とパッチ間の多対多の準拠結果であり、単一の Computer CI 項目には格納できない。",
  "属于补丁合规事件时间，不是标准 CMDB 资产属性。":
    "パッチ準拠イベントの日時であり、標準 CMDB の資産属性ではない。",
  "MECM 有该信息，但 SG-SCCM 标准目标字段不包含 Windows Update 扫描时间。":
    "MECM には当該情報があるが、SG-SCCM の標準ターゲット項目に Windows Update スキャン日時は含まれない。",
  "公开翌周/翌々周规则是客户审计逻辑，应保存在自定义合规发现中。":
    "公開翌週 / 翌々週のルールは顧客監査ロジックであり、カスタム準拠結果として保存する。",
  "MECM 可通过库存或 Compliance Baseline 取得，但官方 SG-SCCM 目标字段没有本地账户配置。":
    "MECM のインベントリまたは Compliance Baseline で取得できるが、公式 SG-SCCM ターゲット項目にローカルアカウント設定はない。",
  "这是注册表/策略合规信息。标准 Connector 不会默认把任意注册表值映射为 CMDB 字段。":
    "レジストリ / ポリシーの準拠情報である。標準 Connector は任意のレジストリ値を CMDB 項目へ自動マッピングしない。",
  "属于安全策略状态，不是标准 Computer CI 字段。":
    "セキュリティポリシーの状態であり、標準 Computer CI 項目ではない。",
  "MECM 更新 View 可提供部分信息，但标准 SG-SCCM 目标映射没有这些字段。":
    "MECM の更新 View で一部情報を取得できるが、標準 SG-SCCM ターゲットマッピングに該当項目はない。",
  "MECM 能采集 Windows Service，但 ServiceNow 官方 SG-SCCM 目标类不包含 Windows Service 库存。不能写入 cmdb_ci_service。":
    "MECM は Windows Service を収集できるが、ServiceNow 公式 SG-SCCM ターゲットクラスに Windows Service インベントリは含まれない。cmdb_ci_service には格納しない。",
  "标准 Connector 支持软件安装信息。有 SAM 时优先落 cmdb_sam_sw_install；无 SAM 时使用 Software Instance/Software。":
    "標準 Connector はソフトウェアインストール情報をサポートする。SAM ありの場合は cmdb_sam_sw_install、SAM なしの場合は Software Instance / Software を使用する。",
  "标准目标字段明确包含 version。":
    "標準ターゲット項目に version が明記されている。",
  "标准目标字段明确包含 publisher；无 SAM 时可由 Software 表的 vendor/manufacturer 承接。":
    "標準ターゲット項目に publisher が明記されている。SAM なしの場合は Software テーブルの vendor / manufacturer が候補となる。",
  "标准目标字段明确包含 install_date；源值是否存在取决于 MECM 库存数据。":
    "標準ターゲット項目に install_date が明記されている。ソース値の有無は MECM インベントリデータに依存する。",
  "标准目标字段 installed_on 引用 Computer CI。ResourceID 到 CI 的匹配由 Connector/IRE 映射处理。":
    "標準項目 installed_on は Computer CI を参照する。ResourceID と CI の照合は Connector / IRE マッピングで処理される。",
  "软件安装信息可标准落表，但 AV 健康、指定产品和生命周期判定不在标准目标字段中。":
    "ソフトウェアインストール情報は標準格納できるが、AV ヘルス、指定製品、ライフサイクル判定は標準ターゲット項目ではない。",
  "产品安装信息可标准落表；移行期限和阶段是客户维护的业务规则。":
    "製品インストール情報は標準格納できる。移行期限と段階は顧客が管理する業務ルールである。",
  "AutoProtect 是产品依赖的健康/策略字段，标准 SG-SCCM CMDB 目标字段未覆盖。":
    "AutoProtect は製品依存のヘルス / ポリシー項目であり、標準 SG-SCCM CMDB ターゲット項目の対象外である。",
  "MECM Endpoint Protection 可提供健康信息，但标准 SG-SCCM CMDB 目标字段未覆盖定义文件与健康状态。":
    "MECM Endpoint Protection はヘルス情報を提供できるが、標準 SG-SCCM CMDB ターゲット項目は定義ファイルとヘルス状態を対象としていない。",
  "MECM 能提供扫描健康信息，但标准 SG-SCCM 目标字段没有 AV 扫描历史。":
    "MECM はスキャンヘルス情報を提供できるが、標準 SG-SCCM ターゲット項目に AV スキャン履歴はない。",
  "标准 SG-SCCM 可导入 Disk 身份信息；须能与加密 View 中的卷对应。":
    "標準 SG-SCCM は Disk の識別情報を取り込める。暗号化 View のボリュームとの対応付けが必要である。",
  "标准目标字段明确包含磁盘容量。":
    "標準ターゲット項目にディスク容量が明記されている。",
  "标准目标字段明确包含 drive_type。":
    "標準ターゲット項目に drive_type が明記されている。",
  "标准 cmdb_ci_disk 目标字段没有加密保护状态。":
    "標準 cmdb_ci_disk ターゲット項目に暗号化保護状態はない。",
  "标准 cmdb_ci_disk 目标字段没有转换状态。":
    "標準 cmdb_ci_disk ターゲット項目に変換状態はない。",
  "标准 cmdb_ci_disk 目标字段没有加密方法。":
    "標準 cmdb_ci_disk ターゲット項目に暗号化方式はない。",
  "MECM 可收集 TPM，但 SG-SCCM 标准目标类清单未列 TPM 目标表/字段。":
    "MECM は TPM を収集できるが、SG-SCCM 標準ターゲットクラス一覧に TPM のターゲットテーブル / 項目はない。",
  "这是合规判定结果，应落自定义安全发现表。":
    "コンプライアンス判定結果であり、カスタムセキュリティ発見テーブルへ格納する。",
  "标准 Connector 能导入软件安装信息，但客户定义的不适切分类、风险等级和最终判定没有标准 CMDB 字段。":
    "標準 Connector はソフトウェアインストール情報を取り込めるが、顧客定義の不適切分類、リスクレベル、最終判定に対応する標準 CMDB 項目はない。",
  "软件安装信息可标准落表；支持结束和移行判定不是 MECM 原始库存字段。":
    "ソフトウェアインストール情報は標準格納できる。サポート終了および移行判定は MECM の原始インベントリ項目ではない。",
};

function translateCandidate(value) {
  if (typeof value !== "string") return value;
  const exact = {
    "客户生命周期主数据中的 EOL Date":
      "顧客ライフサイクルマスタの EOL Date",
    "由 OS 名称、版本与生命周期主数据计算":
      "OS 名、バージョン、ライフサイクルマスタから算出",
    "客户生命周期主数据中的 Migration Due Date":
      "顧客ライフサイクルマスタの Migration Due Date",
    "Migration Due Date - 判定日": "Migration Due Date - 判定日",
    生命周期规则计算结果: "ライフサイクルルールの算出結果",
    "客户生命周期主数据中的 Stage":
      "顧客ライフサイクルマスタの Stage",
    "OS 名称/版本与生命周期主数据匹配结果":
      "OS 名 / バージョンとライフサイクルマスタの照合結果",
    "判定日 - 补丁发布日期；结合 Compliance Status":
      "判定日 - パッチ公開日（Compliance Status と組み合わせ）",
    "Name='Guest' 且 Enabled=true": "Name='Guest' かつ Enabled=true",
    "启用状态 + 密码保护 + 超时规则":
      "有効状態 + パスワード保護 + タイムアウトルール",
    "策略值 + 扫描状态的判定结果":
      "ポリシー値 + スキャン状態の判定結果",
    "服务清单匹配 + State='Running'":
      "サービスリスト照合 + State='Running'",
    "ResourceID（用于关联设备）": "ResourceID（端末関連付け用）",
    "安装产品与客户指定 AV 清单的比较结果":
      "インストール製品と顧客指定 AV リストの比較結果",
    "产品版本与生命周期主数据匹配结果":
      "製品バージョンとライフサイクルマスタの照合結果",
    "软件库存 + AV 健康状态 + 客户规则":
      "ソフトウェアインベントリ + AV ヘルス状態 + 顧客ルール",
    "客户 AV 生命周期主数据中的 Stage":
      "顧客 AV ライフサイクルマスタの Stage",
    "客户 AV 生命周期主数据中的 Due Date":
      "顧客 AV ライフサイクルマスタの Due Date",
    "Due Date - 判定日": "Due Date - 判定日",
    "产品名/版本与生命周期主数据的匹配结果":
      "製品名 / バージョンとライフサイクルマスタの照合結果",
    "实时保护值 + 产品策略规则":
      "リアルタイム保護値 + 製品ポリシールール",
    "判定日 - 定义文件最后更新时间":
      "判定日 - 定義ファイル最終更新日時",
    "经过天数 >= 客户阈值": "経過日数 >= 顧客しきい値",
    "判定日 - LastScanTime": "判定日 - LastScanTime",
    "TPM 属性（候选）": "TPM 属性（候補）",
    "ProtectionStatus + 客户判定规则":
      "ProtectionStatus + 顧客判定ルール",
    "软件名/版本与客户禁止清单的匹配结果":
      "ソフトウェア名 / バージョンと顧客禁止リストの照合結果",
    "客户规则固定/计算为 High": "顧客ルールにより High と固定 / 算出",
    "已安装软件 + 禁止清单 + 风险等级":
      "インストール済みソフトウェア + 禁止リスト + リスクレベル",
    "客户规则固定/计算为 Medium":
      "顧客ルールにより Medium と固定 / 算出",
    "客户规则固定/计算为 Low": "顧客ルールにより Low と固定 / 算出",
    "客户产品生命周期主数据中的 Stage=EOL":
      "顧客製品ライフサイクルマスタの Stage=EOL",
    "客户产品生命周期主数据中的 Date":
      "顧客製品ライフサイクルマスタの Date",
    "期限日 - 判定日": "期限日 - 判定日",
    "软件名/版本与生命周期主数据匹配结果":
      "ソフトウェア名 / バージョンとライフサイクルマスタの照合結果",
    "客户产品生命周期主数据中的 Stage=Warning":
      "顧客製品ライフサイクルマスタの Stage=Warning",
    "客户产品生命周期主数据中的 Stage=Migration":
      "顧客製品ライフサイクルマスタの Stage=Migration",
  };
  if (exact[value]) return exact[value];
  return value
    .replaceAll("（候选）", "（候補）")
    .replaceAll("候选", "候補")
    .replaceAll("（产品依赖）", "（製品依存）");
}

function translateField(value) {
  if (typeof value !== "string") return value;
  return value
    .replaceAll("或 vendor/manufacturer", "または vendor / manufacturer")
    .replaceAll("或 name", "または name");
}

function translateRow(row) {
  return [
    row[0],
    categoryMap[row[1]] ?? row[1],
    issueMap[row[2]] ?? row[2],
    infoMap[row[3]] ?? row[3],
    translateCandidate(row[4]),
    sourceMap[row[5]] ?? row[5],
    tableMap[row[6]] ?? row[6],
    translateField(row[7]),
    row[8],
    reasonMap[row[9]] ?? row[9],
    evidenceMap[row[10]] ?? row[10],
    row[11],
  ];
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
  const wb = await SpreadsheetFile.importXlsx(await fs.readFile(workbookPath));
  const sourceSheet = wb.worksheets.getItem("11_字段落表矩阵_CN");
  const sourceRows = sourceSheet.getRange("A11:L191").values;
  const rows = sourceRows.map(translateRow);

  const existingSheet = wb.worksheets.getItemOrNullObject(
    "12_フィールド格納マトリクス_JP",
  );
  if (!existingSheet.isNullObject) existingSheet.delete();
  const sheet = wb.worksheets.add("12_フィールド格納マトリクス_JP");
  sheet.showGridLines = false;
  setWidths(sheet, [48, 145, 225, 205, 235, 260, 250, 220, 78, 410, 175, 440]);

  sheet.getRange("A1:L1").merge();
  sheet.getRange("A1").values = [[
    "MECM セキュリティ指摘 23 項目：取得フィールドと ServiceNow 標準格納可否 O/X マトリクス",
  ]];
  sheet.getRange("A1:L1").format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, fontSize: 16 },
    verticalAlignment: "middle",
    horizontalAlignment: "left",
  };
  sheet.getRange("1:1").format.rowHeightPx = 44;

  sheet.getRange("A3:L5").merge();
  sheet.getRange("A3").values = [[
    "判定基準：O = ServiceNow 公式の SG-SCCM ターゲットクラス資料に標準ターゲットテーブル / 項目が明記されている。X = MECM では取得可能でも標準 Connector に対応項目がない、または顧客のライフサイクル・コンプライアンス・リスクルールによる算出結果である。O はすべての環境で値が必ず格納されることを意味しない。顧客環境の IntegrationHub ETL Data Map、プラグイン / SAM の有無、MECM の実インベントリ列を確認する。確認日：2026-06-24。",
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
  sheet.getRange("A7:F8").values = [
    [
      "フィールド行数",
      rows.length,
      "O：標準格納可能",
      oCount,
      "X：標準では直接格納不可",
      xCount,
    ],
    [
      "要点",
      "端末 / OS / ソフトウェアインストール / ディスク識別情報などの基本資産項目は一部標準格納可能。一方、23 項目のセキュリティ指摘における最終判定の多くは、カスタムのセキュリティ発見またはコンプライアンステーブルで管理する必要がある。",
      "",
      "",
      "",
      "",
    ],
  ];
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
  sheet.getRange("7:8").format.rowHeightPx = 38;

  const headers = [
    "#",
    "分類",
    "指摘内容",
    "具体的な取得情報",
    "想定 MECM 項目 / 属性",
    "MECM ソース",
    "ServiceNow 標準テーブル",
    "ServiceNow 標準フィールド",
    "標準格納可否\nO / X",
    "判定根拠",
    "根拠レベル",
    "参考資料 URL",
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
    if (rows[index][0] !== previousNo) {
      useBlue = !useBlue;
      previousNo = rows[index][0];
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
    sheet.getRange(`${excelRow}:${excelRow}`).format.rowHeightPx = 84;
  }
  sheet.getRange(`${startRow}:${startRow}`).format.rowHeightPx = 54;
  sheet.freezePanes.freezeRows(startRow);

  const formulaErrors = await wb.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 200 },
  });
  await fs.writeFile(
    workbookPath + ".formula_errors.ndjson",
    formulaErrors.ndjson || "",
    "utf8",
  );

  const inspect = await wb.inspect({
    kind: "table",
    range: `12_フィールド格納マトリクス_JP!A1:L${endRow}`,
    tableMaxRows: 25,
    tableMaxCols: 12,
    maxChars: 40000,
  });
  await fs.writeFile(
    workbookPath + ".jp.inspect.ndjson",
    inspect.ndjson || "",
    "utf8",
  );

  const preview = await wb.render({
    sheetName: "12_フィールド格納マトリクス_JP",
    range: "A1:L36",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(__dirname, "preview_12_フィールド格納マトリクス_JP.png"),
    new Uint8Array(await preview.arrayBuffer()),
  );

  const xlsx = await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(workbookPath);
  console.log(
    JSON.stringify({
      workbookPath,
      sheets: wb.worksheets.items.map((item) => item.name),
      matrixRows: rows.length,
      oCount,
      xCount,
    }),
  );
}

await build();
