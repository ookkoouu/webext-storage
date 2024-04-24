import type { Unwatch, WatchCallback, Driver as _Driver } from "unstorage";
import type { Storage } from "webextension-polyfill";

export type { Unwatch } from "unstorage";
export type { WatchCallback } from "@okou/unstorage-map-set-kv";

type PrimitiveValue = null | string | number | boolean;
type ObjectValue = { [key: string]: StorageValue };
type ArrayValue = StorageValue[];
export type StorageValue = PrimitiveValue | ObjectValue | ArrayValue;

export type StorageAreaName = keyof Pick<
	Storage.Static,
	"local" | "sync" | "session"
>;

export interface Driver extends _Driver {
	watch: (callback: WatchCallback) => Unwatch;
}
