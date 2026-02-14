import { QueryClient, QueryFunction } from "@tanstack/react-query";

const isCapacitor = typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
   window.location.protocol === 'ionic:' ||
   !!(window as any).Capacitor ||
   (window.location.hostname === 'localhost' && typeof (window as any).AndroidBridge !== 'undefined'));

const API_BASE = isCapacitor ? 'https://offchat.app' : '';
const WS_BASE = isCapacitor ? 'wss://offchat.app' : '';

export function getApiUrl(path: string): string {
  if (path.startsWith('/api')) {
    return API_BASE + path;
  }
  return path;
}

export function getWebSocketUrl(): string {
  if (isCapacitor) {
    return WS_BASE + '/ws';
  }
  const currentUrl = new URL(window.location.href);
  return `${currentUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${currentUrl.host}/ws`;
}

const originalFetch = window.fetch.bind(window);
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/api')) {
    return originalFetch(getApiUrl(input), init);
  }
  if (input instanceof Request && input.url.startsWith('/api')) {
    return originalFetch(getApiUrl(input.url), { ...init, method: input.method, headers: input.headers, body: input.body });
  }
  return originalFetch(input, init);
} as typeof fetch;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
