import { useCallback, useEffect, useState } from "react";
import type { Storage } from "../storage";
import type { StorageValue } from "../types";

export type StorageHook<T> = readonly [
	value: T | undefined,
	setValue: (value: T) => Promise<void>,
];

export const useStorage = <T extends StorageValue>(
	storage: Storage<T>,
	init?: T,
): StorageHook<T> => {
	const [renderValue, setRenderValue] = useState(init);

	const set = useCallback(async (value: T) => storage.set(value), [storage]);

	useEffect(() => {
		(async () => {
			setRenderValue(await storage.get());
		})();

		const unwatch = storage.watch((newValue) => {
			setRenderValue(newValue);
		});

		return () => {
			unwatch();
		};
	}, [storage]);

	return [renderValue, set] as const;
};
