---
title: Electronでデスクトップに埋め込むウィジェット「Glass Dashboard」を作っています
published: 2026-04-29
description: "PySide6製ウィジェットをElectron + TypeScriptに移行し、WorkerWテクニックで壁紙の上に埋め込む個人開発の記録です。"
tags: [Electron, TypeScript, Windows, ウィジェット, 個人開発]
category: 個人開発
series: 個人開発
draft: false
---

こんにちは、リラです。
今回は個人開発中のプロジェクト「Glass Dashboard」を紹介します。Windows 11 のデスクトップに、Rainmeter のように常駐するウィジェットを自作するプロジェクトです。

リポジトリはこちらです。
[novarbs/dashboard-widget](https://github.com/novarbs/dashboard-widget)

## 概要

Glass Dashboard は、フレームレス・背景透過のウィンドウをデスクトップの壁紙とアイコンの間のレイヤーに埋め込むデスクトップウィジェットです。システムトレイから「デスクトップモード（埋め込み）」と「フロートモード（普通のウィンドウ）」を切り替えられるほか、編集モードでの位置調整や、Ctrl+Shift+W での表示/非表示トグルも実装しています。

もともとは Python（PySide6 + QWebEngineView）で動かしていたのですが、今回 **Electron + TypeScript** に全面移行しました。旧実装は `legacy/` ディレクトリに残してあります。

## なぜ PySide6 から Electron に移行したのか

移行前に、候補となる技術を比較検討しました。ドキュメントに残した比較の要点はこうです。

- **Python（現行）+ ctypes**: 言語を変えずに済む一方、Windows での PySide6 + QWebEngine の透過表示に問題があり、配布も大変
- **Tauri + Rust**: 軽量で高速だが、Win32 API 部分を Rust で書く必要がある
- **C# / WPF**: Win32 API へのアクセスは最も容易だが、HTML ウィジェットの再実装が必要
- **Electron + TypeScript**: 既存の HTML/CSS/JS を流用でき、`koffi` で Win32 API を呼べて、システムトレイや .exe パッケージングも標準対応。欠点はアプリサイズが大きいこと（約100MB）

UI はすでに 1 枚の HTML として作り込んでいたので、「既存の資産をそのまま活かせるか」が決め手になり、Electron を選びました。実際、renderer の HTML/CSS/ウィジェットロジックはほぼそのまま移植でき、変更したのは旧 Flask API への `fetch('/api/...')` 呼び出しを Electron IPC の `window.widget.*` API に置き換えた部分だけでした。

## 技術構成

- **Electron + TypeScript** — メインプロセス / preload / renderer の 3 層構成
- **koffi** — Node.js から `user32.dll` の Win32 API を呼ぶ FFI ライブラリ
- **electron-store** — 設定・データの永続化
- **electron-builder** — Windows 用の .exe（NSIS / ポータブル）ビルド

主なモジュールは次の通りです。

```
src/
├── main/
│   ├── index.ts          # メインプロセス（エントリーポイント）
│   ├── desktop-embed.ts  # Win32 WorkerW デスクトップ埋め込み
│   ├── tray.ts           # システムトレイ
│   └── bridge.ts         # IPC ブリッジ（旧 Flask API の代替）
├── preload/
│   └── index.ts          # contextBridge で window.widget.* を公開
└── renderer/
    └── index.html        # UI（旧 widget.html を移行）
```

## 核心技術: WorkerW テクニック

このプロジェクトの肝が、ウィンドウを「壁紙の上、デスクトップアイコンの下」に配置する **WorkerW テクニック**です。Wallpaper Engine などでも使われている手法で、手順は次の 4 ステップです。

1. `FindWindowW('Progman', null)` で Program Manager のウィンドウを探す
2. Progman に `0x052C` メッセージを送り、WorkerW ウィンドウを生成させる
3. `EnumWindows` で全ウィンドウを列挙し、`SHELLDLL_DefView`（デスクトップアイコン）を持つ WorkerW の「次」の WorkerW を特定する
4. `SetParent` で自分のウィンドウをその WorkerW の子にする

`desktop-embed.ts` の検索部分はこんなコードです。

```typescript
const callback = (hwnd: any, _lParam: any): boolean => {
  const shellView = FindWindowExW(hwnd, null, 'SHELLDLL_DefView', null);
  if (shellView) {
    // SHELLDLL_DefView が見つかった WorkerW の次の WorkerW を探す
    targetWorkerW = FindWindowExW(null, hwnd, 'WorkerW', null);
  }
  return true; // continue enumeration
};

EnumWindows(callback, 0);
```

こうして埋め込んだウィンドウは、他のウィンドウを開いても最背面に留まり、Win+D（デスクトップ表示）でも消えません。まさに「デスクトップの一部」として振る舞ってくれるわけです。

## 工夫した点・つまずいた点

**macOS で開発して Windows で動かす構成にしたこと。** 普段の開発機は Mac なので、`desktop-embed.ts` は Windows 以外では何もしない no-op にして、macOS ではフレームレスの通常ウィンドウとして動くフォールバックを入れました。koffi のロードも遅延させて、Windows 以外でエラーにならないようにしています。

**Windows 11 の仕様変化への備え。** 新しめの Windows 11 では WorkerW が見つからないケースがあるため、見つからなければ Progman 自体を親にするフォールバックも入れています。この手法自体、Windows アップデートで壊れる可能性がある「非公式のテクニック」なので、割り切りが必要です。

**正直に書くと、Windows 実機での検証はまだこれからです。** macOS 上では TypeScript のコンパイルと起動、全ウィジェットの動作まで確認できましたが、WorkerW 埋め込みの動作テストは Windows 11 の実機が必要なので、チェックリストの最後の項目として残っています。

## まとめ

- PySide6 製ウィジェットを Electron + TypeScript に全面移行しました
- 決め手は「既存 HTML/CSS/JS の流用」と「koffi による Win32 API 呼び出しの手軽さ」でした
- WorkerW テクニックで、壁紙とアイコンの間にウィンドウを埋め込む実装を書きました

Windows 実機での検証が済んだら、結果を続報として書く予定です。コードは [GitHub](https://github.com/novarbs/dashboard-widget) で公開しているので、興味のある方はぜひ覗いてみてください。
