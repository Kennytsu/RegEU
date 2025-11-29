import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RegulatoryItem } from "@/lib/mockData";
import { normalizeTopics } from "@/lib/topicUtils";

export function useMeetings(limit = 20) {
  return useQuery({
    queryKey: ["meetings", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_meetings")
        .select("*")
        .order("meeting_start_datetime", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform to RegulatoryItem format
      const items: RegulatoryItem[] = (data || []).map((meeting) => ({
        id: meeting.source_id || meeting.meeting_id || crypto.randomUUID(),
        title: meeting.title || "Untitled Meeting",
        type: "meeting" as const,
        date: meeting.meeting_start_datetime
          ? new Date(meeting.meeting_start_datetime).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        summary: meeting.description || `Meeting at ${meeting.location || "TBD"}`,
        impact: "medium" as const,
        status: "backlog" as const,
        topics: meeting.topic ? [meeting.topic] : [],
        source: meeting.meeting_url || meeting.source_url || "#",
      }));

      return items;
    },
  });
}

// Map legislative status to workflow status
function mapLegislativeStatus(status: string | null): RegulatoryItem["status"] {
  if (!status) return "backlog";
  const lower = status.toLowerCase();
  if (lower.includes("completed") || lower.includes("enters into force")) return "done";
  if (lower.includes("awaiting") && (lower.includes("vote") || lower.includes("plenary"))) return "action-needed";
  if (lower.includes("awaiting") || lower.includes("preparatory")) return "in-review";
  if (lower.includes("lapsed") || lower.includes("rejected") || lower.includes("withdrawn")) return "done";
  return "backlog";
}

// Determine impact based on status
function mapLegislativeImpact(status: string | null): RegulatoryItem["impact"] {
  if (!status) return "low";
  const lower = status.toLowerCase();
  if (lower.includes("vote") || lower.includes("plenary") || lower.includes("signature")) return "high";
  if (lower.includes("1st reading") || lower.includes("2nd reading")) return "high";
  if (lower.includes("awaiting")) return "medium";
  return "low";
}

export interface KeyEvent {
  date?: string;
  event?: string;
  link?: string;
  summary_link?: string;
  doc_ref?: string;
}

export interface Document {
  title?: string;
  type?: string;
  link?: string;
  summary_link?: string;
  date?: string;
}

export interface KeyPlayer {
  institution?: string;
  role?: string;
  name?: string;
}

export interface LegislativeFileItem {
  id: string;
  title: string;
  type: 'regulation';
  date: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  status: 'backlog' | 'in-review' | 'action-needed' | 'done';
  topics: string[];
  source: string;
  legislativeStatus?: string;
  committee?: string;
  rapporteur?: string;
  keyEvents?: KeyEvent[];
  detailsLink?: string;
  subjects?: string[];
  documents?: Document[];
  keyPlayers?: KeyPlayer[];
}

export function useLegislativeFiles(limit = 20) {
  return useQuery({
    queryKey: ["legislative_files", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legislative_files")
        .select("*")
        .not("status", "is", null)
        .order("lastpubdate", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const items: LegislativeFileItem[] = (data || []).map((file) => {
        // Parse key_events if it exists
        let keyEvents: KeyEvent[] = [];
        if (file.key_events && Array.isArray(file.key_events)) {
          keyEvents = file.key_events as KeyEvent[];
        }

        // Parse subjects if it exists
        let subjects: string[] = [];
        if (file.subjects && Array.isArray(file.subjects)) {
          subjects = file.subjects as string[];
        }

        // Parse documentation_gateway for documents
        let documents: Document[] = [];
        if (file.documentation_gateway && Array.isArray(file.documentation_gateway)) {
          documents = file.documentation_gateway as Document[];
        }

        // Parse key_players if it exists
        let keyPlayers: KeyPlayer[] = [];
        if (file.key_players && Array.isArray(file.key_players)) {
          keyPlayers = file.key_players as KeyPlayer[];
        }

        // Normalize topics from subjects to standard regulatory topics
        const normalizedTopics = normalizeTopics(subjects);

        return {
          id: file.id,
          title: file.title || "Untitled Legislation",
          type: "regulation" as const,
          date: file.lastpubdate || new Date().toISOString().split("T")[0],
          summary: file.status || "Status unknown",
          impact: mapLegislativeImpact(file.status),
          status: mapLegislativeStatus(file.status),
          topics: normalizedTopics, // Use normalized topics instead of raw subjects
          source: file.link || "#",
          legislativeStatus: file.status,
          committee: file.committee || undefined,
          rapporteur: file.rapporteur || undefined,
          keyEvents,
          detailsLink: file.details_link || undefined,
          subjects,
          documents,
          keyPlayers,
        };
      });

      return items;
    },
  });
}
