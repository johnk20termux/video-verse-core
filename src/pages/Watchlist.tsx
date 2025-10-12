import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import MovieCard from "@/components/MovieCard";
import { Bookmark, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Watchlist = () => {
  const [watchlist] = useLocalStorage<number[]>("watchlist", []);
  const [watched] = useLocalStorage<number[]>("watched", []);

  const { data: watchlistMovies = [] } = useQuery({
    queryKey: ["watchlist", watchlist],
    queryFn: async () => {
      const movies = await Promise.all(
        watchlist.map((id) => tmdbService.getMovieDetails(id))
      );
      return movies.filter((movie) => movie !== null);
    },
    enabled: watchlist.length > 0,
  });

  const { data: watchedMovies = [] } = useQuery({
    queryKey: ["watched", watched],
    queryFn: async () => {
      const movies = await Promise.all(
        watched.map((id) => tmdbService.getMovieDetails(id))
      );
      return movies.filter((movie) => movie !== null);
    },
    enabled: watched.length > 0,
  });

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">My Library</h1>

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="watchlist" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Watchlist ({watchlist.length})
            </TabsTrigger>
            <TabsTrigger value="watched" className="gap-2">
              <Eye className="w-4 h-4" />
              Watched ({watched.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist">
            {watchlistMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {watchlistMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                <p className="text-muted-foreground">
                  Add movies to your watchlist to watch them later
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watched">
            {watchedMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {watchedMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No watched movies yet</h3>
                <p className="text-muted-foreground">
                  Mark movies as watched to keep track of what you've seen
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Watchlist;
