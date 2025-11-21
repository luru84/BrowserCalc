# Architecture

## 全体像（SPA）
- ブラウザのみで動くクライアントサイド SPA。外部API依存なし、オフライン完結。
- プレゼンテーション層（UI）と計算ロジック層を分離。ロジックは純粋関数ベースを優先。
- 状態ストアを中央管理（表示値、演算状態、メモリ、モード、履歴、設定）。
- PWA 対応: Service Worker / manifest によりホーム画面起動とオフライン利用を可能にする。

## レイヤ
- UI/Presentation: 表示（数値/エラー/インジケータ）、入力（ボタン/キーボード）、履歴・設定・テーマ。
- State/Store: displayValue, accumulator, pendingOperator, recentOperand, memoryValue, mode, history, format, taxRate, error。
- Domain Logic: 逐次計算モードのステートマシン、式評価モードのパーサ/評価、丸め/税計算/パーセント処理、バリデーション。
- Infra: ローカル永続（テーマ・税率・設定を localStorage 等に保存）、PWAキャッシュ。ネットワークI/Oなし。

## データフロー（逐次計算モード）
入力（数字/演算子/キー/ボタン）
→ バリデーション（桁数/有効キー/エラー状態）
→ ステート更新（accumulator/pendingOperator/displayValue/recentOperand）
→ フォーマット（丸め・桁区切り・科学表記フォールバック）
→ 表示
→（`=` 実行時は履歴に {式,結果} を push）

## データフロー（式評価モード）
入力（文字列・括弧を含む）
→ トークナイズ/パース（演算子優先）
→ 評価（ゼロ除算/構文エラーを検出）
→ フォーマット → 表示
→ 履歴 push（式と結果）

## エラーハンドリング
- ゼロ除算・オーバーフロー・構文エラーはエラー状態に遷移し、`C` で復帰。
- エラー時は計算入力を無効化し、クリア系のみ受け付ける。
