import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: true,
			staleTime: 30 * 1000, // 30 seconds — ensures fresh data on page nav
			retry: 1,
		},
	},
});