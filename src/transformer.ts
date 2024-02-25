import { JsonTransformer } from "./types";

type TransformerDefine<T, S> = {
	matcher: (key: string, value: unknown) => boolean;
	typeName: string;
	replace: (value: T) => S;
	revive: (value: S) => T;
};

const typeTag = "__t";
const valueTag = "__v";

type TransformedValue = {
	[typeTag]: string;
	[valueTag]: unknown;
};

function isTransformedValue(value: unknown): value is TransformedValue {
	if (
		typeof value === "object" &&
		value !== null &&
		Object.hasOwn(value, typeTag) &&
		Object.hasOwn(value, valueTag)
	) {
		return true;
	}
	return false;
}

export function createTransformer(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	transformers: TransformerDefine<any, any>[],
): JsonTransformer {
	const replacer = (key: string, value: unknown) => {
		for (let i = 0, length = transformers.length; i < length; i++) {
			const tf = transformers[i];
			if (tf.matcher(key, value)) {
				return {
					[typeTag]: tf.typeName,
					[valueTag]: tf.replace,
				};
			}
		}
		return value;
	};

	const reviver = (key: string, value: unknown) => {
		if (!isTransformedValue(value)) {
			return value;
		}
		for (let i = 0, length = transformers.length; i < length; i++) {
			const tf = transformers[i];
			if (value[typeTag] === tf.typeName) {
				return tf.revive(value[valueTag]);
			}
		}
		return value;
	};

	return { replacer, reviver };
}

const mapTf: TransformerDefine<Map<unknown, unknown>, [unknown, unknown][]> = {
	typeName: "Map",
	matcher: (_, v) => v instanceof Map,
	replace: (v) => [...v],
	revive: (v) => new Map(v),
};
const setTf: TransformerDefine<Set<unknown>, unknown[]> = {
	typeName: "Map",
	matcher: (_, v) => v instanceof Set,
	replace: (v) => [...v],
	revive: (v) => new Set(v),
};
const dateTf: TransformerDefine<Date, string> = {
	typeName: "Map",
	matcher: (_, v) => v instanceof Date,
	replace: (v) => v.toJSON(),
	revive: (v) => new Date(v),
};

export const defaultTransformer = createTransformer([mapTf, setTf, dateTf]);
export function mergeTransformer(
	first: JsonTransformer,
	next?: JsonTransformer,
) {
	if (next === undefined) {
		return first;
	}
	return {
		replacer: (key, value) => next.replacer(key, first.replacer(key, value)),
		reviver: (key, value) => next.reviver(key, first.reviver(key, value)),
	} satisfies JsonTransformer;
}
