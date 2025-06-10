import type { Doc } from "../../convex/_generated/dataModel";

interface GenreFilterProps {
  genres: Doc<"genres">[];
  selectedGenres: number[];
  onGenreChange: (genres: number[]) => void;
}

export function GenreFilter({ genres, selectedGenres, onGenreChange }: GenreFilterProps) {
  const handleGenreToggle = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  const clearFilters = () => {
    onGenreChange([]);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Filter by Genre</h3>
        {selectedGenres.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-primary-hover"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <button
            key={genre._id}
            onClick={() => handleGenreToggle(genre.tmdbId)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedGenres.includes(genre.tmdbId)
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
      
      {selectedGenres.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">
            {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}
