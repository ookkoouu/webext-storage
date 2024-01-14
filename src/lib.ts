import type { StorageAreaName } from "./types";

export function overwriteDefault<
  A extends Record<string, unknown>,
  B extends Partial<A>,
>(base: A, overwrites?: B): A {
  if (!overwrites) {
    return base;
  }

  const filteredOverwrites = Object.fromEntries(
    Object.entries(overwrites).filter(
      ([k, v]) => Object.hasOwn(base, k) && v !== undefined,
    ),
  );
  return { ...base, ...filteredOverwrites };
}

export const getExtensionStorage = (area: StorageAreaName) =>
  globalThis.chrome?.storage[area] ?? globalThis.browser?.storage[area];

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

type CompositeStringify<T extends string, V> = {
  dataType: T;
  value: V;
};

type MapString<K extends string, V> = CompositeStringify<"Map", Array<[K, V]>>;
type SetString<V> = CompositeStringify<"Set", V[]>;

export function isMapStr<T>(value: unknown): value is MapString<string, T> {
  return (
    isObject(value) &&
    Object.hasOwn(value, "dataType") &&
    value.dataType === "Map" &&
    Object.hasOwn(value, "value") &&
    Array.isArray(value.value)
  );
}

export function isSetStr<T>(value: unknown): value is SetString<T> {
  return (
    isObject(value) &&
    Object.hasOwn(value, "dataType") &&
    value.dataType === "Set" &&
    Object.hasOwn(value, "value") &&
    Array.isArray(value.value)
  );
}
