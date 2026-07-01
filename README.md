**中文版**

本次调查结论如下：

1. 公司 Azure 环境采用 Hub-and-Spoke 架构。  
   `P5230-Spoke-VNET001` 是本次 PoC 使用的 Spoke VNet，Hub/GWAN/Firewall 等基础网络由公司侧管理。

2. 当前账号可操作 IaaS/PaaS 资源，例如 VM、部分 NSG、NIC 等。  
   但路由、Hub、GWAN、基础网络变更不允许用户自行修改。

3. Palo Alto / FortiGate 在本次 PoC 中应作为 ServiceNow Discovery 的验证对象，而不是作为真实网络路径上的防火墙使用。

4. 已在公司 Azure 账号中验证：
   - Palo Alto VM-Series Next Generation Firewall 可进入创建向导，Review + Create 验证成功。
   - Fortinet FortiGate-VM PAYG 可进入创建向导，Review + Create 验证成功。
   - 尚未实际点击 Create，未创建资源。

5. 因此，当前看起来不存在明显的 RBAC / Azure Policy / Marketplace 创建阻断。  
   但正式创建前仍需确认费用、Marketplace 条款、许可证/试用条件，以及是否允许实际部署。

6. MID Server / ACC Agent 的安装作业本身属于客户作业范围。  
   但如果安装包下载、ServiceNow 连接、Discovery 扫描通信被 URL Filter、NSG 或 Firewall 阻断，则需要申请通信放通。

7. 需要重点确认的通信包括：
   - MID Server VM → ServiceNow Instance：HTTPS 443
   - MID Server VM → 安装包下载地址：HTTPS 443
   - MID Server → Windows / Linux / Palo Alto / FortiGate：Discovery 所需端口

---

**日本語版**

今回の調査結果は以下の通りです。

1. 会社の Azure 環境は Hub-and-Spoke 構成である。  
   `P5230-Spoke-VNET001` は今回の PoC 用 Spoke VNet であり、Hub / GWAN / Firewall などの基盤ネットワークは会社側で管理される。

2. 現在のアカウントでは IaaS / PaaS リソースの操作が可能である。  
   例：VM、NIC、一部 NSG など。  
   一方で、ルーティング、Hub、GWAN、基盤ネットワークの変更はユーザ側では実施不可。

3. Palo Alto / FortiGate は、本 PoC では ServiceNow Discovery の検証対象として扱う。  
   実際の通信経路上の Firewall としては利用しない。

4. 会社 Azure アカウントで以下を確認済み。
   - Palo Alto VM-Series Next Generation Firewall は作成ウィザードに進め、Review + Create の検証に成功。
   - Fortinet FortiGate-VM PAYG も作成ウィザードに進め、Review + Create の検証に成功。
   - 実際の Create は未実施であり、リソースは作成していない。

5. 現時点では、RBAC / Azure Policy / Marketplace レベルの明確な作成ブロックは見られない。  
   ただし、正式作成前に費用、Marketplace 条項、ライセンス/試用条件、実際のデプロイ可否を確認する必要がある。

6. MID Server / ACC Agent のインストール作業自体は顧客作業範囲に該当する。  
   ただし、インストーラ取得、ServiceNow 接続、Discovery 通信が URL Filter / NSG / Firewall により制限される場合は、通信許可申請が必要。

7. 特に確認すべき通信は以下。
   - MID Server VM → ServiceNow Instance：HTTPS 443
   - MID Server VM → インストーラ配布元：HTTPS 443
   - MID Server → Windows / Linux / Palo Alto / FortiGate：Discovery に必要な各ポート
   - 
