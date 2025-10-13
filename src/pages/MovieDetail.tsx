import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, BookmarkCheck, Star, Clock } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [watchlist, setWatchlist] = useLocalStorage<number[]>("watchlist", []);
  const [watched, setWatched] = useLocalStorage<number[]>("watched", []);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => tmdbService.getMovieDetails(Number(id)),
  });

  const isInWatchlist = watchlist.includes(Number(id));
  const isWatched = watched.includes(Number(id));

  const toggleWatchlist = () => {
    if (isInWatchlist) {
      setWatchlist(watchlist.filter((movieId) => movieId !== Number(id)));
      toast.success("Removed from watchlist");
    } else {
      setWatchlist([...watchlist, Number(id)]);
      toast.success("Added to watchlist");
    }
  };

  const toggleWatched = () => {
    if (isWatched) {
      setWatched(watched.filter((movieId) => movieId !== Number(id)));
      toast.success("Marked as unwatched");
    } else {
      setWatched([...watched, Number(id)]);
      toast.success("Marked as watched");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!movie) {
    return <div className="min-h-screen flex items-center justify-center">Movie not found</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-end">
        <div className="absolute inset-0 hero-gradient" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: movie.backdrop_path
              ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
              : undefined,
          }}
        />
        
        <div className="container mx-auto px-4 pb-12 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-4">{movie.title}</h1>
            
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
              </div>
              
              {movie.runtime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>{movie.runtime} min</span>
                </div>
              )}
              
              <span>{new Date(movie.release_date).getFullYear()}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Button size="lg" className="gap-2 glow-primary">
                <Play className="w-5 h-5" fill="currentColor" />
                Play
              </Button>
              
              <Button
                size="lg"
                variant="secondary"
                onClick={toggleWatchlist}
                className="gap-2"
              >
                {isInWatchlist ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
                Watchlist
              </Button>

              <Button
                size="lg"
                variant={isWatched ? "default" : "secondary"}
                onClick={toggleWatched}
              >
                {isWatched ? "Watched" : "Mark as Watched"}
              </Button>
            </div>

            {movie.genres && (
              <div className="flex gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-full bg-secondary text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
        </div>
      </section>
    </div>
  );
};

export default MovieDetail;
