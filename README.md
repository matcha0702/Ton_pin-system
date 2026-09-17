# ToN Pin Tool Cloud v0.4

VRChat「Terrors of Nowhere」向けのインスタンス自動同期ピンマップ。

## 構成
- Render: `server.js` + `public/` を常設公開
- 各プレイヤーPC: `start-cloud.bat` で `watcher.py` を起動
- watcher が VRChat output_log の `Joining wrld_...` を検出し、SHA-256由来のルームキーを作成
- 同じインスタンスのユーザーは同じルームへ自動接続
- 生のVRChatインスタンス文字列やUser IDはサーバーへ送信しない

## Render
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`（任意）

## 初回のローカル起動
1. `start-cloud.bat` をダブルクリック
2. Renderで発行された固定URLを入力
3. 以後URLは `cloud-config.json` に保存され、再入力不要
4. VRChatのインスタンスを検出するとブラウザが自動で開く
