import { z } from "zod";
import type { Inputs } from "./engine";

/**
 * Every calculator submission is checked against this before it touches the engine or the database.
 * Fields added after the first release carry defaults, so logs saved earlier still validate and recompute.
 */
export const inputsSchema = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  household: z.number().min(1).max(20).default(1),
  mode: z.enum(["car", "bus", "train", "bike", "walk"]),
  fuel: z.enum(["petrol", "diesel", "hybrid", "electric"]),
  carSize: z.enum(["small", "medium", "large"]).default("medium"),
  commuteKm: z.number().min(0).max(2000),
  commuteDays: z.number().min(0).max(7).default(5),
  electricityKwh: z.number().min(0).max(100000),
  gasQty: z.number().min(0).max(100000),
  gasType: z.enum(["lpg", "natural"]),
  heatingType: z.enum(["none", "gas", "oil", "electric", "heatpump", "wood"]).default("none"),
  heatingQty: z.number().min(0).max(100000).default(0),
  diet: z.enum(["vegan", "vegetarian", "pescatarian", "low_meat", "average", "high_meat"]).default("average"),
  meatMeals: z.number().min(0).max(100).optional(),
  flights: z.number().min(0).max(500),
  flightClass: z.enum(["short", "medium", "long"]),
  cabin: z.enum(["economy", "premium", "business"]).default("economy"),
  clothingItems: z.number().min(0).max(500),
  secondhandItems: z.number().min(0).max(500),
  distanceUnit: z.enum(["km", "mi"]),
  gasUnit: z.enum(["kg", "l", "gal", "m3", "ccf", "therm"]),
}) satisfies z.ZodType<Inputs, Partial<Inputs>>;
