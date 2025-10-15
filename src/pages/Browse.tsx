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
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: tmdbService.getGenres,
  });

  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trending", "movie"],
    queryFn: tmdbService.getTrending,
    enabled: mediaType === "movie",
  });

  const { data: trendingSeries = [] } = useQuery({
    queryKey: ["trending", "tv"],
    queryFn: tmdbService.getTrendingSeries,
    enabled: mediaType === "tv",
  });

  const { data: movieSearchResults = [] } = useQuery({
    queryKey: ["search", "movie", searchQuery],
    queryFn: () => tmdbService.searchMovies(searchQuery),
    enabled: searchQuery.length > 0 && mediaType === "movie",
  });

  const { data: seriesSearchResults = [] } = useQuery({
    queryKey: ["search", "tv", searchQuery],
    queryFn: () => tmdbService.searchSeries(searchQuery),
    enabled: searchQuery.length > 0 && mediaType === "tv",
  });

  const { data: genreMovies = [] } = useQuery({
    queryKey: ["genre", selectedGenre],
    queryFn: () => tmdbService.getMoviesByGenre(Number(selectedGenre)),
    enabled: selectedGenre !== "all" && mediaType === "movie",
  });

  const displayItems = searchQuery
    ? (mediaType === "movie" ? movieSearchResults : seriesSearchResults)
    : selectedGenre !== "all"
    ? genreMovies
    : (mediaType === "movie" ? trendingMovies : trendingSeries);

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4">
        {/* Search and Filter */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold mb-8">
            Browse {mediaType === "movie" ? "Movies" : "Series"}
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={mediaType === "movie" ? "default" : "outline"}
                onClick={() => setMediaType("movie")}
              >
                Movies
              </Button>
              <Button
                variant={mediaType === "tv" ? "default" : "outline"}
                onClick={() => setMediaType("tv")}
              >
                Series
              </Button>
            </div>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder={`Search for ${mediaType === "movie" ? "movies" : "series"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {mediaType === "movie" && (
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
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayItems.map((item: any) => (
            <MovieCard 
              key={item.id} 
              movie={{
                ...item,
                title: item.title || item.name,
                release_date: item.release_date || item.first_air_date,
                media_type: mediaType,
              }} 
            />
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No {mediaType === "movie" ? "movies" : "series"} found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
