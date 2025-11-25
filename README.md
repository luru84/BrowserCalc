# BrowserCalc (Vue + TypeScript)

Web電卓をブラウザで動かすフロントエンド実装。Vue 3 + Vite + TypeScript で構成しています。

## 前提
- Node.js 18+ / npm
- Git / GitHub アカウント

## クイックスタート
```bash
make setup   # npm install
make dev     # 開発サーバ（Vite）
make test    # vitest（ロジックのユニットテスト）
make lint    # ESLint
make typecheck # vue-tsc
make build   # 本番ビルド
```

## ローカル利用とビルド
- 開発サーバ: `make dev` 実行後、ブラウザで `http://localhost:5173/` を開く。
- 本番ビルド: `make build`。ローカル確認は `npm run preview`。
- 主な機能: 逐次計算/式評価モード、税計算（税率設定）、パーセント、メモリ、履歴、キーボード操作、テーマ/表示設定、PWAオフライン。

## テスト
- ユニット: `make test`
- Lint/型: `make lint`, `make typecheck`
- 手動/E2Eチェック: `docs/EVALUATION.md` のシナリオに従う

## プロジェクト構成
```text
.
├─ src/
│  ├─ assets/              # スタイル
│  ├─ components/          # UIコンポーネント
│  ├─ lib/                 # 計算ロジック（逐次計算コア）
│  └─ main.ts              # エントリポイント
├─ docs/                   # 仕様・設計・計画
├─ .github/workflows/ci.yml
├─ package.json
├─ Makefile
└─ vite.config.ts
```

## ドキュメント
- 要件/設計: `docs/REQUIREMENTS.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`
- 計画/タスク: `docs/PLAN.md`, `docs/ISSUES.md`
- コーディング規約: `docs/CODING_GUIDELINES.md`
- ADR: `docs/ADR.md`
- エージェント向けガイド: `docs/AGENTS.md`

## デプロイ
- GitHub Pages: main ブランチへ push すると Actions（`.github/workflows/pages.yml`）でビルド・デプロイ。公開URLは `https://<user>.github.io/BrowserCalc/`（リポジトリ名に依存）。
- Vite base: `vite.config.ts` で `base: "/BrowserCalc/"` を設定済み。リポジトリ名が変わる場合は base も合わせて変更する。

## CI / コントリビューション
- CI: GitHub Actions（`.github/workflows/ci.yml`）で lint / typecheck / build / test を実行します。
- ブランチ: `feat/<topic>` などで作業し、main は常に動く状態を維持。
- 開発手順: `make setup && make test` でローカル確認のうえ PR を作成。

## メモ
- 以前の Python スケルトンは削除済みです。以降は Vue+TS を前提に開発してください。
