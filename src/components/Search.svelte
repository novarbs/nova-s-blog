<script lang="ts">
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";

// デバウンス関数
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

interface SearchResult {
    url: string;
    meta: {
        title: string;
    };
    excerpt: string;
    urlPath?: string;
}

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let posts: any[] = [];

const togglePanel = () => {
    const panel = document.getElementById("search-panel");
    panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
    const panel = document.getElementById("search-panel");
    if (!panel || !isDesktop) return;

    if (show) {
        panel.classList.remove("float-panel-closed");
    } else {
        panel.classList.add("float-panel-closed");
    }
};

const highlightText = (text: string, keyword: string): string => {
    if (!keyword) return text;
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
};

// パフォーマンスを向上させるための最適化された検索関数
const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
    if (!keyword.trim()) {
        setPanelVisibility(false, isDesktop);
        result = [];
        return;
    }

    isSearching = true;

    try {
        const keywordLower = keyword.toLowerCase().trim();
        const searchResults = posts
            .filter((post) => {
                // 検索ロジックを最適化し、文字列操作を減らす
                const titleMatch = post.title.toLowerCase().includes(keywordLower);
                const descMatch = post.description?.toLowerCase().includes(keywordLower);
                const linkMatch = post.link.toLowerCase().includes(keywordLower);
                const contentMatch = post.content.toLowerCase().includes(keywordLower);
                
                return titleMatch || descMatch || linkMatch || contentMatch;
            })
            .map((post) => {
                const contentLower = post.content.toLowerCase();
                const contentIndex = contentLower.indexOf(keywordLower);
                
                let excerpt = '';
                if (contentIndex !== -1) {
                    const start = Math.max(0, contentIndex - 50);
                    const end = Math.min(post.content.length, contentIndex + 100);
                    excerpt = post.content.substring(start, end);
                    if (start > 0) excerpt = `...${excerpt}`;
                    if (end < post.content.length) excerpt = `${excerpt}...`;
                } else {
                    excerpt = post.description || `${post.content.substring(0, 150)}...`;
                }

                const postUrl = post.link.startsWith('/') ? post.link : `/posts/${post.link}/`;

                return {
                    url: url(postUrl),
                    meta: {
                        title: post.title
                    },
                    excerpt: highlightText(excerpt, keyword),
                    urlPath: postUrl
                };
            });

        result = searchResults;
        setPanelVisibility(result.length > 0, isDesktop);
    } catch (error) {
        console.error("検索エラー:", error);
        result = [];
        setPanelVisibility(false, isDesktop);
    } finally {
        isSearching = false;
    }
};

// デバウンスされた検索関数を作成
const debouncedSearch = debounce(search, 300);

onMount(async () => {
    try {
        const response = await fetch("/rss.xml");
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const items = xml.querySelectorAll("item");

        posts = Array.from(items).map((item) => {
            // content:encodedコンテンツを取得するために複数の方法を試す
            let content = "";
            const contentEncoded = 
                item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
                item.querySelector("*|encoded")?.textContent ||
                "";
            
            if (contentEncoded) {
                // HTMLタグを削除し、HTMLエンティティをデコードする
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = contentEncoded;
                content = tempDiv.textContent || tempDiv.innerText || "";
            }

            // linkから相対パスを抽出する
            const linkText = item.querySelector("link")?.textContent || "";
            let relativePath = "";
            
            // 複数の可能性のあるURLフォーマットを処理する
            if (linkText.includes("/posts/")) {
                // /posts/ 以降のすべてのコンテンツ（複数階層のパスを含む）にマッチさせる
                const match = linkText.match(/\/posts\/(.+?)(?:\/$|$)/);
                if (match) {
                    relativePath = match[1];
                }
            } else {
                // /posts/ が含まれていない場合、パスの最後の部分を取得しようと試みる
                const urlParts = linkText.split('/').filter(Boolean);
                relativePath = urlParts[urlParts.length - 1] || "";
            }

            return {
                title: item.querySelector("title")?.textContent || "",
                description: item.querySelector("description")?.textContent || "",
                content: content,
                link: relativePath,
                fullLink: linkText // 予備として完全なリンクを保持する
            };
        });
    } catch (error) {
        console.error("RSSの取得エラー:", error);
    }
});

$: if (keywordDesktop !== undefined) {
    debouncedSearch(keywordDesktop, true);
}

$: if (keywordMobile !== undefined) {
    debouncedSearch(keywordMobile, false);
}
</script>

<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="記事を検索" bind:value={keywordDesktop} on:focus={() => debouncedSearch(keywordDesktop, true)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<button on:click={togglePanel} aria-label="検索パネル" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder="検索" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    {#each result as item}
        <a href={item.url}
           class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
            <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
            </div>
            <div class="transition text-xs mb-1 font-mono text-black/40 dark:text-white/40
                        group-hover:text-black/60 dark:group-hover:text-white/60">
                {item.urlPath}
            </div>
            <div class="transition text-sm text-50">
                {@html item.excerpt}
            </div>
        </a>
    {/each}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>