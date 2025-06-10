import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Fetch upcoming movies from TMDb API
export const fetchUpcomingMovies = action({
  args: {
    page: v.optional(v.number()),
    withGenres: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB_API_KEY environment variable is required");
    }

    const page = args.page || 1;
    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      page: page.toString(),
      region: args.region || "US",
    });

    if (args.withGenres) {
      params.append("with_genres", args.withGenres);
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/upcoming?${params}`
    );

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Store movies in database
    for (const movie of data.results) {
      await ctx.runMutation(internal.movies.storeMovie, {
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        genreIds: movie.genre_ids,
        voteAverage: movie.vote_average,
        popularity: movie.popularity,
        adult: movie.adult,
        originalLanguage: movie.original_language,
        originalTitle: movie.original_title,
        video: movie.video,
        voteCount: movie.vote_count,
      });
    }

    return data;
  },
});

// Store movie in database (internal mutation)
export const storeMovie = internalMutation({
  args: {
    tmdbId: v.number(),
    title: v.string(),
    overview: v.string(),
    releaseDate: v.string(),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    genreIds: v.array(v.number()),
    voteAverage: v.number(),
    popularity: v.number(),
    adult: v.boolean(),
    originalLanguage: v.string(),
    originalTitle: v.string(),
    video: v.boolean(),
    voteCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if movie already exists
    const existingMovie = await ctx.db
      .query("movies")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .unique();

    if (existingMovie) {
      // Update existing movie
      await ctx.db.patch(existingMovie._id, args);
      return existingMovie._id;
    } else {
      // Insert new movie
      return await ctx.db.insert("movies", args);
    }
  },
});

// Get upcoming movies from database
export const getUpcomingMovies = query({
  args: {
    genreFilter: v.optional(v.array(v.number())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    let movies = await ctx.db.query("movies").order("desc").take(limit * 2);

    // Filter by genre if specified
    if (args.genreFilter && args.genreFilter.length > 0) {
      movies = movies.filter((movie) =>
        args.genreFilter!.some((genreId) => movie.genreIds.includes(genreId))
      );
    }

    // Filter to only upcoming movies
    const today = new Date().toISOString().split("T")[0];
    movies = movies.filter((movie) => movie.releaseDate >= today);

    // Sort by release date
    movies.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

    return movies.slice(0, limit);
  },
});

// Add movie to user's calendar
export const addToCalendar = mutation({
  args: {
    movieId: v.id("movies"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add movies to calendar");
    }

    // Check if already added
    const existing = await ctx.db
      .query("userMovies")
      .withIndex("by_user_and_movie", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .unique();

    if (existing) {
      throw new Error("Movie already in your calendar");
    }

    return await ctx.db.insert("userMovies", {
      userId,
      movieId: args.movieId,
      addedAt: Date.now(),
      watched: false,
      notes: args.notes,
    });
  },
});

// Remove movie from user's calendar
export const removeFromCalendar = mutation({
  args: {
    movieId: v.id("movies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const userMovie = await ctx.db
      .query("userMovies")
      .withIndex("by_user_and_movie", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .unique();

    if (!userMovie) {
      throw new Error("Movie not found in your calendar");
    }

    await ctx.db.delete(userMovie._id);
  },
});

// Mark movie as watched
export const markAsWatched = mutation({
  args: {
    movieId: v.id("movies"),
    watched: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const userMovie = await ctx.db
      .query("userMovies")
      .withIndex("by_user_and_movie", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .unique();

    if (!userMovie) {
      throw new Error("Movie not found in your calendar");
    }

    await ctx.db.patch(userMovie._id, {
      watched: args.watched,
      watchedAt: args.watched ? Date.now() : undefined,
    });
  },
});

// Get user's calendar movies
export const getCalendarMovies = query({
  args: {
    month: v.optional(v.string()), // YYYY-MM format
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const userMovies = await ctx.db
      .query("userMovies")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const moviesWithDetails = await Promise.all(
      userMovies.map(async (userMovie) => {
        const movie = await ctx.db.get(userMovie.movieId);
        return {
          ...userMovie,
          movie,
        };
      })
    );

    // Filter by month if specified
    if (args.month) {
      return moviesWithDetails.filter((item) =>
        item.movie?.releaseDate.startsWith(args.month!)
      );
    }

    return moviesWithDetails;
  },
});

// Check if movie is in user's calendar
export const isInCalendar = query({
  args: {
    movieId: v.id("movies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const userMovie = await ctx.db
      .query("userMovies")
      .withIndex("by_user_and_movie", (q) =>
        q.eq("userId", userId).eq("movieId", args.movieId)
      )
      .unique();

    return !!userMovie;
  },
});

// Fetch and store genres
export const fetchGenres = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB_API_KEY environment variable is required");
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`
    );

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();
    
    for (const genre of data.genres) {
      await ctx.runMutation(internal.movies.storeGenre, {
        tmdbId: genre.id,
        name: genre.name,
      });
    }

    return data.genres;
  },
});

// Store genre in database (internal mutation)
export const storeGenre = internalMutation({
  args: {
    tmdbId: v.number(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("genres")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .unique();

    if (!existing) {
      await ctx.db.insert("genres", args);
    }
  },
});

// Get all genres
export const getGenres = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("genres").collect();
  },
});
