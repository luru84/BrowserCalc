# Data Dictionary（計算状態）

- `displayValue`: string|number  
  表示中の値。入力構築時は文字列、計算結果は数値。丸め後の表示値を保持。

- `accumulator`: number|null  
  直前までの計算結果または左オペランド。逐次計算モードで使用。

- `pendingOperator`: "+" | "-" | "×" | "÷" | null  
  未実行の演算子（逐次計算モード）。`=` 実行で消費。

- `recentOperand`: number|null  
  直前の右オペランド。`=` 繰り返し時に再利用。

- `memoryValue`: number|null  
  メモリ格納値。存在する場合は `M` 表示。

- `mode`: "sequential" | "expression"  
  逐次計算モード／式評価モードの切替状態。

- `history`: Array<{ expression: string, result: number|string }>  
  計算履歴。上限件数を持ち、古いものから削除。コピー/再利用に使用。

- `format`: { grouping: boolean, precision: number, scientificFallback: boolean }  
  表示設定。精度は小数点以下桁数（デフォルト3桁表示、内部は第4位四捨五入）。

- `taxRate`: number  
  税率（初期 0.10）。税込/税抜操作と税率設定画面で利用。

- `error`: { code: string, message: string } | null  
  エラー状態（ゼロ除算、オーバーフロー、構文エラー等）。エラー時は入力制御を制限。

- `settings`: { theme: "light"|"dark"|"high-contrast" } (optional)  
  テーマなどのUI設定。必要に応じて localStorage に保存。
