---
title: Docker + DevContainerで快適な開発環境を構築する
published: 2026-03-08
description: "Astroブログプロジェクトの開発環境をDockerとDevContainerで構築した手順をまとめます。"
tags: ["Docker", "DevContainer", "Astro", "環境構築"]
category: 技術メモ
draft: false
series: 開発環境
---

このブログの開発環境をDockerとVSCode DevContainerで構築しました。  
その手順と考え方をまとめます。

## なぜDockerを使うのか

- **環境の再現性** — どのマシンでも同じ環境で開発できる
- **セットアップの自動化** — `docker compose up` で即座に開発開始
- **チーム開発への対応** — 新メンバーも環境構築で詰まらない

## プロジェクト構成

```
.devcontainer/
├── Dockerfile          # DevContainer用ベースイメージ
├── devcontainer.json   # VSCode設定
├── docker-compose.yaml # DevContainer用Compose
├── postCreateCommand.sh # コンテナ作成後の初期化
└── postAttachCommand.sh # コンテナ接続時の設定

Dockerfile              # プロダクション用
docker-compose.yml      # プロダクション用Compose
```

## Dockerfileのポイント

```dockerfile
FROM node:22-slim

# pnpmをcorepack経由でインストール
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

EXPOSE 4321
CMD ["pnpm", "run", "dev"]
```

### ポイント

1. **Node.js 22** を使用（LTS版）
2. **corepack** でpnpmを管理（バージョン固定）
3. **依存関係ファイルを先にコピー** してレイヤーキャッシュを活用

## docker-compose.yml

```yaml
services:
  web:
    build: .
    container_name: novas-blog-dev
    ports:
      - "4321:4321"
    environment:
      - HOST=0.0.0.0
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
```

`HOST=0.0.0.0` を設定することで、コンテナ外からのアクセスが可能になります。

## DevContainerの設定

DevContainerを使えば、VSCodeから直接コンテナ内で開発できます。

```json
{
  "name": "Nova's Blog Dev",
  "dockerComposeFile": ["docker-compose.yaml"],
  "service": "node",
  "workspaceFolder": "/home/vscode/app",
  "forwardPorts": [4321]
}
```

## まとめ

Docker + DevContainerの組み合わせにより：

- ✅ ワンコマンドで開発環境が立ち上がる
- ✅ VSCodeの拡張機能も自動インストール
- ✅ 環境の違いによるトラブルを防止

次回は、このブログのデプロイ方法について紹介予定です。
