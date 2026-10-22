import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

/**
 * Library pass for the TChart family.
 *
 * `TChart` and `TChartPro` externalise their engines: a consumer resolves
 * `lightweight-charts` itself. `@klinecharts/pro` ships inside `TChartPro`
 * because its drawings must attach to the very `IChartApi` that `TChart`
 * created, and a second copy of the library could not attach to it.
 *
 * `TChartPro` also pulls in `@klinecharts/pro`, which is compiled against the
 * KLineChart v9 runtime. The `klinechartsProUsesV9` plugin in `vite.config.ts`
 * redirects Pro's own `klinecharts` import to the v9 copy, so the dev server,
 * Storybook and the browser test project all resolve it correctly. The library
 * build below does not need the alias: Pro is bundled (not externalised) and
 * keeps its v9 reference intact.
 *
 * 该文件只构建 TChart 系列。
 *
 * `TChart` 与 `TChartPro` 把引擎设为 external：由下游自己解析 `lightweight-charts`。
 * `@klinecharts/pro` 随 `TChartPro` 一起打包，因为画线要挂在 `TChart` 建的那个
 * `IChartApi` 上，多带一份库就挂不上去。
 *
 * `TChartPro` 还引入 `@klinecharts/pro`，它按 KLineChart v9 运行时编译。`vite.config.ts`
 * 里的 `klinechartsProUsesV9` 插件把 Pro 自己的 `klinecharts` 引用重定向到 v9 副本，使
 * dev、Storybook 与浏览器测试 project 都能正确解析。下面的库构建不需要 alias：Pro 被打包
 * （不外链），其 v9 引用保持完整。
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
