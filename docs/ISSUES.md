# Issueテンプレート一覧（コピペ用）

リポジトリで発行するIssue案をまとめたものです。`gh issue create -t "<title>" -b "<body>"` で使えます。

## 完了済（参考用）
1. **feat: implement sequential calculator core**  
   逐次計算ロジック（四則/連続= /符号反転/クリア/⌫/CE、桁上限チェック、エラー状態遷移）。  
   Accept: 逐次計算と=連打が要件通り動作し、クリア系が想定通り。

2. **feat: percent, tax, precision validation**  
   パーセント挙動（逐次モデル）、税込/税抜（丸め）、精度/桁バリデーション。  
   Accept: 要件の例通りに動作し、精度・上限が反映。

3. **feat: build UI skeleton**  
   表示/テンキー/演算子/税/メモリ/クリア系のUI骨格、レスポンシブ、A11y基本対応。  
   Accept: SP縦1カラム・PC2カラムで崩れず、aria-label付与。

4. **feat: settings and persistence**  
   税率設定、表示設定（桁区切り/精度/科学表記）、テーマ切替、設定永続化。  
   Accept: 設定が反映・保存され、リロード後も維持。

5. **feat: history panel**  
   式+結果の保存/上限/再利用/コピー/クリア、モバイルはドロワー表示。  
   Accept: 上限超過で古い履歴が削除され、再利用・コピーが機能。

6. **feat: expression mode**  
   式評価モード（演算子優先の評価/切替UI）、エラー保持（括弧は現行スコープ外）。  
   Accept: 式モードで演算子優先が正しく評価され、エラー時に式保持。

7. **feat: keyboard input**  
   数字/演算子/Enter/Backspace/Esc/% のショートカット、競合回避。  
   Accept: 主要キー操作が動作し、ブラウザ標準ショートカットを阻害しない。

8. **feat: PWA offline support**  
   manifest+Service Worker、静的アセットキャッシュ、オフライン計算・設定。  
   Accept: インストール可能で、オフラインでも計算/設定が動く。

## 残タスク（新規起票候補）
なし（T9/T10 完了済み）

## 実装チェックリスト（レビュー指摘対応）
対象: `src/lib/calculator.ts` の不具合修正（2026-02-16）

- [x] P1: 桁区切り表示値の数値変換を修正する
  - [x] `toNumber` で `,` を除去してから数値化する
  - [x] 空文字や不正値は `null` 扱いを維持する
  - [x] 確認: `1,234 + 1 = 1,235` が成立する
  - [x] 確認: `MS` / `M+` / `M-` が `1,234` 表示時にも動作する

- [x] P2: `clearAll` 実行時に設定値を保持する
  - [x] `taxRate` / `precision` / `grouping` / `scientific` を引き継ぐ
  - [x] 計算コンテキストのみ初期化する
  - [x] 確認: `precision=6` に設定後 `C` 押下で `6` が保持される
  - [x] 確認: `grouping` / `scientific` / `taxRate` も `C` で変化しない

- [x] P2: 式モードの小数点入力制御をオペランド単位に変更する
  - [x] `displayValue` 全体ではなく、現在オペランドのみで `.` 重複判定する
  - [x] 演算子区切りで現在オペランドを抽出する
  - [x] 確認: `1.2+3.4` / `10.05*2.1` が入力できる
  - [x] 確認: `1..2` / `3.4.5` は拒否される

## 追加回収（2ndレビュー + UI改善）
対象日: 2026-02-16

- [x] **fix: expression mode should continue after grouped result**
  - 内容: 式評価モードで `=` 後に桁区切り表示（例: `1,234`）となっても、次の演算入力が壊れないようにする。
  - Accept:
    - `grouping=ON` で式評価 `1234=` 後、`+1=` が成功する。
    - 評価時に `Invalid character` にならない。

- [x] **fix: keep user settings when CE clears error**
  - 内容: エラー表示中に `CE` を押しても `taxRate/precision/grouping/scientific` が初期値へ戻らないようにする。
  - Accept:
    - 設定変更後にエラー発生→`CE` で復帰しても設定値が保持される。

- [x] **fix: reset calc context on history reuse**
  - 内容: 履歴再利用時に `displayValue` だけでなく逐次計算コンテキスト（`accumulator/pendingOperator/recentOperand`）を安全にリセットする。
  - Accept:
    - 演算途中で履歴再利用しても、前コンテキストが混ざらない。

- [x] **feat: persist preferred calculation mode**
  - 内容: 逐次/式評価モードの選好を設定として永続化し、再読み込み後も保持する。
  - Accept:
    - モード切替後リロードしても同じモードで起動する。

- [x] **feat(ui): move settings panel behind hamburger menu**
  - 内容: 設定エリアをハンバーガーメニューから開閉するUIへ変更（モバイルはドロワー、PCはサイド開閉）。
  - Accept:
    - 初期状態で設定パネルは閉。
    - ハンバーガーで開閉可能。
    - `Esc`、閉じるボタン、背景クリックで閉じられる。
    - `aria-expanded` / `aria-controls` / `aria-label` を満たす。
