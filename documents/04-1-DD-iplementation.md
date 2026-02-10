参考文献
- 公式リファレンス：
    - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.TableV2.html
    - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html
- Qiita : https://qiita.com/yamato1491038/items/f388afa3aa4f701321f5

---

## 主な設定項目

`TableV2` では、プライバリテーブルに対して様々な詳細設定が可能である。以下は、主要なオプションを組み合わせた例である。

* **partitionKey**: パーティションキーの名前と型を指定する（必須）。
* **tableClass**: ストレージクラスを指定する（例: `STANDARD_INFREQUENT_ACCESS`）。
    ![alt text](/documents/assets/images/DD-strage-class.png.png)
* **contributorInsightsSpecification**: 頻繁にアクセスされるキーなどを特定する CloudWatch Contributor Insights の有効化設定。
* **pointInTimeRecoverySpecification**: ポイントインタイムリカバリ（PITR）の有効化設定。

partitionKeyのみを指定すればよさそう
(ストレージはstandardでいいし、頻繁に利用するアクセスキーなdの設定も不要)
sortkeyやその他の属性はどうやって設定するんだろう

---




---

## グローバルテーブルとレプリカ (Replicas)
--> コスト面から今回は不要であると判断

`TableV2` を使用すると、複数の AWS リージョンにデータをコピーするグローバルテーブルを容易に構築できる。

### レプリカの設定ルール

* **リージョンの明示**: `TableV2` を定義するスタックには、特定のリージョン（`env: { region: 'us-west-2' }` など）が定義されている必要がある。
* **プライバリリージョンの扱い**: `TableV2` を定義したメインのリージョンはデフォルトで作成されるため、`replicas` リストに含めてはならない。
* **追加方法**:
* コンストラクタのプロパティとして `replicas` 配列を渡す。
* デプロイ後に `addReplica` メソッドを使用して単一のレプリカを追加する。



### レプリカごとの個別設定

以下のプロパティは、レプリカごとに個別の値を設定できる。指定しない場合はプライバリテーブルの設定を継承する。

* `contributorInsightsSpecification`
* `deletionProtection`（削除保護）
* `pointInTimeRecoverySpecification`
* `tableClass`
* `readCapacity`（請求モードが `PROVISIONED` の場合のみ）
* `globalSecondaryIndexes` (GSI) の一部の設定

---
