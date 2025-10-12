import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: tmdbService.getTrending,
  });

  const featuredMovie = trendingMovies[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {featuredMovie && (
        <section className="relative h-[80vh] flex items-center">
          <div className="absolute inset-0 hero-gradient" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: featuredMovie.backdrop_path
                ? `url(https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path})`
                : undefined,
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10 animate-fade-in">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-bold mb-4 leading-tight">
                {featuredMovie.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 line-clamp-3">
                {featuredMovie.overview}
              </p>
              <div className="flex items-center gap-4">
                <Link to={`/movie/${featuredMovie.id}`}>
                  <Button size="lg" className="gap-2 glow-primary">
                    <Play className="w-5 h-5" fill="currentColor" />
                    Watch Now
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Browse Library
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-6 h-6 text-accent" />
          <h2 className="text-3xl font-bold">Trending This Week</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {trendingMovies.slice(0, 10).map((movie, index) => (
            <div key={movie.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
