import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, BookmarkCheck, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { searchYTSByIMDB, generateMagnetLink } from "@/services/yts";
import { fetchStreamsFromAddons, generateMagnetFromHash, StreamSource } from "@/services/addons";
import { supabase } from "@/integrations/supabase/client";
import SourceSelector from "@/components/SourceSelector";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [availableSources, setAvailableSources] = useState<StreamSource[]>([]);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => tmdbService.getMovieDetails(Number(id)),
  });

  // Load watchlist status from Supabase
  useEffect(() => {
    const loadWatchlistStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("watchlist")
        .select("watched")
        .eq("movie_id", Number(id))
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsInWatchlist(true);
        setIsWatched(data.watched);
      }
    };

    loadWatchlistStatus();
  }, [id]);

  const toggleWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !movie) return;

    if (isInWatchlist) {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("movie_id", Number(id))
        .eq("user_id", user.id);

      if (!error) {
        setIsInWatchlist(false);
        toast.success("Removed from watchlist");
      }
    } else {
      const { error } = await supabase
        .from("watchlist")
        .insert({
          user_id: user.id,
          movie_id: Number(id),
          movie_title: movie.title,
          movie_poster: movie.poster_path,
          watched: false,
        });

      if (!error) {
        setIsInWatchlist(true);
        toast.success("Added to watchlist");
      }
    }
  };

  const toggleWatched = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("watchlist")
      .update({ watched: !isWatched })
      .eq("movie_id", Number(id))
      .eq("user_id", user.id);

    if (!error) {
      setIsWatched(!isWatched);
      toast.success(isWatched ? "Marked as unwatched" : "Marked as watched");
    }
  };

  const handlePlay = async () => {
    if (!movie) return;

    const imdbId = movie.imdb_id || `tt${id}`;
    
    toast.loading("Finding sources from addons...");
    
    // Fetch streams from user's addons
    const addonStreams = await fetchStreamsFromAddons("movie", imdbId);
    
    // Also fetch from YTS as fallback
    const ytsMovie = await searchYTSByIMDB(imdbId);
    const ytsSources: StreamSource[] = [];
    
    if (ytsMovie?.torrents) {
      ytsSources.push(
        ...ytsMovie.torrents.map(t => ({
          title: `${movie.title} - ${t.quality}`,
          quality: t.quality,
          infoHash: t.hash,
          addonName: "YTS",
        }))
      );
    }

    const allSources = [...addonStreams, ...ytsSources];
    
    toast.dismiss();

    if (allSources.length === 0) {
      toast.error("No sources available. Try adding some addons!");
      return;
    }

    if (allSources.length === 1) {
      // Auto-play if only one source
      selectSource(allSources[0]);
    } else {
      // Show source selector
      setAvailableSources(allSources);
      setShowSourceSelector(true);
    }
  };

  const selectSource = (source: StreamSource) => {
    if (!movie) return;

    let magnet: string;

    if (source.magnetUri) {
      magnet = source.magnetUri;
    } else if (source.infoHash) {
      magnet = generateMagnetFromHash(source.infoHash, movie.title);
    } else if (source.url) {
      magnet = source.url;
    } else {
      toast.error("Invalid source");
      return;
    }

    setMagnetLink(magnet);
    setIsPlayerVisible(true);
    setShowSourceSelector(false);
    toast.success(`Playing from ${source.addonName}`);
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
              <Button size="lg" className="gap-2 glow-primary" onClick={handlePlay}>
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

      {/* Source Selector */}
      {showSourceSelector && (
        <section className="container mx-auto px-4 py-8">
          <SourceSelector
            sources={availableSources}
            onSelectSource={selectSource}
            onClose={() => setShowSourceSelector(false)}
          />
        </section>
      )}

      {/* Video Player Section */}
      {isPlayerVisible && magnetLink && (
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <VideoPlayer magnetLink={magnetLink} title={movie.title} />
          </div>
        </section>
      )}

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
