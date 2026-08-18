# -----------------------------------------
# Dockerfile (Node.js + pnpm)
# -----------------------------------------

FROM node:22-slim

# pnpmをインストール
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# コンテナ内での作業ディレクトリを設定
WORKDIR /usr/src/app

# プロジェクトの依存関係ファイルを先にコピーする
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install --no-frozen-lockfile

# プロジェクトの全てのファイルをコピー
COPY . .

# Astro devサーバーのデフォルトポートを公開
EXPOSE 4321

# コンテナ起動時に開発サーバーを起動
CMD ["pnpm", "run", "dev"]