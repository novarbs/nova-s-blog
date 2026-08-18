// CommitLint設定 (.github/workflows/integration.yaml の CommitLint ジョブが参照)
// メッセージ形式: "<type>: <説明>"  例: "feat: 記事カードに日付表示を追加"
export default {
	parserPreset: "conventional-changelog-conventionalcommits",
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat", // 機能追加
				"fix", // バグ修正
				"docs", // ドキュメント
				"style", // コードの見た目(動作に影響しない変更)
				"design", // サイトデザインの変更
				"content", // 記事の追加・更新
				"refactor", // リファクタリング
				"perf", // パフォーマンス改善
				"test", // テスト
				"build", // ビルド・依存関係
				"ci", // CI設定
				"chore", // 雑務
				"revert", // 取り消し
			],
		],
		"type-empty": [2, "never"],
		"subject-empty": [2, "never"],
	},
};
