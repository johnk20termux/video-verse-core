import { useQuery } from "@tanstack/react-query";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, CheckCircle2 } from "lucide-react";

const Watchlist = () => {
  const { user } = useAuth();

  const { data: watchlistMovies = [] } = useQuery({
    queryKey: ["watchlist-movies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user?.id)
        .eq("watched", false)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: watchedMovies = [] } = useQuery({
    queryKey: ["watched-movies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user?.id)
        .eq("watched", true)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent">
          My Library
        </h1>

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="watchlist" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Watchlist ({watchlistMovies.length})
            </TabsTrigger>
            <TabsTrigger value="watched" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Watched ({watchedMovies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist">
            {watchlistMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {watchlistMovies.map((item) => (
                  <MovieCard
                    key={item.id}
                    movie={{
                      id: item.movie_id,
                      title: item.movie_title,
                      poster_path: item.movie_poster || "",
                      vote_average: 0,
                      release_date: "",
                      overview: "",
                      backdrop_path: "",
                      genre_ids: [],
                    }}
                  />
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
                {watchedMovies.map((item) => (
                  <MovieCard
                    key={item.id}
                    movie={{
                      id: item.movie_id,
                      title: item.movie_title,
                      poster_path: item.movie_poster || "",
                      vote_average: 0,
                      release_date: "",
                      overview: "",
                      backdrop_path: "",
                      genre_ids: [],
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
