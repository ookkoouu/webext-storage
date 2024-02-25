import { useCallback, useEffect, useRef, useState } from "react";
import type { Storage } from "../storage";
import { IStorage, Watchable } from "../types";

export type StorageHook<T> = readonly [
	T,
	Omit<IStorage<T>, keyof Watchable<T>>,
];

export const useStorage = <T>(instance: Storage<T>): StorageHook<T> => {
	const isMounted = useRef(false);
	const [renderValue, setRenderValue] = useState<T>(instance.defaultValue);

	const set = useCallback(async (value: T) => instance.set(value), [instance]);
	const setSync = useCallback((value: T) => instance.set(value), [instance]);
	const get = useCallback(async () => instance.get(), [instance]);
	const getSync = useCallback(() => instance.getSync(), [instance]);
	const reset = useCallback(async () => instance.reset(), [instance]);

	useEffect(() => {
		isMounted.current = true;
		instance
			.get()
			.then((v) => setRenderValue(v))
			.catch();
		const unwatcher = instance.watch((newValue) => {
			if (isMounted.current) {
				setRenderValue(newValue);
			}
		});

		return () => {
			isMounted.current = false;
			unwatcher();
		};
	}, [instance]);

	return [renderValue, { set, setSync, get, getSync, reset }] as const;
};
