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

## CI / コントリビューション
- CI: GitHub Actions（`.github/workflows/ci.yml`）で lint / typecheck / build / test を実行します。
- ブランチ: `feat/<topic>` などで作業し、main は常に動く状態を維持。
- 開発手順: `make setup && make test` でローカル確認のうえ PR を作成。

## メモ
- 以前の Python スケルトンは削除済みです。以降は Vue+TS を前提に開発してください。
