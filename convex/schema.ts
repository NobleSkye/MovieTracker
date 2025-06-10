import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  movies: defineTable({
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
  }).index("by_tmdb_id", ["tmdbId"]),

  userMovies: defineTable({
    userId: v.id("users"),
    movieId: v.id("movies"),
    addedAt: v.number(),
    watched: v.boolean(),
    watchedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_movie", ["userId", "movieId"]),

  genres: defineTable({
    tmdbId: v.number(),
    name: v.string(),
  }).index("by_tmdb_id", ["tmdbId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
