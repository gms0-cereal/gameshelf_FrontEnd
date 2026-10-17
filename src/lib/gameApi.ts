import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export interface GameListItem {
  id: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  game_type: "base" | "dlc" | "expansion";
  genres?: string[]; // add "genres" to GameListSerializer on the backend to fill this
}

export interface GameDetail extends GameListItem {
  description: string | null;
  banner_image_url: string | null;
  parent_game: number | null;
  genres: string[];
  tags: string[];
  developers: string[];
  publishers: string[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const gameApi = createApi({
  reducerPath: "gameApi",
  baseQuery,
  tagTypes: ["game"],
  endpoints: (builder) => ({
    //api/v1/games/?page=1
    getGames: builder.query<Paginated<GameListItem>, { page?: number } | void>({
      query: (params) => {
        const queryString = new URLSearchParams({
          page: String(params?.page ?? 1),
        }).toString();
        return {
          url: `/games/?${queryString}`,
          method: "GET",
        };
      },
      providesTags: (result) => [
        ...(result?.results ?? []).map(({ id }) => ({ type: "game" as const, id })),
        { type: "game" as const, id: "LIST" },
      ],
      keepUnusedDataFor: 300,
    }),
    //api/v1/games/<id>/
    getGame: builder.query<GameDetail, number>({
      query: (id) => ({
        url: `/games/${id}/`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "game", id }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetGamesQuery, useGetGameQuery } = gameApi;