import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, BookmarkCheck, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { searchYTSByIMDB, generateMagnetLink } from "@/services/yts";
import { fetchStreamsFromAddons, generateMagnetFromHash, StreamSource, fetchSubtitlesFromAddons } from "@/services/addons";
import { supabase } from "@/integrations/supabase/client";
import SourceSelector from "@/components/SourceSelector";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = window.location;
  const mediaType = location.pathname.includes("/series/") ? "tv" : "movie";
  
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [magnetLink, setMagnetLink] = useState<string | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [availableSources, setAvailableSources] = useState<StreamSource[]>([]);
  const [subtitles, setSubtitles] = useState<{ label?: string; lang: string; url: string }[]>([]);

  const { data: content, isLoading } = useQuery({
    queryKey: [mediaType, id],
    queryFn: async () => {
      if (mediaType === "movie") {
        return await tmdbService.getMovieDetails(Number(id));
      } else {
        return await tmdbService.getSeriesDetails(Number(id));
      }
    },
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
    if (!user || !content) return;

    const title = (content as any).title || (content as any).name;
    const poster = (content as any).poster_path;

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
          movie_title: title,
          movie_poster: poster,
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
    if (!content) return;

    const imdbId = (content as any).imdb_id || (content as any).external_ids?.imdb_id || `tt${id}`;
    const title = (content as any).title || (content as any).name;
    
    toast.loading("Finding sources from addons...");
    
    // Fetch streams from user's addons
    const addonStreams = await fetchStreamsFromAddons(mediaType === "tv" ? "series" : "movie", imdbId);
    
    // Also fetch from YTS as fallback (movies only)
    const ytsSources: StreamSource[] = [];
    
    if (mediaType === "movie") {
      const ytsMovie = await searchYTSByIMDB(imdbId);
      if (ytsMovie?.torrents) {
        ytsSources.push(
          ...ytsMovie.torrents.map(t => ({
            title: `${title} - ${t.quality}`,
            quality: t.quality,
            infoHash: t.hash,
            addonName: "YTS",
            seeders: 0,
          }))
        );
      }
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
    if (!content) return;

    const title = (content as any).title || (content as any).name;
    let magnet: string;

    if (source.magnetUri) {
      magnet = source.magnetUri;
    } else if (source.infoHash) {
      magnet = generateMagnetFromHash(source.infoHash, title);
    } else if (source.url) {
      magnet = source.url;
    } else {
      toast.error("Invalid source");
      return;
    }

    setMagnetLink(magnet);
    setIsPlayerVisible(true);
    setShowSourceSelector(false);
    const imdbIdSel = (content as any).imdb_id || (content as any).external_ids?.imdb_id || `tt${id}`;
    fetchSubtitlesFromAddons(mediaType === "tv" ? "series" : "movie", imdbIdSel)
      .then(setSubtitles)
      .catch(() => setSubtitles([]));
    toast.success(`Playing from ${source.addonName}`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!content) {
    return <div className="min-h-screen flex items-center justify-center">
      {mediaType === "movie" ? "Movie" : "Series"} not found
    </div>;
  }

  const title = (content as any).title || (content as any).name;
  const releaseDate = (content as any).release_date || (content as any).first_air_date;
  const runtime = (content as any).runtime;
  const voteAverage = (content as any).vote_average;
  const overview = (content as any).overview;
  const genres = (content as any).genres;
  const backdropPath = (content as any).backdrop_path;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-end">
        <div className="absolute inset-0 hero-gradient" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: backdropPath
              ? `url(https://image.tmdb.org/t/p/original${backdropPath})`
              : undefined,
          }}
        />
        
        <div className="container mx-auto px-4 pb-12 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-4">{title}</h1>
            
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="font-semibold">{voteAverage?.toFixed(1)}</span>
              </div>
              
              {runtime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>{runtime} min</span>
                </div>
              )}
              
              <span>{new Date(releaseDate).getFullYear()}</span>
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

            {genres && (
              <div className="flex gap-2 mb-6">
                {genres.map((genre: any) => (
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
            <VideoPlayer magnetLink={magnetLink} title={title} subtitles={subtitles} />
          </div>
        </section>
      )}

      {/* Details Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">{overview}</p>
        </div>
      </section>
    </div>
  );
};

export default MovieDetail;
