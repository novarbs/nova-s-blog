/// <reference types="mdast" />
import { h } from "hastscript";

// 定数定義
const CONSTANTS = {
  FAVICON_API: 'https://www.google.com/s2/favicons',
  FAVICON_SIZE: 32,
  ID_PREFIX: 'LC',
  LOADING_TITLE: 'Loading...',
  LOADING_DESC: 'Loading description...',
};

// エラーメッセージ
const ERRORS = {
  INVALID_DIRECTIVE: 'Invalid directive. ("link-card" directive must be leaf type "::link-card{url="https://example.com"}")',
  INVALID_URL: 'Invalid URL. ("url" attribute must be a valid HTTP/HTTPS URL)',
};

/**
 * 一意なカードIDを生成する
 * タイムスタンプと乱数で一意性を確保する
 */
function generateCardId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${CONSTANTS.ID_PREFIX}${timestamp}${random}`;
}

/**
 * ドメイン名を安全に取り出す
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * URLが有効かどうかを検証する
 */
function isValidUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * JavaScriptへ安全に埋め込むために文字列をエスケープする
 */
function escapeForScript(str) {
  return JSON.stringify(str);
}

/**
 * メタデータ取得用のスクリプトを生成する
 * IIFEでグローバル汚染を避け、JSON.stringifyでXSSを防止する
 */
function generateMetadataScript(cardId, url, domain) {
  return `
    (function() {
      'use strict';
      try {
        const cardElement = document.getElementById('${cardId}-card');
        const titleElement = document.getElementById('${cardId}-title');
        const descElement = document.getElementById('${cardId}-description');
        
        if (!cardElement || !titleElement || !descElement) {
          console.warn('[LINK-CARD] Elements not found for ${cardId}');
          return;
        }

        // カスタム内容がない場合のみデフォルト値を設定する
        if (!titleElement.dataset.hasCustomTitle) {
          titleElement.textContent = ${escapeForScript(domain)};
        }
        if (!descElement.dataset.hasCustomDesc) {
          descElement.textContent = ${escapeForScript(`Visit ${domain}`)};
        }

        cardElement.classList.remove("fetch-waiting");
        console.log("[LINK-CARD] Loaded card for:", ${escapeForScript(url)}, "|", "${cardId}");
      } catch (err) {
        console.error("[LINK-CARD] Error loading card:", err);
        const cardEl = document.getElementById('${cardId}-card');
        if (cardEl) {
          cardEl.classList.add("fetch-error");
          cardEl.classList.remove("fetch-waiting");
        }
      }
    })();
  `;
}

/**
 * Creates a Link Card component for third-party links.
 * @param {Object} properties - The properties for the link card
 * @param {string} properties.url - The URL to link to (required)
 * @param {string} [properties.title] - Custom title for the card
 * @param {string} [properties.description] - Custom description
 * @param {string} [properties.image] - Custom image URL
 * @param {string} [properties.icon] - Custom favicon URL
 * @param {Array} children - Should be empty for leaf directive
 * @returns {Object} HAST element representing the link card
 */
export function LinkCardComponent(properties = {}, children = []) {
  // 検証：リーフディレクティブ（子要素なし）であることを確認
  if (Array.isArray(children) && children.length !== 0) {
    return h("div", { class: "hidden" }, ERRORS.INVALID_DIRECTIVE);
  }

  // URLを検証
  if (!isValidUrl(properties.url)) {
    return h("div", { class: "hidden" }, ERRORS.INVALID_URL);
  }

  const url = properties.url;
  const domain = extractDomain(url);
  const cardId = generateCardId();
  
  // カスタム属性を分割代入し、デフォルト値を設定
  const {
    title: customTitle = null,
    description: customDescription = null,
    image: customImage = null,
    icon: customIcon = null
  } = properties;

  // メタデータの取得が必要かどうかを判定
  const needsFetch = !customTitle || !customDescription;

  // favicon URLを構築（カスタムアイコンまたはGoogleのfaviconサービスを使用）
  const iconUrl = customIcon || 
    `${CONSTANTS.FAVICON_API}?domain=${encodeURIComponent(domain)}&sz=${CONSTANTS.FAVICON_SIZE}`;

  // favicon要素を作成
  const nFavicon = h(`div#${cardId}-favicon`, {
    class: "lc-favicon",
    style: `background-image: url(${iconUrl})`,
    // エラー処理：アイコンの読み込みに失敗したらデフォルトの背景色を使用
    onerror: "this.style.backgroundImage='none'; this.style.backgroundColor='#f0f0f0';"
  });

  // タイトルバーを作成
  const nTitle = h("div", { class: "lc-titlebar" }, [
    h("div", { class: "lc-titlebar-left" }, [
      h("div", { class: "lc-site" }, [
        nFavicon,
        h("div", { class: "lc-domain" }, domain),
      ]),
    ]),
    h("div", { class: "lc-external-icon" }),
  ]);

  // カードタイトルを作成
  const nCardTitle = h(
    `div#${cardId}-title`,
    { 
      class: "lc-card-title",
      ...(customTitle && { 'data-has-custom-title': 'true' })
    },
    customTitle || CONSTANTS.LOADING_TITLE
  );

  // 説明文を作成
  const nDescription = h(
    `div#${cardId}-description`,
    { 
      class: "lc-description",
      ...(customDescription && { 'data-has-custom-desc': 'true' })
    },
    customDescription || CONSTANTS.LOADING_DESC
  );

  // カード内容の配列を構築
  const cardContent = [nTitle, nCardTitle, nDescription];

  // カスタム画像がある場合は画像要素を追加
  if (customImage) {
    const nImage = h(
      `div#${cardId}-image`,
      { class: "lc-image" },
      h("img", { 
        src: customImage, 
        alt: customTitle || "Link preview",
        loading: "lazy", // 遅延読み込みを追加
        onerror: "this.style.display='none';" // 画像の読み込みに失敗したら非表示にする
      })
    );
    cardContent.push(nImage);
  }

  // メタデータの取得が必要な場合はスクリプトを追加
  if (needsFetch) {
    const nScript = h(
      `script#${cardId}-script`,
      { 
        type: "text/javascript", 
        defer: true 
      },
      generateMetadataScript(cardId, url, domain)
    );
    cardContent.push(nScript);
  }

  // リンクカードを作成して返す
  return h(
    `a#${cardId}-card`,
    {
      class: needsFetch ? "card-link fetch-waiting no-styling" : "card-link no-styling",
      href: url,
      target: "_blank",
      rel: "noopener noreferrer", // セキュリティ：新しいページからの window.opener へのアクセスを防止
      'data-url': url,
      'aria-label': `Link to ${domain}`, // アクセシビリティ：スクリーンリーダー用ラベルを追加
      title: customTitle || `Visit ${domain}` // ホバー時のツールチップを追加
    },
    cardContent
  );
}

// 後方互換性のためデフォルト関数としてエクスポート
export default LinkCardComponent;