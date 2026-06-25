import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(
    /^[a-z0-9_]+$/,
    "Solo minúsculas, números y guión bajo"
  )
  .transform((v) => v.toLowerCase());