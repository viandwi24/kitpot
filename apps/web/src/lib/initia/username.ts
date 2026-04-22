const INITIA_REST = "https://rest.initia.xyz";
const cache = new Map<string, { value: string | null; expires: number }>();
const CACHE_TTL = 60_000; // 60s

async function fetchWithCache(key: string, fetcher: () => Promise<string | null>): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  try {
    const value = await fetcher();
    cache.set(key, { value, expires: Date.now() + CACHE_TTL });
    return value;
  } catch {
    return null;
  }
}

/** Resolve address → .init username */
export async function getUsername(address: string): Promise<string | null> {
  return fetchWithCache(`name:${address}`, async () => {
    const res = await fetch(`${INITIA_REST}/indexer/pair/v1/usernames?address=${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.username || data?.name || null;
  });
}

/** Resolve .init username → address */
export async function resolveUsername(name: string): Promise<string | null> {
  // Strip .init suffix if present
  const cleanName = name.replace(/\.init$/, "");

  return fetchWithCache(`addr:${cleanName}`, async () => {
    const res = await fetch(`${INITIA_REST}/indexer/pair/v1/addresses?name=${cleanName}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.address || null;
  });
}
