import { describe, expect, it } from "vitest";
import { jsxSource } from "./jsx-source";

const DEFAULTS = {
	theme: "light",
	height: 400,
	showGrid: true,
	indicators: [{ name: "MA" }, { name: "VOL" }],
};

describe("jsxSource", () => {
	it("prints a story that overrides nothing as a bare tag", () => {
		// The truth about such a story: every prop it has is the documented default.
		// 这样的 story 的实话：它的每个属性都是有文档的默认值。
		expect(jsxSource("TChart", { ...DEFAULTS }, DEFAULTS)).toBe("<TChart />");
	});

	it("keeps only the props that differ from the defaults", () => {
		const code = jsxSource("TChart", { ...DEFAULTS, height: 480 }, DEFAULTS);
		expect(code).toBe("<TChart\n  height={480}\n/>");
	});

	it("keeps a prop the defaults never mention, even when it is falsy", () => {
		const code = jsxSource("TChart", { ...DEFAULTS, watermark: "", scrollEnabled: false }, DEFAULTS);
		expect(code).toBe('<TChart\n  watermark=""\n  scrollEnabled={false}\n/>');
	});

	it("writes strings as JSX attributes rather than as braced expressions", () => {
		const code = jsxSource("TChartPro", { ...DEFAULTS, theme: "dark" }, DEFAULTS);
		expect(code).toBe('<TChartPro\n  theme="dark"\n/>');
	});

	it("falls back to braces for a string JSX cannot write as an attribute", () => {
		const code = jsxSource("TChart", { ...DEFAULTS, watermark: 'say "hi"' }, DEFAULTS);
		expect(code).toBe('<TChart\n  watermark={"say \\"hi\\""}\n/>');
	});

	it("keeps a short array on one line with bare keys", () => {
		const code = jsxSource(
			"TChart",
			{ indicators: [{ name: "MA" }, { name: "VOL" }] },
			{ ...DEFAULTS, indicators: [{ name: "MA" }] },
		);
		expect(code).toBe('<TChart\n  indicators={[{name: "MA"}, {name: "VOL"}]}\n/>');
	});

	it("stacks a long array, closing back at the prop's own column", () => {
		const code = jsxSource(
			"TChart",
			{
				indicators: [
					{ name: "EMA", stack: true },
					{ name: "vol-main", stack: true },
					{ name: "MACD", paneId: "macd_pane" },
					{ name: "RSI", paneId: "rsi_pane" },
					{ name: "KDJ", paneId: "kdj_pane" },
				],
			},
			DEFAULTS,
		);
		expect(code).toBe(
			[
				"<TChart",
				"  indicators={[",
				'    {name: "EMA", stack: true},',
				'    {name: "vol-main", stack: true},',
				'    {name: "MACD", paneId: "macd_pane"},',
				'    {name: "RSI", paneId: "rsi_pane"},',
				'    {name: "KDJ", paneId: "kdj_pane"}',
				"  ]}",
				"/>",
			].join("\n"),
		);
	});

	it("indents nested containers one level deeper each", () => {
		const code = jsxSource(
			"TChartPro",
			{
				styles: {
					candle: {
						type: "area",
						area: { lineColor: "#22d3ee", smooth: true },
						bar: { upColor: "#ef4444", downColor: "#10b981" },
					},
				},
			},
			DEFAULTS,
		);
		expect(code).toBe(
			[
				"<TChartPro",
				"  styles={{",
				"    candle: {",
				'      type: "area",',
				'      area: {lineColor: "#22d3ee", smooth: true},',
				'      bar: {upColor: "#ef4444", downColor: "#10b981"}',
				"    }",
				"  }}",
				"/>",
			].join("\n"),
		);
	});

	it("drops props it cannot write instead of printing something untrue", () => {
		const code = jsxSource("TChart", { onChartReady: () => 1, dataLoader: undefined }, DEFAULTS);
		expect(code).toBe("<TChart />");
	});
});