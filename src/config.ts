import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// --- サイト全体の基本設定 ---
export const siteConfig: SiteConfig = {
	// サイトのメインタイトル
	title: "Nova's Blog",
	// サイトのサブタイトル
	subtitle: "ゆるゆるプログラミング",
	// テーマカラーの設定
	themeColor: {
		// 色相 (0から360の値で指定します。例: 赤:0, 青:240, 紫:291)
		hue: 291,
		// trueにすると訪問者がテーマカラーを変更できなくなります
		fixed: false,
	},
	// ページ上部に表示されるバナー画像の設定
	banner: {
		// trueにするとバナー画像が表示されます
		enable: true,
		// バナー画像のパス ('/'から始めるとpublicフォルダからの相対パスになります)
		src: "/banner.jpeg",
		// 画像の表示位置 ('top', 'center', 'bottom'から選択)
		position: "center",
		// バナー画像のクレジット表示設定
		credit: {
			// trueにしてクレジットを表示します
			enable: true,
			// 表示するテキスト
			text: "Generated with Stable Diffusion", // "Stable Diffusion" など利用したサービス名
			// (任意) そのサービスの公式サイトURLを貼ります
			url: "https://civitai.com/",
		},
	},
	// 記事ページの目次設定
	toc: {
		// trueにすると記事の右側に目次が表示されます
		enable: true,
		// 目次に表示する見出しの深さ (1〜3で指定。例: 2だと<h2>まで表示)
		depth: 2,
	},
	// ファビコン(ブラウザのタブに表示されるアイコン)の設定
	favicon: [
		{
			src: "/icon.png",
		},
	],
};

// --- ナビゲーションバーの設定 ---
export const navBarConfig: NavBarConfig = {
	// ナビゲーションバーに表示するリンクのリスト
	links: [
		LinkPreset.Home, // 「ホーム」へのリンク
		LinkPreset.Archive, // 「アーカイブ」へのリンク
		LinkPreset.Series, // 「シリーズ」へのリンク
		LinkPreset.About, // 「このサイトについて」へのリンク
		LinkPreset.Friends, // 「フレンズ」へのリンク
		/* 自分でリンクを追加する場合の例
		{
			// 表示名
			name: "GitHub",
			// リンク先のURL
			url: "https://github.com/novarbs",
			// trueにすると外部リンクアイコンが表示され、新しいタブで開きます
			external: true,
		},
		*/
	],
};

// --- プロフィールカードの設定 ---
export const profileConfig: ProfileConfig = {
	// プロフィール画像 ('/'から始めるとpublicフォルダからの相対パスになります)
	avatar: "/icon.JPG",
	// あなたの名前
	name: "リラ",
	// 簡単な自己紹介文
	bio: "某S社のパートナーとして活動中",
	// SNSなどのリンクのリスト
	links: [
		/* リンクを追加する場合の例
		{
			name: "Twitter",
			// アイコン名 ( https://icones.js.org/ で探せます)
			icon: "fa6-brands:twitter",
			url: "https://twitter.com",
		},
		*/
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/novarbs",
		},
		{
			name: "X",
			icon: "fa6-brands:twitter",
			url: "https://x.com/Nova_Rbs/",
		},
	],
};

// --- 記事下のライセンス表示設定 ---
export const licenseConfig: LicenseConfig = {
	enable: false, // ここを false に変更
	name: "CC BY-NC-SA 4.0", // これらは非表示になるので、そのままでOK
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

// --- コードブロックの見た目(シンタックスハイライト)設定 ---
export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// ブログテーマがダークモードのみをサポートしているため、ダーク系のテーマを選んでください
	// 例: 'github-dark', 'dracula', 'one-dark-pro' など
	theme: "github-dark",
};
