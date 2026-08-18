# Docker開発環境構築 & 日本語ブログ化

## 変更概要

Fuwariテンプレートベースのブログを、Docker開発環境付きの日本語ポートフォリオブログに変換。

### Docker / DevContainer
- Dockerfile: Bun → Node.js 22 + pnpm、ポート4321統一
- docker-compose.yml: コンテナ名変更、HOST環境変数追加
- DevContainer: bun削除、Tailwind拡張追加、ポート4321転送、pnpm対応

### 日本語化
- HTML lang: zh-CN → ja
- ページタイトル: 关于→このブログについて、时间线→タイムライン、专栏→シリーズ、友链→リンク
- 投稿ページ: inLanguage ja、字→文字、min→分
- フッター: 中国語リンク削除、著作権表示追加
- SeriesPanel: 篇文章→記事、个专栏→シリーズ
- RSS: コメント日本語化、language ja

### コンテンツ
- aboutページ: ポートフォリオ紹介に全面書き換え
- config.ts: subtitle・bio変更（トランスコスモス正社員向け）
- friends.json: 開発者向けリンク集に差し替え
- サンプル記事2本作成（hello-world, docker-devcontainer）

## 残作業
1. `rm -rf src/content/posts/Default` でデモ記事削除
2. デプロイ後に astro.config.mjs の site を本番URLに変更

## 起動手順
```bash
docker compose up --build
# → http://localhost:4321
```
