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
