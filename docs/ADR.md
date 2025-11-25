# Architecture Decision Records

## ADR-001: Vue 3 + Vite + TypeScript のSPA（オフライン/PWA）
- Status: Accepted (2025-11-25)
- Context: ブラウザだけで完結する電卓を提供するため、外部APIやバックエンドを前提としない。高速な開発とビルド、オフライン/PWA対応、計算ロジックのテスト容易性が必要。
- Decision:
  - クライアントサイドSPAとして Vue 3 + TypeScript + Vite を採用する。
  - 計算ロジックは `src/lib` の純粋関数として実装し、UI層 (`src/components`) と分離する。
  - 設定やテーマはローカル永続（localStorage）に限定し、外部通信やバックエンド依存を置かない。
  - PWA対応（manifest + Service Worker）でオフライン利用を可能にする。
- Consequences:
  - 依存はフロントエンドのみで完結し、サーバサイドの運用コストを持たない。
  - オフライン/低帯域環境でも機能するよう、アセットサイズとキャッシュ戦略の確認が必要。
  - 新たに外部APIやバックエンドを導入する場合は別途ADRを追加して可否を判断する。
  - 計算ロジックはUIと独立にテスト可能だが、UI変更時も主要シナリオの手動/E2E確認が求められる。

### ADRを追加する際のルール
- ID: `ADR-00X` のように連番を増やす。タイトルは「技術/アーキテクチャ上の判断」を短く表現する。
- テンプレート: `Status`（Proposed/Accepted/Rejected/Deprecated）、`Context`、`Decision`、`Consequences` を含める。
- 形式: 本ファイルにセクションを追記する（ファイル分割が必要な規模になった場合のみ再検討）。
- トレーサビリティ: 可能であれば関連Issue/PRや日時を併記する。
