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
pnpm format         # コードフォーマット
pnpm update-pricing # 料金データ更新
```

## メンテナンス

- [Pricing update ワークフローのセットアップ](./docs/pricing-update-workflow.md) — 定期実行ワークフロー `Update Pricing Data` から PR を作成するために必要な設定手順。

## License

[MIT](./LICENSE)
