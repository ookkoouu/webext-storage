import { describe, expect, it, vi } from "vitest";
import { webext } from "../src/driver";
import { fakeBrowser } from "./browser";
import { testDriver } from "./utils";

describe("driver: baseline", () => {
	testDriver({
		driver: webext({ browser: fakeBrowser }),
	});
});

describe("driver: watch", async () => {
	fakeBrowser.reset();
	const driver = webext({ browser: fakeBrowser });
	const mockCb = vi.fn();
	await driver.watch?.(mockCb);

	it("update", async () => {
		await driver.setItem?.("key", "testValue", {});
		expect(mockCb).toHaveBeenLastCalledWith("update", "key");
	});
	it("remove", async () => {
		await driver.removeItem?.("key", {});
		expect(mockCb).toHaveBeenLastCalledWith("remove", "key");
	});
});
