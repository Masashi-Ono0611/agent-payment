# PayAgent QA テスト手順書

**URL:** http://localhost:3000
**ネットワーク:** Base Sepolia (testnet)
**前提:** `pnpm dev` で起動済み

---

## 0. 初期表示

| # | 確認項目 | 期待結果 |
|---|---------|---------|
| 0-1 | ページが表示される | ダークテーマのUIが表示される |
| 0-2 | ヘッダー左に「PayAgent」ロゴ | 青アイコン + PayAgent テキスト |
| 0-3 | ヘッダー右に Connect Wallet ボタン | RainbowKit のボタンが表示 |
| 0-4 | デフォルトで Chat タブがアクティブ | チャット画面 + 3つのサジェストボタン |
| 0-5 | 下部にボトムナビ (Wallet / Chat / Activity) | 3タブ表示、Chat がハイライト |

---

## 1. WalletConnect (ブラウザウォレット接続)

| # | 操作 | 期待結果 |
|---|-----|---------|
| 1-1 | Connect Wallet ボタンをクリック | RainbowKit モーダルが開く |
| 1-2 | MetaMask (またはCoinbase Wallet) を選択 | ウォレット接続フローが始まる |
| 1-3 | ウォレット側で承認 | ヘッダーにアバター/アドレスが表示される |
| 1-4 | 接続後、チャットで「What's my wallet address?」 | 接続したアドレスを認識して回答 |
| 1-5 | アバターをクリック → Disconnect | 接続解除、Connect Wallet ボタンに戻る |

> **Note:** WalletConnect Project ID 未設定の場合、QRコード接続は使えないが MetaMask 拡張機能など injected connector は動作する

---

## 2. チャット: ウォレット作成

| # | 操作 | 期待結果 |
|---|-----|---------|
| 2-1 | サジェスト「Create a wallet called MyAgent」をクリック | メッセージが送信される |
| 2-2 | AI がツール実行 | 「create wallet」のツール表示 (スピナー → チェックマーク) |
| 2-3 | AI が返答 | ウォレット名 + アドレス (0x...) を含む返答 |
| 2-4 | Wallet タブに切り替え | 作成されたウォレットがリストに表示されている |
| 2-5 | Chat タブに戻り「Create another wallet called Bob」 | 2つ目のウォレットが作成される |

---

## 3. チャット: 残高確認

| # | 操作 | 期待結果 |
|---|-----|---------|
| 3-1 | 「Check my balance」と入力 | AI が check_balance ツールを実行 |
| 3-2 | ツール完了後 | ETH: 0.00, USDC: 0.00 等の残高を回答 |
| 3-3 | Wallet タブで残高が更新されている | 同じ値が Wallet タブにも反映 |

---

## 4. チャット: ETH Faucet

| # | 操作 | 期待結果 |
|---|-----|---------|
| 4-1 | 「Get testnet ETH for MyAgent」と入力 | AI が request_faucet (token: eth) ツールを実行 |
| 4-2 | ツール完了 (10〜30秒かかる場合あり) | BaseScan リンク付きで成功メッセージ |
| 4-3 | BaseScan リンクをクリック | 新タブでトランザクション詳細が開く |
| 4-4 | 「Check my balance」 | ETH 残高が増えている (0.0001 ETH 程度) |

---

## 5. チャット: USDC Faucet

| # | 操作 | 期待結果 |
|---|-----|---------|
| 5-1 | 「Get USDC from faucet for MyAgent」と入力 | AI が request_faucet (token: usdc) ツールを実行 |
| 5-2 | ツール完了 (10〜30秒かかる場合あり) | BaseScan リンク付きで成功メッセージ |
| 5-3 | BaseScan リンクをクリック | 新タブで USDC transfer のトランザクション詳細が開く |
| 5-4 | 「Check my balance」 | USDC 残高が増えている |

---

## 6. チャット: ETH 送金

> **前提:** 2つのウォレット (MyAgent, Bob) が作成済み、MyAgent に ETH がある

| # | 操作 | 期待結果 |
|---|-----|---------|
| 6-1 | 「Send 0.00001 ETH from MyAgent to Bob」 | AI が送金内容を確認 or 実行 |
| 6-2 | send_payment ツール実行 | スピナー → チェックマーク |
| 6-3 | 完了後 | 金額 + BaseScan リンク付きの成功メッセージ |
| 6-4 | 「Check balance of Bob」 | Bob の ETH 残高に反映 |

