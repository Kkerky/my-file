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
