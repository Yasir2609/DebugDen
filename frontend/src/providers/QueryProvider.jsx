import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** TanStack Query client for server state management */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Wraps the app with TanStack Query provider.
 * All useQuery/useMutation hooks must be inside this provider.
 */
export default function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
