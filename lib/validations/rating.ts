import { z } from "zod";

export const createRatingSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1),
  posterUrl: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  stars: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional().nullable(),
});

export const updateRatingSchema = z.object({
  stars: z.number().int().min(1).max(5).optional(),
  review: z.string().max(2000).optional().nullable(),
});