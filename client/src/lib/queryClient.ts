import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(preferUserToken: boolean = false): HeadersInit {
  const headers: HeadersInit = {};
  const adminToken = localStorage.getItem("admin_token");
  const userToken = localStorage.getItem("user_token");

  // Detect context based on URL path
  const isAdminPath = window.location.pathname.startsWith("/admin");

  if (isAdminPath && adminToken) {
    // Admin pages use admin token
    headers["Authorization"] = `Bearer ${adminToken}`;
  } else if (userToken) {
    // User pages use user token
    headers["Authorization"] = `Bearer ${userToken}`;
  } else if (adminToken) {
    // Fallback to admin token if no user token
    headers["Authorization"] = `Bearer ${adminToken}`;
  }

  return headers;
}

export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<any> {
  // If explicit Authorization header is provided in options, use it
  // Otherwise, use default auth headers
  const optionHeaders = options?.headers as Record<string, string> | undefined;
  const hasExplicitAuth = optionHeaders?.Authorization || optionHeaders?.authorization;

  const defaultHeaders = hasExplicitAuth ? {} : getAuthHeaders();

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Return JSON if response has content
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: authHeaders,
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
