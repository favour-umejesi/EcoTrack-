import { z } from "zod";
import type { Inputs } from "./engine";

/** Every calculator submission is checked against this before it touches the engine or the database. */
export const inputsSchema = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  mode: z.enum(["car", "bus", "train", "bike", "walk"]),
  fuel: z.enum(["petrol", "diesel", "electric"]),
  commuteKm: z.number().min(0).max(2000),
  electricityKwh: z.number().min(0).max(100000),
  gasQty: z.number().min(0).max(100000),
  gasType: z.enum(["lpg", "natural"]),
  meatMeals: z.number().min(0).max(100),
  flights: z.number().min(0).max(500),
  flightClass: z.enum(["short", "medium", "long"]),
  clothingItems: z.number().min(0).max(500),
  secondhandItems: z.number().min(0).max(500),
  distanceUnit: z.enum(["km", "mi"]),
  gasUnit: z.enum(["kg", "l", "gal", "m3", "ccf", "therm"]),
}) satisfies z.ZodType<Inputs>;
