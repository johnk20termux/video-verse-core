export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  runtime?: number;
  genres?: { id: number; name: string }[];
  imdb_id?: string;
  media_type?: "movie" | "tv";
}

export interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  seasons?: Season[];
  external_ids?: {
    imdb_id?: string;
  };
}

export interface Season {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
}

export interface Genre {
  id: number;
  name: string;
}
