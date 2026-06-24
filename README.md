
## 3. 実際に利用する可能性があるケース

### ケース1：顧客が独自開発したアプリケーション

顧客が社内向けに開発した`ABC Order Server`というアプリケーションを使用しているとします。

このアプリケーションには、次のような特徴があります。

- TCPポート：`18080`
- プロセス名：`abc_order`
- 設定ファイル：`/opt/abc/conf/app.properties`
- バージョン情報：独自コマンドから取得

ServiceNowに対応するOOTB Patternがない場合は、新しいApplication Patternを作成します。

TCPポート18080を確認
        ↓
abc_orderプロセスを特定
        ↓
起動コマンドと設定ファイルを解析
        ↓
バージョンとインストールパスを取得
        ↓
ABC Order ServerのApplication CIを作成・更新
```

### ケース2：OOTB Patternがない製品を使用している場合

顧客が、特定地域のベンダーが提供するミドルウェアや、利用者の少ない製品を使用している場合があります。

ServiceNowのAvailable Patternsに対象製品が存在しない場合は、以下の情報を組み合わせて新しいPatternを作成します。

- リスニングポート
- プロセス名
- 製品固有のコマンド
- 設定ファイル
- インストールパス
- バージョン情報

これにより、通常のDiscoveryでは識別できない製品をApplication CIとしてCMDBに登録できます。

### ケース3：OOTB Patternはあるが、顧客環境の構成が異なる場合

例えば、OOTB Patternが次の情報を使用してApacheを識別するとします。

```text
プロセス名：httpd
設定ファイル：/etc/httpd/conf/httpd.conf
```

一方、顧客環境では次のように変更されている可能性があります。

```text
プロセス名：company_web
設定ファイル：/opt/company/apache/conf/custom.conf
```

この場合、OOTB Patternが正常に動作しない可能性があります。

ただし、直ちに新しいPatternを作成するのではなく、Extension Section、Precondition、またはカスタマイズしたPatternを利用して、顧客固有の条件を追加する方法を優先して検討します。

### ケース4：OOTB Patternでは必要な属性を取得できない場合

OOTB PatternによってApache CIは作成できるものの、顧客が次の情報も必要としている場合があります。

- 顧客独自のインスタンス名
- 特定の設定値
- 業務で使用しているポート番号
- クラスタ番号
- 独自の設定ファイルに記載された情報

この場合は、既存Patternにコマンド実行や設定ファイル解析の処理を追加し、必要な属性を取得します。

アプリケーションの識別自体ができているため、Pattern全体を新しく作り直す必要はありません。

### ケース5：Horizontal DiscoveryとTop-down Discoveryの両方で使用したい場合

既存のApplication Patternが、Service MappingのEntry Pointを起点とするTop-down Discoveryでのみ使用されている場合があります。

対象のPattern、Classifier、CI Type、Identification Sectionなどの構成を確認し、Horizontal Discoveryからも利用できるようにすることで、両方の検出方式から同じApplication CIを更新できる可能性があります。

ただし、同じCIを更新できるかどうかは、CI Type、Classification、識別条件、Identification Ruleなどにも依存するため、実機での確認が必要です。

---

## 4. 利用時の注意点

OOTB Patternをカスタマイズすると、ServiceNowから提供される将来の更新内容が、そのままカスタマイズ部分に反映されない場合があります。

そのため、カスタマイズ前に次の内容を確認する必要があります。

- 本当にOOTB Patternでは対応できないか
- Patternの最新版が適用されているか
- 製品バージョンがサポート対象か
- 顧客固有のパスや設定だけが問題ではないか
- Extension Sectionで対応できないか
- カスタマイズ後の保守担当者が明確になっているか
- ServiceNowのアップグレード時に差分確認ができるか

新規作成やカスタマイズは可能ですが、その後のテスト、変更管理、バージョン管理も必要になります。

---

## 5. まとめ

本ドキュメントは、OOTB Patternが存在しない場合だけに使用する手順ではなく、Pattern DesignerによるApplication Patternの基本的な作成方法を、Apache Web Serverを例として説明したものです。

実際の導入では、まずServiceNowが提供するOOTB Patternの有無と適用可否を確認します。

OOTB Patternをそのまま利用できる場合は標準機能を優先し、一部の条件や取得属性だけが不足する場合は既存Patternの拡張またはカスタマイズを検討します。対応するPatternが存在しない場合に、新しいApplication Patternを作成します。

```text
第一選択：OOTB Patternをそのまま利用する
第二選択：既存Patternを拡張・カスタマイズする
第三選択：新しいPatternを作成する
```

この順序はServiceNowの強制ルールではありませんが、開発工数、保守負担およびアップグレード時の影響を抑えるための実務上の推奨方針です。

### 参考資料

- [アプリケーションパターンの作成例](https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_PatternExamplePatDef.html)
- [パターンの作成またはカスタマイズ](https://www.servicenow.com/docs/r/ja-JP/washingtondc/it-operations-management/discovery-and-service-mapping-patterns/t_CreatePatternPatDef.html)
- [利用可能なDiscoveryおよびService Mapping Pattern](https://www.servicenow.com/docs/r/it-operations-management/discovery-and-service-mapping-patterns/available-patterns.html)
