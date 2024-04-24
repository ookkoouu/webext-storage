import type { Browser } from "webextension-polyfill";
import type { Driver } from "./types";

declare global {
	var chrome: Browser | undefined;
	var browser: Browser | undefined;
}

function replacer(_: string, value: unknown) {
	if (typeof value === "number" && !Number.isFinite(value)) {
		if (Number.isNaN(value)) return "NaN";
		if (value === Number.POSITIVE_INFINITY) return "Infinity";
		if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
	}
	if (value === undefined) return "undefined";
	return value;
}

function reviver(_: string, value: unknown) {
	if (typeof value === "string" && value.length <= 9) {
		switch (value.toLocaleLowerCase()) {
			case "true":
				return true;
			case "false":
				return false;
			case "undefined":
				return undefined;
			case "null":
				return null;
			case "nan":
				return Number.NaN;
			case "infinity":
				return Number.POSITIVE_INFINITY;
			case "-infinity":
				return Number.NEGATIVE_INFINITY;
		}
	}
	return value;
}

type DriverFactory<T> = (opts: T) => Driver;
export function defineDriver<T>(factory: DriverFactory<T>): DriverFactory<T> {
	return factory;
}

/**
 * @link
 */
// https://github.com/fastify/secure-json-parse
// https://github.com/hapijs/bourne
const suspectProtoRx =
	/"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx =
	/"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;

const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;

function jsonParseTransform(key: string, value: unknown): unknown {
	if (
		key === "__proto__" ||
		(key === "constructor" &&
			value &&
			typeof value === "object" &&
			"prototype" in value)
	) {
		warnKeyDropped(key);
		return;
	}
	return value;
}

function warnKeyDropped(key: string): void {
	console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}

type Options = {
	strict?: boolean;
};

function destr<T = unknown>(value: unknown, options: Options = {}): T {
	if (typeof value !== "string") {
		return value as T;
	}

	const _value = value.trim();
	if (
		// eslint-disable-next-line unicorn/prefer-at
		value[0] === '"' &&
		value.endsWith('"') &&
		!value.includes("\\")
	) {
		return _value.slice(1, -1) as T;
	}

	if (_value.length <= 9) {
		const _lval = _value.toLowerCase();
		if (_lval === "true") {
			return true as T;
		}
		if (_lval === "false") {
			return false as T;
		}
		if (_lval === "undefined") {
			return undefined as T;
		}
		if (_lval === "null") {
			// eslint-disable-next-line unicorn/no-null
			return null as T;
		}
		if (_lval === "nan") {
			return Number.NaN as T;
		}
		if (_lval === "infinity") {
			return Number.POSITIVE_INFINITY as T;
		}
		if (_lval === "-infinity") {
			return Number.NEGATIVE_INFINITY as T;
		}
	}

	if (!JsonSigRx.test(value)) {
		if (options.strict) {
			throw new SyntaxError("[destr] Invalid JSON");
		}
		return value as T;
	}

	try {
		if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
			if (options.strict) {
				throw new Error("[destr] Possible prototype pollution");
			}
			return JSON.parse(value, jsonParseTransform);
		}
		return JSON.parse(value, reviver);
	} catch (error) {
		if (options.strict) {
			throw error;
		}
		return value as T;
	}
}

export function stringify(value: unknown): string {
	if (
		value === null ||
		!(typeof value === "object" || typeof value === "function")
	) {
		return String(value);
	}
	return JSON.stringify(value, replacer);
}

export function parse<T>(value: string): T {
	return destr(value);
}
