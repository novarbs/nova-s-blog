---
title: 間隔反復学習アプリ「Musubi」を個人開発した話
published: 2026-04-18
description: "SM-2アルゴリズムを自作した間隔反復学習アプリ「Musubi」の技術構成と開発で学んだことを紹介します。"
tags: [Astro, React, Drizzle, SQLite, Capacitor]
category: 個人開発
series: 個人開発
draft: false
---

個人開発した間隔反復学習アプリ「Musubi」を紹介します。  
Ankiのような、忘却曲線に基づいて復習タイミングを管理してくれる学習アプリです。  
(リポジトリは現在非公開です。この記事では構成と実装の考え方を紹介します)

## 概要

Musubiは、デッキとカードを作って繰り返し学習するSRS（Spaced Repetition System）アプリです。主な機能は以下の通りです。

- **デッキ/カード管理** — Markdown対応のカード作成・編集（通常カードと選択式カードに対応）
- **SM-2アルゴリズムによるレビュー** — 回答の自己評価に応じて次回の復習日を自動計算
- **ダッシュボード** — 今日のレビュー数や学習状況の可視化
- **ポモドーロタイマー / 学習プランナー** — 学習時間の管理
- **AIカード生成** — テキストを貼り付けるとGeminiがカードを自動生成
- **Anki（.apkg）/ CSVインポート** — 既存のデッキ資産を取り込み
- **iOSアプリ化** — Capacitorでネイティブアプリとしてもビルドできるようにしました

## なぜ作ったか

もともとAnkiユーザーだったのですが、「復習アルゴリズムの中身を自分で理解して制御したい」「AIでカード作成の手間を減らしたい」と思ったのがきっかけです。既製アプリを使うだけでは中身がブラックボックスのままなので、SRSの核心であるSM-2アルゴリズムを自分の手で実装してみたい、という学習目的も大きかったです。

## 技術構成

- **フロントエンド**: Astro 4（SSR）+ React 18 + Tailwind CSS
- **バックエンド**: AstroのAPIルート（`@astrojs/node` のstandaloneアダプタ）
- **DB**: Drizzle ORM + libSQL（SQLite）
- **AI**: Google Gemini（`gemini-2.0-flash`）
- **モバイル**: Vite + React + Capacitor 8

Astroを選んだのは、ページはSSRで軽く保ちつつ、レビュー画面のようなインタラクティブな部分だけReactのアイランドにできるからです。APIルートもAstroの `src/pages/api/` にそのまま書けるので、小規模な個人開発ではフロントとAPIを1つのプロジェクトに収められるのが快適でした。

DBはDrizzle ORM + SQLiteにしました。スキーマをTypeScriptで定義して `drizzle-kit push` で反映できるので、マイグレーション管理がとても楽です。

```ts
export const reviewLogs = sqliteTable('review_logs', {
    id: text('id').primaryKey(),
    cardId: text('card_id').notNull().unique()
        .references(() => cards.id, { onDelete: 'cascade' }),
    nextReviewAt: integer('next_review_at', { mode: 'timestamp' }).notNull(),
    interval: real('interval').notNull().default(0),
    easeFactor: real('ease_factor').notNull().default(2.5),
    repetitionCount: integer('repetition_count').notNull().default(0),
});
```

## 工夫した点

### SM-2アルゴリズムを自作してテストを書いた

一番やりたかったのがここです。SuperMemo-2のアルゴリズムを簡略版として純粋関数で実装しました。

```ts
if (quality < 3) {
    repetitionCount = 0;
    interval = 1;
} else {
    if (repetitionCount === 0) interval = 1;
    else if (repetitionCount === 1) interval = 6;
    else interval = Math.round(interval * currentEF);
    repetitionCount += 1;
}
```

評価が3未満なら間隔をリセット、正解なら「1日 → 6日 → 前回間隔×EF（容易さファクター）」と間隔が伸びていく仕組みです。EFは公式の式で更新し、下限を1.3に固定しています。

副作用のない純粋関数にしたおかげでテストが書きやすく、`bun:test` で「3回目のGoodでinterval=15になるか」「連続で間違えてもEFが1.3を下回らないか」といったケースを8本のユニットテストで検証しています。UIの「Hard」ボタンをquality=2に割り当てているため、現状はHardでも間隔がリセットされる仕様で、本家Ankiとは挙動が異なります。この割り当ては今後調整したいポイントです。

### AIによるカード自動生成

教科書やノートのテキストを貼り付けると、Gemini（`gemini-2.0-flash`）がフラッシュカードをJSON配列で生成してくれる機能を作りました。プロンプトで出力形式を厳密に指定し、通常カードと選択式カードの両方に対応しています。APIキーは環境変数で管理し、ワークスペースごとに1日20回のレート制限を入れています（現状はメモリ内カウンターの簡易実装です）。

### Ankiデッキのインポート

`.apkg` ファイルは実体がZIPで、中にSQLiteデータベースが入っています。`adm-zip` で展開し、`bun:sqlite` で中のDBを読んでカードを取り込むAPIを実装しました。既存のAnki資産を持ち込めるのは自分でも重宝しています。

## つまずいた点

一番苦労したのはiOSアプリ化です。当初は「AstroアプリをそのままCapacitorで包めばいい」と考えていたのですが、AstroはSSRが前提のためローカルファイルとして読み込む形にできず、結局 `ios-app/` としてVite + React Routerの別SPAを用意しました。Web版のReactコンポーネントとSM-2のロジックを流用し、APIは開発時にViteのプロキシでAstroサーバーへ中継する構成です。Capacitorのローカル通知やハプティクスなどのプラグインも組み込みました。「同じコードを包むだけ」とはいかず、Webとネイティブでアーキテクチャの分岐が必要になるのは学びでした。

## まとめ

SM-2という「枯れたアルゴリズム」でも、自分で実装してテストを書くと理解の解像度が一気に上がりました。AstroのSSR + APIルート + Drizzleの組み合わせは、個人開発の規模ではかなり快適でおすすめです。

このアプリ自体は今のところ非公開リポジトリで開発していますが、質問があればお気軽にどうぞ。
