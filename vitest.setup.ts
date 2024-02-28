import { vi } from "vitest";
import browser from "webextension-polyfill";

globalThis.browser = browser;
vi.mock("webextension-polyfill");
