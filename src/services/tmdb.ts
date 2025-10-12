import { Movie, Genre } from "@/types/movie";

const API_KEY = "YOUR_TMDB_API_KEY"; // Users will need to add their own
const BASE_URL = "https://api.themoviedb.org/3";

export const tmdbService = {
  async getTrending(): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
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
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
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
      const response = await fetch(
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}`
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching movie details:", error);
      return null;
    }
  },

  async getGenres(): Promise<Genre[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
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
      const response = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
      );
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching movies by genre:", error);
      return [];
    }
  },
};
