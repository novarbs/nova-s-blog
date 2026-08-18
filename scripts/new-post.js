/* front-matter 付きの新規記事 markdown ファイルを作成するスクリプト */

import fs from "fs"
import path from "path"

// 現在の日付を YYYY-MM-DD 形式で取得する関数
function getDate() {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// コマンドライン引数を取得
const args = process.argv.slice(2)

// ファイル名の引数が指定されているか確認
if (args.length === 0) {
  console.error(`エラー: ファイル名の引数が指定されていません
使い方: npm run new-post -- <filename>`)
  process.exit(1) // スクリプトを終了しエラーコード 1 を返す
}

let fileName = args[0]

// ファイル名に .md / .mdx 拡張子がなければ .md を追加
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
  fileName += ".md"
}

// 出力先ディレクトリを定義
const targetDir = "./src/content/posts/"

// path.resolve で絶対パスを取得
const fullPath = path.resolve(targetDir, fileName)

// ファイルが既に存在するか確認
if (fs.existsSync(fullPath)) {
  console.error(`エラー: ファイル ${fullPath} は既に存在します`)
  process.exit(1)
}

// ディレクトリが存在しなければ作成
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

// front-matter の内容を生成
// ファイル名（拡張子を除く）をデフォルトのタイトルとして使用
const title = fileName.replace(fileExtensionRegex, "")
const content = `---
title: ${title}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---
`

// ファイルに書き込み
fs.writeFileSync(fullPath, content)

// 成功メッセージを出力
console.log(`記事 ${fullPath} を作成しました`)