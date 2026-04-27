# Pricing Update ワークフローのセットアップ

`.github/workflows/update-pricing.yml` はスケジュール実行で `pnpm tsx scripts/update-pricing/index.ts` を実行し、料金データに変更があれば [`peter-evans/create-pull-request`](https://github.com/peter-evans/create-pull-request) を使って Pull Request を自動作成します。

ワークフローには必要な `permissions:`（`contents: write`、`pull-requests: write`）が既に設定されていますが、直近の実行では `Create Pull Request` ステップで以下のエラーが発生しています:

```
GitHub Actions is not permitted to create or approve pull requests.
HttpError: Resource not accessible by integration
```

これはワークフローファイルの中からは解除できないリポジトリレベルの制限です。組織のポリシーに合わせて、以下の **A** または **B** のどちらかを適用してください。

## オプション A（推奨）: GitHub Actions に PR 作成を許可する

1. **Settings → Actions → General → Workflow permissions** を開く。
2. **「Allow GitHub Actions to create and approve pull requests」** にチェックを入れる。
3. 設定を保存する。

設定後はデフォルトの `GITHUB_TOKEN` のまま PR が作成できるようになり、コード側の変更は不要です。次回のスケジュール実行または手動実行で復旧します。

## オプション B: Personal Access Token (PAT) を使う

組織のポリシー上、オプション A の設定を有効化できない場合は PAT を利用します。

1. このリポジトリに対して `Contents: Read and write` と `Pull requests: Read and write` を付与した fine-grained PAT を発行する（`repo` スコープを持つクラシック PAT でも可）。
2. **Settings → Secrets and variables → Actions → New repository secret** から `PRICING_PR_TOKEN` という名前のリポジトリシークレットとして登録する。
3. `.github/workflows/update-pricing.yml` の `Create Pull Request` ステップで、PAT があればそれを優先するように `token:` を書き換える:

   ```yaml
   - name: Create Pull Request
     if: steps.update.outputs.has_changes == 'true'
     uses: peter-evans/create-pull-request@v7
     with:
       token: ${{ secrets.PRICING_PR_TOKEN || secrets.GITHUB_TOKEN }}
       branch: automated/pricing-update
       title: 'chore: update pricing data'
       body-path: /tmp/update-report.txt
       labels: pricing-update,automated
       commit-message: 'chore: update pricing data from official sources'
   ```

   `||` でフォールバックさせているので、後からオプション A を有効化した環境でもそのまま動作します。

## 動作確認

1. **Actions → Update Pricing Data → Run workflow** からワークフローを手動実行する。
2. 料金データに差分があれば、`Resource not accessible by integration` のエラーが出ずに `automated/pricing-update` ブランチへ PR が作成されることを確認する。
3. 料金データに差分がない場合は `Create Pull Request` ステップがスキップされる。これは正常な挙動で、失敗ではない。
