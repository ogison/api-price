# API Price Comparison

LLM API の料金を比較するための Web アプリケーションです。OpenAI、Google (Vertex AI)、Anthropic の各モデルの料金を一覧・比較できます。

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## Scripts

```bash
pnpm dev            # 開発サーバー起動
pnpm build          # プロダクションビルド
pnpm start          # プロダクションサーバー起動
pnpm lint           # リント実行
pnpm typecheck      # 型チェック（tsc --noEmit）
pnpm test           # ユニットテスト（Vitest）
pnpm format         # コードフォーマット
pnpm format:check   # フォーマット検証
pnpm update-pricing # 料金データ更新
```

CI（`.github/workflows/ci.yml`）では lint → typecheck → format:check → test → build を実行します。

## 環境変数

| 変数                   | 用途                                                                                   | デフォルト              |
| ---------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | canonical / sitemap / robots / OGP の絶対 URL に使う公開オリジン（末尾スラッシュなし） | `http://localhost:3000` |

`.env.example` を参考に `.env.local` を作成してください。

## プロジェクト構成

```
src/
  app/                  # App Router（page / layout / error / sitemap / robots / manifest / opengraph-image）
  components/features/  # 機能別コンポーネント（pricing 一式）
  components/ui/         # shadcn/ui ベースの汎用 UI
  context/              # 通貨コンテキスト（為替換算・永続化）
  hooks/                # 汎用フック（localStorage 永続化など）
  lib/constants/        # 料金データ・プロバイダ・為替レート・サイト情報
  lib/helpers/          # 価格/日付フォーマット・コスト計算
scripts/update-pricing/ # 料金データ自動更新パイプライン
```

## データ更新パイプライン

`pnpm update-pricing`（および GitHub Actions の `Update Pricing Data`）は以下の流れで料金データを更新します。

1. **fetch** — `fetchers/` が各社（OpenAI / Anthropic / Google）の公式料金ページと為替レートを取得。
2. **merge** — `merge.ts` が `modelKey`（区切り文字・大小文字を正規化したキー）で既存データと突き合わせ、価格のみ更新しつつ表示名・メタデータを保持。取得失敗したプロバイダは既存データを維持。
3. **validate** — `validate.ts`（zod）がスキーマ・重複キー・プロバイダ別件数・価格変動異常を検証。
4. **diff & PR** — 差分レポートを生成し、変更があれば `automated/pricing-update` ブランチへ PR を作成。失敗時は Issue を自動起票。

詳細なセットアップは [Pricing update ワークフロー](./docs/pricing-update-workflow.md) を参照してください。

## コントリビュート

変更後は必ず以下を実行し、すべて成功することを確認してください。

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## ドキュメント

- [Pricing update ワークフローのセットアップ](./docs/pricing-update-workflow.md) — 定期実行ワークフローの設定手順。
- [機能提案](./docs/feature-proposals.md) — 今後の機能アイデア。

## License

[MIT](./LICENSE)
