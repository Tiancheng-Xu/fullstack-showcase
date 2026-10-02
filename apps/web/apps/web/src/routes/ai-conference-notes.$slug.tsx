import { createFileRoute, notFound } from "@tanstack/react-router";
import { AiConferenceOriginalNoteContent } from "@/features/portfolio/ai-conference-original-note-content";
import { originalConferenceNotes } from "@/features/portfolio/ai-conference-original-notes";
import { PortfolioIndexShell } from "@/features/portfolio/portfolio-index-shell";
import { conferenceEntries } from "@/features/portfolio/sharing-data";

export const Route = createFileRoute("/ai-conference-notes/$slug")({ component: AiConferenceNoteRoute });

function AiConferenceNoteRoute() {
  const { slug } = Route.useParams();
  const entry = conferenceEntries.find((item) => item.slug === slug);
  const markdown = originalConferenceNotes[slug];
  if (!entry || !markdown) throw notFound();
  return <PortfolioIndexShell current="sharing" kicker="MY NOTES / ORIGINAL" title={entry.event} description={entry.title}><AiConferenceOriginalNoteContent entry={entry} markdown={markdown} /></PortfolioIndexShell>;
}
