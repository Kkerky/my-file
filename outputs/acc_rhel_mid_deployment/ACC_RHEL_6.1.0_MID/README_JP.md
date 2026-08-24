# ACC 6.1.0 RHEL 手動配布パッケージ（MID Server 接続方式）

## 1. 目的

本パッケージは、ACC の RPM とインストールスクリプトを RHEL 系 x86_64 ホストへ転送し、Linux 管理者が対象ホスト上でインストール、MID Server 接続設定、および ACC の起動を行うためのものです。

これは MECM のネイティブな Linux アプリケーション配布パッケージではありません。現在サポートされている MECM/Configuration Manager では Linux/UNIX クライアントが廃止されているため、Windows PC と同じ方式で RHEL 上のインストールを実行することはできません。お客様側のファイル転送、踏み台サーバー、運用ツールなどで資材を RHEL に配置した後、本スクリプトを実行する運用を想定しています。

## 2. 同梱物

- `agent-client-collector-6.1.0-x86_64.rpm`：ACC 6.1.0 RPM
- `install_acc.sh`：インストール、MID Server 接続設定、サービス起動
- `verify_acc.sh`：RPM、サービス、主要設定の確認
- `uninstall_acc.sh`：設定とバックアップを残したまま ACC を削除
- `config/01_servicenow`：ACC の基本収集用 sudoers サンプル
- `SHA256SUMS`：転送中に RPM が変更されていないことを確認

## 3. 前提条件

1. 対象 OS は RHEL または互換 RPM 系 OS、CPU は x86_64 であること。
2. root または sudo 権限を持つ管理者が実行すること。
3. 対象ホストから MID Server の ACC WebSocket ポートへ到達できること。既定ポートは通常 TCP 8800 です。
4. MID Server 側で ACC Listener/Web Server が有効であり、次の情報を準備できること。
   - MID WebSocket URL（例：`wss://10.0.0.10:8800/ws/events`）
   - ACC API Key
5. 本番環境で `wss` を使用する場合、対象ホストが MID Server のサーバー証明書を信頼していること。

## 4. 標準手順

```bash
tar -xzf ACC_RHEL_6.1.0_MID_ManualDeployment.tar.gz
cd ACC_RHEL_6.1.0_MID
sudo bash install_acc.sh
sudo bash verify_acc.sh
```

インストール時に MID WebSocket URL と ACC API Key を入力します。API Key は画面に表示されず、配布パッケージにも保存されていません。

URL を先に指定する場合：

```bash
sudo bash install_acc.sh \
  --backend-url 'wss://10.0.0.10:8800/ws/events'
```

内部運用ツールで API Key を root 専用ファイルとして安全に配置できる場合：

```bash
sudo bash install_acc.sh \
  --backend-url 'wss://10.0.0.10:8800/ws/events' \
  --api-key-file /root/acc-api-key.txt
```

インストール後、当該一時 Key ファイルは安全に削除してください。

## 5. PoC の自己署名証明書

既定では TLS 証明書を検証します。PoC の MID Server が対象ホストで未信頼の自己署名証明書を使用している場合のみ、次のオプションを一時的に使用できます。

```bash
sudo bash install_acc.sh \
  --backend-url 'wss://10.0.0.10:8800/ws/events' \
  --insecure-skip-tls-verify
```

この設定は証明書検証を無効にするため、隔離された PoC に限定してください。本番環境では信頼済み証明書を導入し、`insecure-skip-tls-verify` を `false` に戻す必要があります。

## 6. 確認とトラブルシューティング

```bash
sudo bash verify_acc.sh
sudo systemctl status acc --no-pager
sudo journalctl -u acc.service -n 100 --no-pager
```

ServiceNow 側でも ACC Agent/MID のレコードおよび接続状態を確認してください。Linux サービスが active であることだけでは、ServiceNow への接続や CI 更新の完了を証明できません。

## 7. セキュリティおよび変更管理上の注意

- API Key をスクリプト、MECM の引数、Git、一般共有フォルダーに記載しないでください。
- `config/01_servicenow` は ServiceNow 公式の Linux ACC インストール手順を基にした基本 sudoers サンプルです。本番導入前に Linux/セキュリティ担当者の承認が必要です。
- 本パッケージでは ACC 自動アップグレード用の全コマンド権限を追加していないため、自動アップグレードの検証済みとは扱わないでください。
- `SHA256SUMS` は本パッケージ作成時から RPM が変わっていないことだけを確認します。ServiceNow の配布元署名検証の代替にはなりません。本番配布前に RPM signatures も取得し、公式手順で確認してください。
- まず 1 台でテストし、その後に少数展開、最後に対象を拡大してください。

## 8. RPM SHA-256

`CF0A4A4EAB70CFF19E03BF59A9CAD68FDA75E53F57EA81915001B39109C4D221`

## 9. 公式参考資料

- [ServiceNow: Install ACC on Linux](https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/install-acc-linux.html)
- [ServiceNow: Configure ACC with a MID Server](https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/configure-acc-with-mid.html)
- [ServiceNow: Configure the ACC web server on a MID Server](https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/acc-configure-web-server.html)
- [ServiceNow: ACC deployment checklist](https://www.servicenow.com/docs/r/it-operations-management/agent-client-collector/acc-deployment-checklist.html)
- [Microsoft: Removed and deprecated Configuration Manager client features](https://learn.microsoft.com/en-us/intune/configmgr/core/plan-design/changes/deprecated/removed-and-deprecated-client)
