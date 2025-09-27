import { LinkPreset, type NavBarLink } from "@/types/config";

// --- ナビゲーションバーの共通リンク設定 ---
// ここで定義されたリンクは、config.tsのnavBarConfig.linksで利用できます。
export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
	// サイトのトップページへのリンク
	[LinkPreset.Home]: {
		name: "トップ", // 「ホーム」よりも「トップページ」や「ホーム」がより一般的
		url: "/",
	},
	// サイトや運営者についての情報ページへのリンク
	[LinkPreset.About]: {
		name: "このブログについて", // 「このサイトについて」より「このブログについて」の方がしっくりくる場合も
		url: "/about/",
	},
	// 過去記事一覧（または時系列順の投稿）ページへのリンク
	[LinkPreset.Archive]: {
		name: "一覧", // 「アーカイブ」より「記事一覧」や「投稿履歴」が自然
		url: "/archive/",
	},
	// 複数の記事をまとめた特集やカテゴリページへのリンク
	[LinkPreset.Series]: {
		name: "記事", // 「シリーズ」より「特集記事」や「カテゴリ」が自然
		url: "/series/",
	},
	// 相互リンクや紹介したいサイトへのリンク集ページ
	[LinkPreset.Friends]: {
		name: "リンク", // 「友リンク」より「おすすめリンク」や「リンク集」が自然
		url: "/friends/",
	},
};
