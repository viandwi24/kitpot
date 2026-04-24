"use client";

// Polyfill React.useEffectEvent for InterwovenKit @2.8.0, which is bundled
// against a pre-release React that exposed useEffectEvent as stable. React
// 19.2 keeps it experimental, so the InterwovenKit Bridge drawer crashes at
// render with `TypeError: (0, K.useEffectEvent) is not a function`. This shim
// mimics the RFC behavior: stable function ref that always calls the latest
// callback. Mutates both the default export and the namespace object because
// bundlers disagree on which one CJS<->ESM interop hands back.
import ReactDefault, * as ReactNS from "react";

type AnyFn = (...args: unknown[]) => unknown;

function makeShim() {
  return function useEffectEvent<T extends AnyFn>(fn: T): T {
    const ref = ReactNS.useRef(fn);
    ReactNS.useInsertionEffect(() => {
      ref.current = fn;
    });
    return ReactNS.useCallback(
      ((...args: unknown[]) => ref.current(...args)) as T,
      [],
    );
  };
}

function installShim(target: unknown) {
  if (!target || typeof target !== "object") return;
  const mutable = target as Record<string, unknown>;
  if (typeof mutable.useEffectEvent === "function") return;
  try {
    mutable.useEffectEvent = makeShim();
  } catch {
    // Namespace may be frozen by the bundler; the default export path is
    // usually mutable so we rely on that one instead.
  }
}

installShim(ReactDefault);
installShim(ReactNS);
