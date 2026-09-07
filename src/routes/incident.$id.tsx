import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MapPlaceholder } from "@/components/map-placeholder";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface IncidentRow {
  id: string;
  category: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  location: unknown;
  reporter_id: string;
}

interface MessageRow {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  senderName?: string;
}

export const Route = createFileRoute("/incident/$id")({
  head: () => ({
    meta: [
      { title: "Incident Room — Community SOS" },
      { name: "description", content: "Live incident room with map, responder chat, and status updates." },
      { property: "og:title", content: "Incident Room — Community SOS" },
      { property: "og:description", content: "Live incident room with map, responder chat, and status updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IncidentRoom,
});

function statusLine(status: string): string {
  if (status === "active") return "Active — awaiting more responders";
  if (status === "responding") return "Help is on the way";
  if (status === "contained") return "Situation contained";
  if (status === "resolved") return "Resolved";
  return status;
}

function IncidentRoom() {
  const { id } = Route.useParams();
  const { user, name } = useAuth();
  const [incident, setIncident] = useState<IncidentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [responders, setResponders] = useState(0);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("incidents")
        .select("id, category, description, priority, status, created_at, location, reporter_id")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        console.warn("[incident] fetch failed", error?.message);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setIncident(data as IncidentRow);

      const [{ count }, { data: msgs }] = await Promise.all([
        supabase
          .from("incident_participants")
          .select("id", { count: "exact", head: true })
          .eq("incident_id", id),
        supabase
          .from("messages")
          .select("id, content, sender_id, sent_at")
          .eq("incident_id", id)
          .order("sent_at", { ascending: true })
          .limit(100),
      ]);
      if (cancelled) return;
      setResponders(count ?? 0);

      const rows = (msgs ?? []) as MessageRow[];
      const senderIds = [...new Set(rows.map((m) => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name")
          .in("id", senderIds);
        const names = new Map((usersData ?? []).map((u) => [u.id, u.name]));
        rows.forEach((m) => (m.senderName = names.get(m.sender_id) ?? "Responder"));
      }
      setMessages(rows);
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel(`incident-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `incident_id=eq.${id}` },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [id]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ incident_id: id, sender_id: user.id, content })
      .select("id, content, sender_id, sent_at")
      .single();
    setSending(false);
    if (error) {
      toast.error("Message couldn't be sent — are you a participant in this incident?");
      return;
    }
    setDraft("");
    setMessages((prev) =>
      prev.some((m) => m.id === data.id)
        ? prev
        : [...prev, { ...(data as MessageRow), senderName: name ?? "You" }],
    );
  };

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading incident…</p>;
  }

  if (notFound || !incident) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="text-lg font-bold text-foreground">Incident not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This incident may have been removed, or you may not have access.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-info">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Link to="/" className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back to incidents
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{incident.category}</h1>
          <p className="text-xs text-muted-foreground">
            Reported {new Date(incident.created_at).toLocaleString()}
          </p>
        </div>
        <span className="rounded-full bg-sos/10 px-2.5 py-1 text-[10px] font-bold uppercase text-sos">
          {incident.priority}
        </span>
      </div>

      {incident.description && (
        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
          {incident.description}
        </p>
      )}

      {/* Status line */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-info/30 bg-info-muted px-3 py-2 text-xs font-medium text-info">
        <span className="size-2 animate-pulse rounded-full bg-info" />
        Status: {statusLine(incident.status)}
        <span className="ml-auto flex items-center gap-1 text-muted-foreground">
          <Users className="size-3.5" /> {responders}
        </span>
      </div>

      {user?.id === incident.reporter_id && incident.status !== "resolved" && (
        <button
          type="button"
          disabled={resolving}
          onClick={onResolve}
          className="mt-3 w-full rounded-xl bg-safe py-2.5 text-sm font-bold text-safe-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {resolving ? "Marking resolved…" : "✓ Mark Resolved"}
        </button>
      )}

      {/* Map */}
      <div className="mt-4">
        <MapPlaceholder label={`Map placeholder — incident location`} />
      </div>

      {/* Chat */}
      <section className="mt-4 pb-4" aria-labelledby="chat-heading">
        <h2 id="chat-heading" className="text-sm font-bold text-foreground">
          Responder chat
        </h2>
        <div className="mt-2 space-y-2 rounded-xl border border-border bg-card p-3">
          {messages.length === 0 ? (
            <p className="text-center text-[11px] text-muted-foreground">
              No messages yet — say something to coordinate responders.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={
                    mine
                      ? "ml-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-xs text-foreground"
                      : "max-w-[80%] rounded-lg bg-info-muted px-3 py-2 text-xs text-foreground"
                  }
                >
                  <span className={mine ? "font-semibold" : "font-semibold text-info"}>
                    {mine ? "You" : (m.senderName ?? "Responder")}:
                  </span>{" "}
                  {m.content}
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={onSend} className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message responders…"
            className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="flex size-10 items-center justify-center rounded-xl bg-info text-info-foreground disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
