import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

interface MovieCardProps {
  movie: Doc<"movies">;
}

export function MovieCard({ movie }: MovieCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const addToCalendar = useMutation(api.movies.addToCalendar);
  const removeFromCalendar = useMutation(api.movies.removeFromCalendar);
  const markAsWatched = useMutation(api.movies.markAsWatched);
  
  const isInCalendar = useQuery(api.movies.isInCalendar, { movieId: movie._id });
  const calendarMovies = useQuery(api.movies.getCalendarMovies, {});
  
  const userMovie = calendarMovies?.find(cm => cm.movieId === movie._id);
  const isWatched = userMovie?.watched || false;

  const handleAddToCalendar = async () => {
    setIsLoading(true);
    try {
      await addToCalendar({ movieId: movie._id });
      toast.success(`Added "${movie.title}" to your calendar!`);
    } catch (error) {
      console.error("Error adding to calendar:", error);
      toast.error("Failed to add movie to calendar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCalendar = async () => {
    setIsLoading(true);
    try {
      await removeFromCalendar({ movieId: movie._id });
      toast.success(`Removed "${movie.title}" from your calendar`);
    } catch (error) {
      console.error("Error removing from calendar:", error);
      toast.error("Failed to remove movie from calendar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWatched = async () => {
    if (!isInCalendar) return;
    
    setIsLoading(true);
    try {
      await markAsWatched({ movieId: movie._id, watched: !isWatched });
      toast.success(
        isWatched 
          ? `Marked "${movie.title}" as unwatched` 
          : `Marked "${movie.title}" as watched!`
      );
    } catch (error) {
      console.error("Error updating watched status:", error);
      toast.error("Failed to update watched status");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : "/api/placeholder/300/450";

  const isUpcoming = new Date(movie.releaseDate) > new Date();
  const releaseStatus = isUpcoming ? "Upcoming" : "Released";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/300/450";
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isUpcoming 
              ? "bg-blue-100 text-blue-800" 
              : "bg-green-100 text-green-800"
          }`}>
            {releaseStatus}
          </span>
        </div>
        {isWatched && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              ✓ Watched
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{movie.title}</h3>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">📅 {formatDate(movie.releaseDate)}</span>
          <span className="text-sm text-gray-600">⭐ {movie.voteAverage.toFixed(1)}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{movie.overview}</p>
        
        <div className="flex flex-col gap-2">
          {isInCalendar ? (
            <div className="flex gap-2">
              <button
                onClick={handleToggleWatched}
                disabled={isLoading}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                  isWatched
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {isWatched ? "Mark Unwatched" : "Mark Watched"}
              </button>
              <button
                onClick={handleRemoveFromCalendar}
                disabled={isLoading}
                className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCalendar}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "📅 Add to Calendar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
