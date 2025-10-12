import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: tmdbService.getGenres,
  });

  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: tmdbService.getTrending,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => tmdbService.searchMovies(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: genreMovies = [] } = useQuery({
    queryKey: ["genre", selectedGenre],
    queryFn: () => tmdbService.getMoviesByGenre(Number(selectedGenre)),
    enabled: selectedGenre !== "all",
  });

  const displayMovies = searchQuery
    ? searchResults
    : selectedGenre !== "all"
    ? genreMovies
    : trendingMovies;

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4">
        {/* Search and Filter */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold mb-8">Browse Movies</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {displayMovies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No movies found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
