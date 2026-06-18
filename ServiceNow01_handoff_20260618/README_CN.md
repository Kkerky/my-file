# Snow02 Git 交接包

生成时间：2026-06-18

用途：
本目录用于把 `C:\ServiceNow01` 中已经生成的 ServiceNow / Azure Discovery PoC 资料整理后提交到 Snow02 的 Git 仓库，方便之后用手机版 Codex 或远程 Codex 继续调查、修改和生成资料。

当前状态：
- 资料已整理到本目录。
- 当前 `C:\ServiceNow01` 不是 Git 仓库。
- 当前桌面环境里暂未定位到名为 `Snow02` 的本地 Git 工作目录。
- 本机 Git 已安装，但不在当前 PowerShell PATH 中；可执行文件位置大概率为：
  `C:\Users\Admin\AppData\Local\Programs\Git\cmd\git.exe`

重点资料：
- `outputs/azure_discovery_poc/ServiceNow_Discovery_PoC_方案B_3VNet_PaloAlto防火墙经由_Azure搭建指南_中文版.xlsx`
- `outputs/azure_discovery_poc/ServiceNow_Discovery_PoC_案B_3VNet_PaloAltoファイアウォール経由_Azure構築ガイド_日本語版.xlsx`
- `outputs/azure_discovery_poc/ServiceNow_Discovery_PoC_方案B_PaloAlto前段控制_验证顺序与资源清单_中文版.xlsx`
- `outputs/azure_discovery_poc/ServiceNow_Discovery_PoC_案B_PaloAlto前段制御_検証順序とリソース一覧_日本語版.xlsx`
- `outputs/azure_discovery_poc/ServiceNow_Discovery_PoC_验证范围矩阵_美化版.pptx`
- `outputs/azure_discovery_poc/ServiceNow_Azure_Discovery_PoC_PaloAlto前段VLAN版.pptx`

建议 Git 提交信息：

```text
Add ServiceNow Azure Discovery PoC materials
```

如果 Snow02 本地仓库路径可用，建议操作：

```powershell
$git = "C:\Users\Admin\AppData\Local\Programs\Git\cmd\git.exe"
$src = "C:\ServiceNow01\outputs\git_handoff_snow02_20260618"
$repo = "<Snow02本地仓库路径>"
Copy-Item -LiteralPath "$src\*" -Destination $repo -Recurse -Force
& $git -C $repo status --short
& $git -C $repo add .
& $git -C $repo commit -m "Add ServiceNow Azure Discovery PoC materials"
& $git -C $repo push
```

明天用手机版 Codex 时可以这样说明：

```text
请基于 Git 仓库中的 ServiceNow/Azure Discovery PoC 资料继续调查。
当前重点是 3 VNet + Palo Alto 防火墙经由方案，MID Server 放在 VNet02/Mgmt-Hub，VNet01/VNet03 作为 Spoke，通过 VNet Peering、UDR、Palo Alto Policy 和回程路由实现 Discovery 流量经由防火墙。
```

注意：
- 不要把 `.inspect.ndjson`、`.formula_errors.ndjson`、预览 PNG、脚本 `.mjs/.py` 当作正式客户资料提交，除非以后需要追踪生成过程。
- 如果客户只看最终版，优先使用文件名中包含 `3VNet_PaloAlto` 的 Excel。
