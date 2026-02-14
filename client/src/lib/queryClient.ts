import { QueryClient, QueryFunction } from "@tanstack/react-query";

function detectCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).Capacitor) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') return true;
  return false;
}

const isCapacitor = detectCapacitor();
const API_BASE = isCapacitor ? 'https://offchat.replit.app' : '';
const WS_BASE = isCapacitor ? 'wss://offchat.replit.app' : '';

if (isCapacitor) {
  console.log('[Offchat] Running in Capacitor mode, hostname:', window.location.hostname, 'API base:', API_BASE);
}

export function getApiUrl(path: string): string {
  if (isCapacitor && path.startsWith('/api')) {
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

if (isCapacitor && typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/api')) {
      console.log('[Offchat] Intercepting fetch:', input, '->', API_BASE + input);
      return originalFetch(API_BASE + input, {
        ...init,
        credentials: 'include',
      });
    }
    return originalFetch(input, init);
  } as typeof fetch;
}

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
  const res = await fetch(getApiUrl(url), {
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
    const url = queryKey.join("/") as string;
    const res = await fetch(getApiUrl(url), {
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
