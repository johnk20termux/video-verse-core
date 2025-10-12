import { Card } from "@/components/ui/card";
import { Star, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.svg";

  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className="group relative overflow-hidden border-0 bg-card transition-smooth hover:scale-105 hover:glow-primary">
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-semibold">{movie.vote_average.toFixed(1)}</span>
              </div>
              <h3 className="font-semibold text-sm line-clamp-1 mb-2">{movie.title}</h3>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary" fill="currentColor" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MovieCard;
