import z from "zod";
import { usernameSchema } from "./username";

export const createListSchema = z.object({
  title: z.string().min(1, "El títuo es obligatorio").max(200),
  description: z.string().max(1000).optional().nullable(),
});

export const addListItemSchema = z.object({
  mediaType: z.enum(["movie", "album"]),
  externalId: z.string().min(1),
  title: z.string().min(1),
  posterUrl: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  username: usernameSchema,
});
export const listProgressSchema = z.object({
  mediaItemId: z.string().uuid(),
  completed: z.boolean(),
});