# ToN Pin System - Windows native prototype v1

Windows向け C#/.NET 8 WinForms 版です。Electron/Python/Node をクライアント側で常駐させず、VRChatログ監視・マップ表示・同期を1アプリにまとめます。

## 実装済み
- VRChat の最新 output_log を自動検出し、追記部分のみ監視
- `Joining wrld_...` からインスタンスをSHA-256でローカルハッシュ化してルーム参加
- `This round is taking place at ...` から Map ID / map name / round type を検出
- Map IDに対応したローカル画像へ自動切替
- 赤=チェイス / 緑=生存希望 / 青=その他
- 1人1ピン。別位置クリックで同じピンを移動
- 赤ピンは設置順。削除時に番号を 1,2,3... と自動で詰め直す（サーバー側）
- ピン名表示 / ピンサイズ変更 / 自分のピン削除
- Render上の既存サーバーを利用して同期

## サーバー更新（重要）
`server/` の `server.js` と `package.json` を GitHub のRender用ルートへ反映してください。ネイティブアプリ用 `/native` WebSocket を追加しています。従来のブラウザ版 Socket.IO も残しています。

## exeのビルド
この生成環境には .NET SDK が無いため、ここではexeのコンパイル検証はできていません。
Windows PC に .NET 8 SDK を入れ、ルートの `build-release.bat` を実行すると self-contained の単一exeを生成する設定です。利用者側には.NET SDK/Runtimeは不要です。

## マップ画像
`ToNPinSystem/Maps/` にMap ID名で配置。現在の画像はv0.5で彩度0にしたものです。後から同じIDの画像へ差し替え可能です。


## v1.4
- 上部の「白：ローカル」が名前欄へ被る問題を修正
- 白ピンをマップ座標上へ正しく配置
- 白モード中: 左クリックで追加、右クリックで近い白ピンを削除
- マップ切替時に白ピンをクリア
- 502時にRender側サーバー更新が必要だと表示
- server フォルダに /native WebSocket 対応サーバーを同梱


## v1.5
- ビルド/Publish時に `Maps` フォルダを自動で出力先へコピー
- exeは `exeと同じ場所/Maps/<MapID>.png|jpg|jpeg|webp` を読み込み
- build-release.batにもMapsコピー処理を追加
- このZIPに現在含まれるMap ID画像数: 60


## v1.6 - 配布しやすい構成
`build-release.bat` の完了後、`dist` フォルダが配布用になります。

dist/
- ToN Pin System.exe  ← 利用者が起動するファイル
- はじめにお読みください.txt
- data/
  - Maps/

利用者には `dist` の中身だけをZIP化して配布してください。
EXEをフォルダの奥に置かず、展開直後に見える位置へ出力します。


## v1.6.1
- Windows cmd.exe で build-release.bat の日本語が文字化けしてコマンド扱いされる問題を修正
- build-release.bat を ASCII のみで構成


## v1.7 - GitHub Actions 自動ビルド
`.github/workflows/build-windows.yml` を追加しました。

GitHub の Actions → Build Windows App → Run workflow から、
Windows x64 の自己完結型アプリを自動生成できます。

生成Artifact:
`ToN-Pin-System-Windows-x64`

その中のZIPが利用者向け配布物です。利用者はBATや.NET SDKを必要としません。
