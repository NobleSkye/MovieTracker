import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MovieCard } from "./MovieCard";
import { GenreFilter } from "./GenreFilter";

export function MovieDashboard() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchUpcomingMovies = useAction(api.movies.fetchUpcomingMovies);
  const fetchGenres = useAction(api.movies.fetchGenres);
  const movies = useQuery(api.movies.getUpcomingMovies, {
    genreFilter: selectedGenres.length > 0 ? selectedGenres : undefined,
    limit: 20,
  });
  const genres = useQuery(api.movies.getGenres);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch genres first
        await fetchGenres();
        // Then fetch movies
        await fetchUpcomingMovies({ page: 1 });
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load movies. Please check your TMDb API key.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [fetchUpcomingMovies, fetchGenres]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchUpcomingMovies({ 
        page: 1,
        withGenres: selectedGenres.length > 0 ? selectedGenres.join(",") : undefined,
      });
      toast.success("Movies refreshed!");
    } catch (error) {
      console.error("Error refreshing movies:", error);
      toast.error("Failed to refresh movies");
    } finally {
      setIsLoading(false);
    }
  };

  if (movies === undefined || genres === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Movies</h1>
          <p className="text-gray-600">Discover and track new movie releases</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>
      </div>

      <GenreFilter
        genres={genres}
        selectedGenres={selectedGenres}
        onGenreChange={setSelectedGenres}
      />

      {movies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {isLoading ? "Loading movies..." : "No upcoming movies found"}
          </p>
          {!isLoading && selectedGenres.length > 0 && (
            <p className="text-gray-400 mt-2">
              Try adjusting your genre filters
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
