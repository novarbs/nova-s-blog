---
title: 旅のしおりアプリ「Tabi-Knot」を個人開発した話
published: 2026-07-12
description: "React + Capacitorで作った旅行しおりアプリの技術構成と、App Store申請準備で学んだ「地味な作業」をまとめます。"
tags: [React, Capacitor, Prisma, PostgreSQL, Express]
category: 個人開発
series: 個人開発
draft: false
---

こんにちは、リラです。  
今回は、これまでの個人開発で一番大きなプロジェクトである旅行計画アプリ「Tabi-Knot（タビノット）」を紹介します。TypeScriptのコードだけで5万行を超える規模になり、現在はApp Store申請に向けた準備を進めているところです。コードは非公開リポジトリで管理しているため、この記事では構成と学びを中心にまとめます。

## 概要

Tabi-Knotは「旅のしおり」をかんたんに作れるWebサービスです。主な機能は次のとおりです。

- タイムライン形式で予定を追加し、長押しドラッグで並び替えられるしおり編集
- 行き先と日程を入れるとAI（Gemini API）が旅程を提案してくれるAIプランナー
- URLひとつでしおりを共有でき、相手はアカウントなしでも閲覧・編集に参加できる共同編集
- しおりごとのメンバーチャット、支払い記録からの自動割り勘、持ち物リスト
- 予定の開始前リマインドやチャット新着を届けるプッシュ通知

Webブラウザ（PWA対応）で動くほか、同じコードベースからCapacitorでiOS/Androidのネイティブアプリもビルドしています。

## なぜ作ったか

もともとは友人との旅行のたびに、しおりをスプレッドシートやメモアプリで作っては共有に苦労していたのがきっかけでした。「予定・地図・チャット・割り勘が1か所にまとまっていて、アプリを入れていない人ともURLだけで共有できる」ものが欲しかったのです。

作り始めると欲が出てきて、「せっかくならストアに並ぶアプリとして出したい」という目標に変わりました。結果として、機能開発そのものよりも「リリースに必要な地味な作業」から学ぶことが圧倒的に多いプロジェクトになりました。

## 技術構成

- **フロントエンド**: React 19 + Vite + TypeScript、Tailwind CSS、TanStack Query
- **モバイル**: Capacitor 8（iOS / Android）、vite-plugin-pwaでPWAにも対応
- **バックエンド**: Express + Prisma + PostgreSQL
- **インフラ・外部サービス**: Redis（AIプランナーのセッション保存とレート制限に使用。未設定時はメモリ内フォールバック）、Cloudflare R2（S3互換API。カバー画像の保存）、Firebase Cloud Messaging（プッシュ通知）
- **認証**: メール認証に加えて Google / Apple / Discord のOAuth
- **課金・広告**: Stripe（Web）、RevenueCat（iOSアプリ内課金）、AdMob（差し込みポイントのみ用意）
- **AI**: Gemini API（旅程の自動生成）

データ設計はPrismaのスキーマに全部集約されていて、モデル数は28個になりました。中心となる`Trip`モデルの一部を抜粋します。

```prisma
model Trip {
  id             String          @id @default(cuid())
  title          String
  itineraryItems ItineraryItem[]
  members        TripMember[]
  expenses       Expense[]
  chatMessages   ChatMessage[]
  shareToken     String?         @unique
  inviteToken    String?         @unique
  isExploreListed Boolean        @default(false)
}
```

共有リンク用の`shareToken`と招待用の`inviteToken`を分けたり、公開しおり掲載時に日付やメモを出さないためのフラグを持たせたりと、「どこまで見せるか」の制御をスキーマの段階で設計したのが効いたと感じています。

## 工夫した点: 1つのコードベースでWeb/iOS/Androidを出す

一番の挑戦は、既存のReactコードをCapacitorのネイティブシェルに載せて、WebとアプリでUXを切り替えることでした。判定は小さなユーティリティに集約しています。

```ts
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
```

この`isNative`フラグで、ビルドごとに次のような分岐をしています。

- **起点画面**: Webはランディングページ、ネイティブはログイン画面へ直行
- **審査対策**: LP・ブログなどのSEOページはネイティブでは除外（「Webサイトの単純なラッパー」と見なされるガイドライン4.2への対策）
- **課金**: WebはStripe、iOSはRevenueCat経由のアプリ内課金に切り替え。外部課金への導線をネイティブに残さないのはガイドライン3.1.1対策です
- **認証**: WebはhttpOnly Cookie、ネイティブはBearerトークン。OAuthはネイティブではシステムブラウザで開き、`com.tabiknot.app://`のカスタムスキームでアプリに復帰させます

課金の切り替えは、同じインターフェースの実装をプラットフォームで差し替える形にしました。

```ts
export const purchases: PurchasesService =
  isNative ? iapPurchases : stripePurchases;
```

なお、プレミアム課金自体はまだ購入できない状態（「近日リリース」表示）で、現状の機能はすべて無料です。

## つまずいた点: リリースに必要な「地味な作業」

機能を作り終えてからが本番でした。ストアに出すために必要だった作業の一部です。

- **プッシュ通知**: FCM + APNsの構成で、Firebaseのサービスアカウント設定、APNs認証キーの登録、entitlementsの設定など、コード以外の手順が長い。通知の種類別ON/OFFをサーバー側（`User.pushPrefs`）に持たせる設計も必要でした
- **退会フロー**: App Storeのガイドライン5.1.1(v)でアカウント削除機能が必須です。`DELETE /api/auth/me`で関連データを一括削除するAPIと、誤操作防止の2段階確認つき退会画面を実装しました
- **Sign in with Apple**: サードパーティログインを提供する場合はAppleログインも必須（ガイドライン4.8）なので追加実装
- **申請書類**: App Privacyのデータ収集申告、審査ノート、スクリーンショット計画など、ドキュメント作成だけでもかなりの分量になりました

どれも派手さはないのですが、「動くもの」と「出せるもの」の間にはこれだけの距離があるのだと実感しました。

## まとめ

Tabi-Knotを通じて、Prismaでのデータ設計からCapacitorでのマルチプラットフォーム対応、そしてOAuth・プッシュ通知・課金・退会フローといったリリース周りの実務まで、個人開発の枠を超えた経験ができました。まだ申請準備の途中なので、審査を通過できたらその過程も記事にしたいと思います。

同じように「Webアプリをストアに出したい」と考えている方の参考になれば嬉しいです。
