import { describe, expect, it } from "vitest";
import { TCHART_DEFAULTS } from "./components/lightweight-charts/t-chart-options";
import { DARK_THEME, LIGHT_THEME, withAlpha } from "./theme";

describe("withAlpha", () => {
	it("turns a 6-digit hex into rgba", () => {
		expect(withAlpha("#26a69a", 0.2)).toBe("rgba(38, 166, 154, 0.2)");
	});

	it("expands the 3-digit shorthand", () => {
		expect(withAlpha("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
	});

	it("never concatenates onto a colour it cannot parse", () => {
		// The bug this replaces was `${upColor}33`, which produced `rgb()33` — an
		// invalid value the engines then rejected silently.
		// 它取代的缺陷是 `${upColor}33`，会拼出 `rgb()33` 这种引擎只能静默拒绝的值。
		expect(withAlpha("rgb(38, 166, 154)", 0.2)).toBe(
			"color-mix(in srgb, rgb(38, 166, 154) 20%, transparent)",
		);
		expect(withAlpha("rebeccapurple", 0.5)).toContain("color-mix");
	});

	it("clamps opacity into the representable range", () => {
		expect(withAlpha("#000000", -3)).toBe("rgba(0, 0, 0, 0)");
		expect(withAlpha("#000000", 9)).toBe("rgba(0, 0, 0, 1)");
	});
});

describe("Theme tokens", () => {
	it("keeps one green and one red across every part that colours by direction", () => {
		// The defect this module exists to make unrepresentable: candles painted
		// #26a69a while the volume pane below them painted #34d399.
		// 这个模块要让「无法表达」的缺陷：蜡烛是 #26a69a，下方的成交量却是 #34d399。
		const up = [
			TCHART_DEFAULTS.upColor,
			TCHART_DEFAULTS.wickUpColor,
			TCHART_DEFAULTS.volumeUpColor,
		];
		const down = [
			TCHART_DEFAULTS.downColor,
			TCHART_DEFAULTS.wickDownColor,
			TCHART_DEFAULTS.volumeDownColor,
		];
		expect(new Set(up)).toEqual(new Set([LIGHT_THEME.trendUp]));
		expect(new Set(down)).toEqual(new Set([LIGHT_THEME.trendDown]));
	});

	it("shares the trend colours between modes but not the chrome", () => {
		expect(DARK_THEME.trendUp).toBe(LIGHT_THEME.trendUp);
		expect(DARK_THEME.gridLine).not.toBe(LIGHT_THEME.gridLine);
	});
});
