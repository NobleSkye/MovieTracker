import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function CalendarView() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const calendarMovies = useQuery(api.movies.getCalendarMovies, { month: selectedMonth });
  const allCalendarMovies = useQuery(api.movies.getCalendarMovies, {});
  const markAsWatched = useMutation(api.movies.markAsWatched);
  const removeFromCalendar = useMutation(api.movies.removeFromCalendar);

  const handleToggleWatched = async (movieId: string, currentWatched: boolean) => {
    try {
      await markAsWatched({ movieId: movieId as any, watched: !currentWatched });
      toast.success(
        currentWatched ? "Marked as unwatched" : "Marked as watched!"
      );
    } catch (error) {
      console.error("Error updating watched status:", error);
      toast.error("Failed to update watched status");
    }
  };

  const handleRemoveMovie = async (movieId: string, title: string) => {
    try {
      await removeFromCalendar({ movieId: movieId as any });
      toast.success(`Removed "${title}" from calendar`);
    } catch (error) {
      console.error("Error removing movie:", error);
      toast.error("Failed to remove movie");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Add previous 2 months, current month, and next 12 months
    for (let i = -2; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      options.push({ value, label });
    }
    
    return options;
  };

  const getStats = () => {
    if (!allCalendarMovies) return { total: 0, watched: 0, upcoming: 0 };
    
    const total = allCalendarMovies.length;
    const watched = allCalendarMovies.filter(cm => cm.watched).length;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = allCalendarMovies.filter(cm => 
      cm.movie && cm.movie.releaseDate >= today && !cm.watched
    ).length;
    
    return { total, watched, upcoming };
  };

  const stats = getStats();

  if (calendarMovies === undefined || allCalendarMovies === undefined) {
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
          <h1 className="text-3xl font-bold text-gray-900">My Movie Calendar</h1>
          <p className="text-gray-600">Track your upcoming movie releases</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {getMonthOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Movies</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{stats.watched}</div>
          <div className="text-sm text-gray-600">Watched</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
      </div>

      {/* Movies List */}
      {calendarMovies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-500 text-lg">No movies in your calendar for this month</p>
          <p className="text-gray-400 mt-2">
            Go to the Discover tab to add some movies!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {calendarMovies
            .sort((a, b) => {
              if (!a.movie || !b.movie) return 0;
              return a.movie.releaseDate.localeCompare(b.movie.releaseDate);
            })
            .map((calendarMovie) => {
              if (!calendarMovie.movie) return null;
              
              const movie = calendarMovie.movie;
              const posterUrl = movie.posterPath
                ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
                : "/api/placeholder/200/300";
              
              const isUpcoming = new Date(movie.releaseDate) > new Date();
              
              return (
                <div
                  key={calendarMovie._id}
                  className={`bg-white rounded-lg shadow-sm border p-4 ${
                    calendarMovie.watched ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="w-16 h-24 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/api/placeholder/200/300";
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {movie.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            📅 {formatDate(movie.releaseDate)}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {movie.overview}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            {calendarMovie.watched && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                ✓ Watched
                              </span>
                            )}
                            {isUpcoming && !calendarMovie.watched && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Upcoming
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              ⭐ {movie.voteAverage.toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleWatched(calendarMovie.movieId, calendarMovie.watched)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                calendarMovie.watched
                                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {calendarMovie.watched ? "Unwatch" : "Mark Watched"}
                            </button>
                            <button
                              onClick={() => handleRemoveMovie(calendarMovie.movieId, movie.title)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
