# my-file
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">① システム一覧画面 (System Asset List)</h3>
  </div>

  <div class="panel-body">
    <div class="search-container well">
      <div class="row">
        <div class="col-md-4">
          <label>アカウントID (Account ID)</label>
          <input type="text" class="form-control" ng-model="c.filter.account_id">
        </div>
        <div class="col-md-4">
          <label>アカウント名 (Account Name)</label>
          <input type="text" class="form-control" ng-model="c.filter.account_name">
        </div>
        <div class="col-md-4">
          <button class="btn btn-primary" ng-click="c.search()">検索 (Search)</button>
          <button class="btn btn-success pull-right" ng-click="c.addItem()">追加 (Add)</button>
        </div>
      </div>
      <div class="row" style="margin-top: 10px;">
        <div class="col-md-4">
          <label>システム名 (System Name)</label>
          <input type="text" class="form-control" ng-model="c.filter.system_name">
        </div>
        <div class="col-md-4">
          <label>サブシステム名 (Subsystem Name)</label>
          <input type="text" class="form-control" ng-model="c.filter.subsystem_name">
        </div>
      </div>
    </div>

    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th style="width: 50px;">No</th>
          <th>アカウントID</th>
          <th>世代</th>
          <th>システム名</th>
          <th>サブシステム名</th>
          <th style="width: 250px;">Action</th> </tr>
      </thead>
      <tbody>
        <tr ng-repeat="item in c.data.items">
          <td>{{$index + 1}}</td>
          <td>{{item.account_id}}</td>
          <td>{{item.generation}}</td>
          <td>{{item.system_name}}</td>
          <td>{{item.subsystem_name}}</td>
          <td>
            <button class="btn btn-info btn-xs" ng-click="c.openDetail(item.sys_id)">詳細</button>
            <button class="btn btn-danger btn-xs" ng-click="c.deleteItem(item)">削除</button>
            <button class="btn btn-default btn-xs" ng-click="c.openDiagram(item.ppt_url)">概要図</button>
          </td>
        </tr>
        <tr ng-if="c.data.items.length == 0">
          <td colspan="6" class="text-center">No data found</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

データの入力漏れ（未入力）に対する2つの対策案について、その概要と実現方法をまとめた日本語版資料です。

---

### 案1：予防的措置（推奨）

**基本方針：** 入力画面でブロックし、未入力のままでは保存させない（強制力を持たせる）。

* **実現の仕組み：**
* 対象フィールドをシステム的に**「必須項目（Mandatory）」**に設定する。


* **具体的な実装方法：**
* **UI Policy**（画面制御）または **Data Policy**（データ制御）を設定する。
* 条件設定で「常に」、または「特定のステータスになった時」に対象フィールドを必須（Mandatory = True）にする。


* **効果・メリット：**
* 入力欄に赤いアスタリスク（*）が表示される。
* オペレーターが未入力のまま保存ボタンを押すと、エラーメッセージが表示され**提出がブロックされる**。
* **メリット：** データの完全性が100%保証され、後から入力を依頼する連絡コストがゼロになる。



---

### 案2：通知による事後措置（ご要望の案）

**基本方針：** 空欄での保存を許容するが、システムが検知してメールで督促・通知を行う。

* **実現の仕組み：**
* データの作成・更新をバックグラウンドで監視し、未入力を検知した瞬間に自動メール送信フローを走らせる。


* **具体的な実装方法：**
* **Flow Designer**（推奨）または **System Notification** を使用する。
* **トリガー（Trigger）：** データが「作成」または「更新」された時。
* **条件（Condition）：** 対象フィールドが「空（Is Empty）」である場合。
* **アクション（Action）：** 事前に用意したテンプレートメールを送信する。
* *宛先：* そのデータの「作成者（Created by）」や「承認グループのマネージャー」を動的に指定可能。




* **効果・メリット：**
* データ自体は保存できる。
* 保存の数秒後に、担当者や管理者に「入力漏れがあります」という通知メールが届く。
* **適用シーン：** 「現時点では情報が不明だが、とりあえずレコードを作成しておきたい」という業務フローの場合に有効。

* はい、**可能です。**
「瞬間的（リアルタイム）」ではなく、**「一定期間（猶予期間）待ってから、それでも未入力の場合に通知する」**という設計は、ServiceNowでよく使われる実装パターンです。

これを**「リマインダー通知（Reminder）」**や**「エスカレーション（Escalation）」**と呼びます。

以下に、その実装イメージとメリットをまとめました。

---

### 修正案2：通知による事後措置（猶予期間あり）

**基本方針：**
保存時はエラーを出さず、入力のための「猶予期間（例：3日間）」を与える。期限を過ぎても未入力のまま放置されている場合のみ、督促メールを送信する。

#### 実装パターンA：Flow Designerの「待機」機能を使う（推奨）

個別のレコードごとにタイマーをセットする方法です。

1. **トリガー：** データが作成された時（かつ必須項目が空欄の時）。
2. **アクション（待機）：** フローを一時停止し、**指定時間（例：3日間）待機させる**。
* *（ServiceNowの `Wait for a duration` アクションを使用）*


3. **再チェック（IF条件）：** 3日経過後、**「まだその項目が空欄のままか？」**をシステムが再確認する。
* **入力済みの場合：** 何もせずフロー終了（メールは送らない）。
* **未入力の場合：** ここで初めて「期限切れ通知メール」を送信する。



#### 実装パターンB：Scheduled Job（定期実行）を使う

毎日決まった時間に一括チェックする方法です。

1. **スケジュール：** 毎日 朝9:00 にシステムが自動巡回する。
2. **スクリプト条件：** 「作成日からXX日以上経過している」かつ「必須項目が空欄」のデータを全て抽出する。
3. **アクション：** 対象データの担当者に対し、「未入力リスト」としてまとめてメールを送る。

---

### この変更によるメリット

* **「とりあえず保存」が可能になる：**
情報を調査中の段階でレコードを作成しても、即座に警告メールが飛んでこないため、オペレーターに精神的なプレッシャーを与えません。
* **オオカミ少年化を防ぐ：**
「保存した瞬間に修正しようと思っていたのにメールが来た」というような、不要なノイズメールを減らすことができます。本当に忘れている時だけ通知が来ます。

---

ご提案の通り、現場の運用フローとしては**「即時通知」よりも「数日後のリマインダー」の方が親切で受け入れられやすい**ケースが多いです。資料には「即時通知型」と「猶予型（リマインダー）」のどちらも選択可能である旨を記載しておくと良いでしょう。