---

## 7. チャット: USDC 送金

> **前提:** MyAgent に USDC がある (セクション5で取得済み)

| # | 操作 | 期待結果 |
|---|-----|---------|
| 7-1 | 「Send 1 USDC from MyAgent to Bob」 | AI が送金内容を確認 or 実行 |
| 7-2 | send_payment (token: usdc) ツール実行 | スピナー → チェックマーク |
| 7-3 | 完了後 | 金額 + BaseScan リンク付きの成功メッセージ |
| 7-4 | 「Check balance of Bob」 | Bob の USDC 残高に反映 |

---

## 8. ブラウザウォレットへの送金 (WalletConnect 接続済みの場合)

| # | 操作 | 期待結果 |
|---|-----|---------|
| 8-1 | 「Send 0.00001 ETH to my wallet」 | AI が接続ウォレットのアドレスを送金先として認識 |
| 8-2 | 送金完了 | 接続ウォレットのアドレスへのトランザクションが成功 |
| 8-3 | 「Send 1 USDC to my wallet」 | AI が USDC 送金を実行 |
| 8-4 | 送金完了 | USDC が接続ウォレットに着金、BaseScan リンク表示 |

---

## 9. Wallet タブ

| # | 操作 | 期待結果 |
|---|-----|---------|
| 9-1 | Wallet タブに切り替え | Total Balance + ウォレット一覧が表示 |
| 9-2 | ウォレットカードをクリック | 展開してFaucetボタンが表示される |
| 9-3 | 「Get ETH」ボタンをクリック | スピナー → 「ETH received」メッセージ |
| 9-4 | 「Get USDC」ボタンをクリック | スピナー → 「USDC received」メッセージ |
| 9-5 | リフレッシュボタン (↻) をクリック | 残高が最新値に更新 |
| 9-6 | ウォレット名入力 → Create ボタン | 新しいウォレットが作成されリストに追加 |

---

## 10. Activity タブ

| # | 操作 | 期待結果 |
|---|-----|---------|
| 10-1 | Activity タブに切り替え | トランザクション履歴が表示 (または空表示) |

> **Note:** Activity はチャット経由の送金ではなく SendView 経由のみ記録。現在は Chat がメインのため空の可能性あり

---

## 11. エッジケース

| # | 操作 | 期待結果 |
|---|-----|---------|
| 11-1 | 空メッセージで送信 | 送信されない (ボタンがdisabled) |
| 11-2 | AI 応答中に再送信 | 送信されない (ボタンがdisabled) |
| 11-3 | 残高 0 のウォレットから ETH 送金を指示 | AI がエラーまたは faucet を提案 |
| 11-4 | 残高 0 のウォレットから USDC 送金を指示 | AI がエラーまたは USDC faucet を提案 |
| 11-5 | 存在しないウォレット名で送金を指示 | AI が確認・修正を求める |
| 11-6 | ページリロード | チャット履歴はリセット、ウォレットもリセット |

---

## 推奨テストフロー (E2E)

```
1.  ページ表示を確認 (0-1〜0-5)
2.  「Create a wallet called MyAgent」 → ウォレット作成 (2-1〜2-4)
3.  「Create another wallet called Bob」 → 2つ目作成 (2-5)
4.  「Check my balance」 → 残高確認: 両方 0 (3-1〜3-3)
5.  「Get testnet ETH for MyAgent」 → ETH Faucet (4-1〜4-4)
6.  「Get USDC from faucet for MyAgent」 → USDC Faucet (5-1〜5-4)
7.  「Check my balance」 → ETH & USDC 両方の残高確認
8.  「Send 0.00001 ETH from MyAgent to Bob」 → ETH 送金 (6-1〜6-4)
9.  「Send 1 USDC from MyAgent to Bob」 → USDC 送金 (7-1〜7-4)
10. 「Check balance of Bob」 → Bob に ETH & USDC が着金していることを確認
11. Wallet タブで残高確認 (9-1〜9-5)
12. (任意) Connect Wallet → 「Send 0.00001 ETH to my wallet」 (1-1〜1-3, 8-1〜8-2)
13. (任意) 「Send 1 USDC to my wallet」 → USDC もブラウザウォレットへ (8-3〜8-4)
```
