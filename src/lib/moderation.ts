/** Who may review reports. A comma-separated list of emails in MODERATOR_EMAILS; emails are only ever compared, never shown. */
export function isModerator(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.MODERATOR_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/** Text that looks like it carries a link. New accounts may not post these for their first week. */
export const hasLink = (text: string) => /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|io|co|uk|app|dev|xyz)\b/i.test(text);

export const CHALLENGE_ROTATION: { title: string; text: string }[] = [
  { title: "One car-free commute", text: "Any day, any distance. Log it and it counts." },
  { title: "A meat-free day", text: "One full day without meat. Beans, eggs, lentils, whatever works." },
  { title: "Mend one thing", text: "A button, a hem, a strap. Anything that would otherwise be replaced." },
  { title: "One cold wash", text: "Run one load at 30 degrees or lower and hang it to dry." },
  { title: "Thrift before new", text: "Need something this week? Check second-hand first, and share what you found." },
];
