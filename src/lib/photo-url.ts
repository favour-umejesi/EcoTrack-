/** Public URL for a stored photo. Safe to import in the browser. Swap this and the route handler if photos move to object storage. */
export const photoUrl = (id: string, size: "large" | "thumb" = "large") => `/api/photos/${id}${size === "thumb" ? "?size=thumb" : ""}`;
