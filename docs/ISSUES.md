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
9. **chore: E2E + docs**  
   受け入れ条件に沿ったE2E/手動確認、README更新（使い方/ビルド/起動手順）。  
   Accept: 主要シナリオの確認完了、READMEに手順反映。

10. **chore: GitHub Pages deploy**  
    Viteの `dist/` を GitHub Pages へ自動デプロイ（gh-pages or Pages Actions）。  
    Accept: main更新で自動ビルド＋公開、PWAとSWが正しく配信される（ベースパス考慮）。
