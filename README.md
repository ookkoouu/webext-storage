# webext-storage

`@ookkoouu/webext-storage` is a utility library of Web-Extension Storage API for realistic use cases inspired by [@plasmohq/storage](https://github.com/PlasmoHQ/storage).

## Features

- Context syncing (Contents, Popup, Background)
- Collections (Map, Set)
- Key-Value
- React Hooks

## Example

### Normal

```ts
import { Storage } from "@ookkoouu/webext-storage";

// Default value required
const storage = new Storage("normal", 123, { area: "local" });

storage.get();
storage.getSync();
storage.set(456);
storage.setSync(456);
storage.reset();
```

### KV

```ts
import { KVStorage } from "../src";

const kv = {
  useFor: "config",
  appEnable: true,
  days: 100,
};

const storage = new KVStorage("kv", kv);
let appEnable: boolean = storage.get("appEnable");
// @ts-expect-error
storage.set("days", "120");

// Listen changes by key
storage.watch({
  key: "appEnable",
  callback: (c) => {
    let b: boolean = c.newValue;
  },
});
```

### Hooks

```jsx
import { useKVStorage } from "@ookkoouu/webext-storage/react";

const kv = {
  useFor: "config",
  appEnable: true,
  days: 100,
};
const storage = new KVStorage("kv", kv);

const Component = () => {
  const [config, setConfig] = useKVStorage(storage);

  return (
    <Checkbox
      isChecked={config.appEnable}
      onChange={() => setConfig("appEnable", !config.appEnable)}
    >
      App enable
    </Checkbox>
  );
};
```
