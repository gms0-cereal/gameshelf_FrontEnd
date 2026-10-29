import { createApi } from '@reduxjs/toolkit/query/react';
import api from '../lib/api'; // Point to your existing custom Axios instance

// Custom baseQuery using your existing Axios instance
const axiosBaseQuery = () => async ({ url, method, data, params }: { url: string; method?: string; data?: any; params?: any }) => {
  try {
    const result = await api({ url, method: method || 'GET', data, params });
    return { data: result.data };
  } catch (axiosError: any) {
    return {
      error: {
        status: axiosError.response?.status,
        data: axiosError.response?.data || axiosError.message,
      },
    };
  }
};

export const gameShelfApi = createApi({
  reducerPath: 'gameShelfApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Games', 'Profile', 'Reviews'],
  endpoints: (builder) => ({
    // Get general game list with optional pagination/expansion
    getGameList: builder.query({
      query: (params?: { limit?: number; last_appid?: number; expand?: string }) => ({
        url: 'games/steam/',
        params,
      }),
      providesTags: ['Games'],
    }),

    // Browse games with filtering (genres, platform, year, sort, search query)
    getGameBrowse: builder.query({
      query: (params?: { q?: string; genre?: string; platform?: string; year?: number; sort?: string; page?: number }) => ({
        url: 'games/steam/browse/',
        params,
      }),
    }),

    // Get specific game details by App ID
    getGameDetails: builder.query({
      query: (appId: number | string) => ({
        url: `games/steam/${appId}/`,
      }),
      keepUnusedDataFor: 600, // Keep in memory cache for 10 minutes
    }),

    // Get batch game summaries for hero panels or user shelves
    getGameSummaries: builder.query({
      query: (appIdsString: string) => ({
        url: 'games/steam/summaries/',
        params: { appids: appIdsString },
      }),
    }),
  }),
});

export const {
  useGetGameListQuery,
  useGetGameBrowseQuery,
  useGetGameDetailsQuery,
  useGetGameSummariesQuery,
} = gameShelfApi;