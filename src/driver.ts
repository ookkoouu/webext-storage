import type { Browser, Storage } from "webextension-polyfill";
import type { StorageAreaName } from "./types";
import { defineDriver, parse, stringify } from "./utils";

export interface WebextDriverOptions {
	area?: StorageAreaName;
	browser?: Browser;
}

export const webext = defineDriver((opts: WebextDriverOptions = {}) => {
	const _area = opts.area ?? "local";
	const _browser = opts.browser ?? globalThis.chrome ?? globalThis.browser;
	if (_browser == null || !_browser.runtime?.id) {
		throw new Error("This script should only be loaded in a browser extension");
	}

	if (_browser.storage == null) {
		throw new Error("You must add the 'storage' permission to your manifest");
	}

	const _storage: Storage.StorageArea = _browser.storage[_area];
	if (_storage == null) {
		throw new Error(`browser.storage.${_area} is undefined`);
	}

	return {
		name: "webext",
		options: opts,
		async getItem(key) {
			// https://github.com/unjs/unstorage/issues/205
			const val = (await _storage.get(key))[key];
			return val == null ? null : stringify(val);
		},
		async getKeys() {
			return Object.keys(await _storage.get());
		},
		async hasItem(key) {
			return parse((await _storage.get(key))[key]) !== undefined;
		},
		async clear() {
			return await _storage.clear();
		},
		async removeItem(key) {
			return await _storage.remove(key);
		},
		async setItem(key, value) {
			return await _storage.set({ [key]: value });
		},
		watch(callback) {
			const cb = (changes: Storage.StorageAreaOnChangedChangesType) => {
				for (const [k, v] of Object.entries(changes)) {
					if (v.newValue === undefined) {
						callback("remove", k);
					} else {
						callback("update", k);
					}
				}
			};
			_storage.onChanged.addListener(cb);
			return () => {
				_storage.onChanged.removeListener(cb);
			};
		},
	};
});
