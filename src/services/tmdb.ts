import { Movie, Genre } from "@/types/movie";
// @ts-ignore
import freekeys from "freekeys";

const BASE_URL = "https://api.themoviedb.org/3";
let cachedApiKey: string | null = null;

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  
  try {
    const keys = await freekeys();
    cachedApiKey = keys.tmdb_key;
    return cachedApiKey;
  } catch (error) {
    console.error("Error fetching API key:", error);
    throw new Error("Failed to fetch API key");
  }
}

export const tmdbService = {
  async getTrending(): Promise<Movie[]> {
    try {
      const apiKey = await getApiKey();
      const response = await fetch(
        `${BASE_URL}/trending/movie/week?api_key=${apiKey}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      return [];
    }
  },

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const apiKey = await getApiKey();
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error searching movies:", error);
      return [];
    }
  },

  async getMovieDetails(id: number): Promise<Movie | null> {
    try {
      const apiKey = await getApiKey();
      const response = await fetch(
        `${BASE_URL}/movie/${id}?api_key=${apiKey}`
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching movie details:", error);
      return null;
    }
  },

  async getGenres(): Promise<Genre[]> {
    try {
      const apiKey = await getApiKey();
      const response = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${apiKey}`
      );
      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error("Error fetching genres:", error);
      return [];
    }
  },

  async getMoviesByGenre(genreId: number): Promise<Movie[]> {
    try {
      const apiKey = await getApiKey();
      const response = await fetch(
        `${BASE_URL}/discover/movie?api_key=${apiKey}&with_genres=${genreId}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching movies by genre:", error);
      return [];
    }
  },
};
