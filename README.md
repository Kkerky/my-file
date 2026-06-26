お世話になっております。
いただいた件、承知いたしました。
今回のDiscovery PoC環境で必要となるサブネット情報（CIDR）および、各サブネットへの配置予定リソースを整理しました。
以下の構成内容にて、ネットワーク作成の申請をお願いできますでしょうか。
■ サブネットおよびIPアドレス利用要件
1. vnet01 / Server & Network Device Zone
 CIDR: ⁠10.0.0.0/24⁠
 用途: サーバおよびネットワーク機器のDiscovery対象領域
 配置予定リソース（目安 約5〜6 IP）: Windows Server 2019/2022, RHEL, Palo Alto, FortiGate 等
2. vnet02 / MID & Linux Discovery Zone
 CIDR: ⁠172.16.0.0/24⁠
 用途: MID ServerおよびLinux/Nmap検証領域
 配置予定リソース（目安 約3〜4 IP）: Linux MID, Ubuntu, Ubuntu Multi-NIC (NIC1) 等
3. vnet03 / Client & ACC Zone
 CIDR: ⁠192.16.0.0/24⁠
 用途: Client / ACC検証領域
 配置予定リソース（目安 約2〜3 IP）: Windows 11, Ubuntu Multi-NIC (NIC2) 等
■ ネットワーク構成に関する補足
 上記の他、Windows MID ServerやBastion等の管理用リソースも上記VNetのいずれかに配置して利用する想定です。（合計の実利用IP数は12個程度となります）
 各サブネットにはNSGを1つずつ配置し、VNet（vnet01〜03）間はFull Mesh Peeringで通信できるよう設定をお願いいたします。
お手数をおかけしますが、上記の内容で申請を進めていただけますと幸いです。
ご不明な点などがございましたらお知らせください。よろしくお願いいたします。
