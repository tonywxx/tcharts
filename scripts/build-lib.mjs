import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

/**
 * Library pass for the TChart family.
 *
 * `TChart` and `TChartPro` externalise their engine: a consumer resolves
 * `lightweight-charts` itself, and that is the only engine in the bundle.
 *
 * The Pro layer of the v9 generation — the one this repo's Pro layer was ported
 * from — is a design reference, not a runtime import: `TChartPro` reimplements
 * that layer on top of `lightweight-charts` (its drawings attach to the very
 * `IChartApi` that `TChart` created, and a second copy of the library could not
 * attach to it). So no klinecharts, and no v9 engine, is pulled in here.
 *
 * 该文件只构建 TChart 系列。
 *
 * `TChart` 与 `TChartPro` 把引擎设为 external：由下游自己解析 `lightweight-charts`。
 * 产物里只有这一个引擎。
 *
 * v9 那一代的 Pro 层（本仓库 Pro 层的移植来源）是设计参照，不是运行时引入：`TChartPro`
 * 在 `lightweight-charts` 之上重新实现了那一层（画线要挂在 `TChart` 建的那个 `IChartApi`
 * 上，多带一份库就挂不上去）。因此这里不会引入 klinecharts，也没有 v9 引擎。
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENTRIES = {
	"t-chart": "src/components/lightweight-charts/TChart.tsx",
};

const TPRO_ENTRY = {
	"t-chart-pro": "src/components/lightweight-charts-pro/TChartPro.tsx",
};

const isReact = (id) => id === "react" || id === "react-dom" || /^react(-dom)?\//.test(id);
const isEngine = (id) => id === "lightweight-charts";

/**
 * @param {Record<string, string>} entry
 * @param {{ external: (id: string) => boolean, first?: boolean }} policy
 */
async function libPass(entry, { external, first }) {
	await build({
		root,
		logLevel: "info",
		plugins: [react()],
		build: {
			// Only the first pass clears `dist`; the others add to it.
			// 只有第一遍清空 `dist`；其余各遍在其上追加。
			emptyOutDir: Boolean(first),
			lib: {
				entry: Object.fromEntries(
					Object.entries(entry).map(([name, file]) => [name, path.resolve(root, file)]),
				),
				formats: ["es"],
				fileName: (_format, entryName) => `${entryName}.js`,
			},
			rollupOptions: { external },
		},
	});
}

await libPass(ENTRIES, { external: (id) => isReact(id) || isEngine(id), first: true });
// `TChartPro` bundles `lightweight-charts-drawing`, but must keep the chart
// library itself external: the drawings attach to the very `IChartApi` that
// `TChart` created, and a second copy of the library could not attach to it.
// `TChartPro` 把 `lightweight-charts-drawing` 打包进来，但图表库本身必须外链：画线要挂在
// `TChart` 建的那个 `IChartApi` 上，多带一份库就挂不上去。
await libPass(TPRO_ENTRY, { external: (id) => isReact(id) || id === "lightweight-charts" });
