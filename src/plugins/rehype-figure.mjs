import { h } from "hastscript";
import { visit } from "unist-util-visit";

export default function rehypeFigure() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "img") return;

			const src = node.properties?.src;
			const alt = node.properties?.alt;
			if (!src) return;

			// <markdown-image> コンポーネントノードを作成
			const markdownImageNode = h("markdown-image", { src, alt: alt || "" });

			// 置き換え
			if (parent && typeof index === "number") {
				parent.children[index] = markdownImageNode;
			}
		});
	};
}
