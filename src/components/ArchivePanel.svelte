<script lang="ts">
import { onMount } from "svelte";
import { getPostUrlBySlug } from "../utils/url-utils";

// コンポーネントが受け取るプロパティを定義
export let sortedPosts: Post[] = [];

// 記事と年ごとのグループのデータ構造を定義
interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string;
		published: Date;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

// グループ化された記事データを格納
let groups: Group[] = [];

/**
 * 日付をMM-DD形式にフォーマットする
 * @param date 日付オブジェクト
 * @returns フォーマットされた日付文字列
 */
function formatDate(date: Date) {
	return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
		.getDate()
		.toString()
		.padStart(2, "0")}`;
}

/**
 * タグ配列を「#タグ1 #タグ2」のような文字列形式にフォーマットする
 * @param tagList タグの配列
 * @returns フォーマットされたタグ文字列
 */
function formatTag(tagList: string[]) {
	return tagList?.map((t) => `#${t}`).join(" ") || "";
}

onMount(async () => {
	// URLのクエリパラメータからフィルタリング条件を取得
	const params = new URLSearchParams(window.location.search);
	const urlTags = params.getAll("tag");
	const urlCategories = params.getAll("category");
	const uncategorized = params.has("uncategorized");

	// 全ての記事で初期化
	let filteredPosts: Post[] = [...sortedPosts];

	// タグでフィルタリング
	if (urlTags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				urlTags.some((tag) => post.data.tags.includes(tag)),
		);
	}

	// カテゴリでフィルタリング
	if (urlCategories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				post.data.category && urlCategories.includes(post.data.category),
		);
	}

	// 未分類の記事をフィルタリング
	if (uncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	// 記事を年ごとにグループ化
	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const year = post.data.published.getFullYear();
			if (!acc[year]) acc[year] = [];
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	// グループ化されたオブジェクトを配列に変換し、年で降順にソート
	groups = Object.entries(grouped)
		.map(([year, posts]) => ({
			year: Number.parseInt(year, 10),
			posts,
		}))
		.sort((a, b) => b.year - a.year);
});
</script>

<div class="card-base px-8 py-6">
    <!-- 年ごとにグループをループ -->
    {#each groups as group}
        <div>
            <!-- 年の見出し行 -->
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <!-- 年の表示 -->
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.year}
                </div>
                
                <!-- 年のマーカーポイント -->
                <div class="w-[15%] md:w-[10%]">
                    <div class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3"></div>
                </div>
                
                <!-- 記事数の統計 -->
                <div class="w-[70%] md:w-[80%] transition text-left text-50">
                    {group.posts.length} 件の記事
                </div>
            </div>

            <!-- 現在の年の記事リスト -->
            {#each group.posts as post}
                <a
                    href={getPostUrlBySlug(post.slug)}
                    aria-label={post.data.title}
                    class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- 公開日 -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDate(post.data.published)}
                        </div>

                        <!-- タイムラインマーカー -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                                        bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                                        outline outline-4 z-50
                                        outline-[var(--card-bg)]
                                        group-hover:outline-[var(--btn-plain-bg-hover)]
                                        group-active:outline-[var(--btn-plain-bg-active)]"
                            ></div>
                        </div>

                        <!-- 記事タイトル -->
                        <div
                            class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                                    group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                                    text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                        >
                            {post.data.title}
                        </div>

                        <!-- 記事タグ（大画面で表示） -->
                        <div
                            class="hidden md:block md:w-[15%] text-left text-sm transition
                                    whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            {formatTag(post.data.tags)}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>

