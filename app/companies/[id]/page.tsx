"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MessageSquarePlus,
  StickyNote,
  Activity,
  Check,
  Pencil,
  Trash2,
  X,
  Plus,
  Minus,
  CheckCircle2,
  History as HistoryIcon,
  ChevronDown,
} from "lucide-react";
import type { Company, FeedItem, NoteStatus } from "@/types";

const statusStyles: Record<NoteStatus, string> = {
  unpaid: "text-status-unpaid bg-status-unpaid/10 border-status-unpaid/20",
  partial: "text-status-partial bg-status-partial/10 border-status-partial/20",
  paid: "text-status-paid bg-status-paid/10 border-status-paid/20",
};

const statusLabel: Record<NoteStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

type AdjustMode = { noteId: string; sign: 1 | -1 } | null;

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // inline adjust input
  const [adjust, setAdjust] = useState<AdjustMode>(null);
  const [adjustValue, setAdjustValue] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCompany(data.company);
        setFeed(data.feed);
        setTotal(data.totalOutstanding ?? 0);
      } else {
        toast.error(data.error ?? "Failed to load company");
      }
    } catch {
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    void load();
  }, [load]);

  async function addNote() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/companies/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          amount: amount ? parseFloat(amount) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add note");
      toast.success("Note added");
      setText("");
      setAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  function startEdit(itemId: string, currentText: string) {
    setEditingId(itemId);
    setEditText(currentText);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(noteId: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setBusyId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update note");
      toast.success("Note updated");
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  function openAdjust(noteId: string, sign: 1 | -1) {
    setAdjust({ noteId, sign });
    setAdjustValue("");
  }

  function cancelAdjust() {
    setAdjust(null);
    setAdjustValue("");
  }

  async function submitAdjust() {
    if (!adjust) return;
    const value = parseFloat(adjustValue);
    if (isNaN(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusyId(adjust.noteId);
    try {
      const res = await fetch(`/api/notes/${adjust.noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: adjust.sign * value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to adjust amount");
      toast.success(adjust.sign === 1 ? "Amount added" : "Amount deducted");
      cancelAdjust();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(noteId: string) {
    setBusyId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markPaid: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to mark paid");
      toast.success("Marked as fully paid");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNote(noteId: string) {
    setBusyId(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete note");
      toast.success("Note deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
        Company not found.{" "}
        <Link href="/history" className="text-foreground underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-[rgba(139,92,246,0.15)] blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        <Link
          href="/history"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to search
        </Link>

        {/* two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start ">
          {/* ── LEFT: add-note form ── */}
          <div className="w-full lg:w-80 lg:shrink-0 ">
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl"
              style={{ boxShadow: "0 0 40px rgba(139,92,246,0.2)" }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Description… e.g. عروض شهر 4 ايفا"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-white/30"
              />
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    EGP
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00 (optional)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-12 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-white/30"
                  />
                </div>
                <button
                  onClick={addNote}
                  disabled={posting || !text.trim()}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 disabled:opacity-40 disabled:shadow-none"
                >
                  {posting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageSquarePlus className="size-4" />
                  )}
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: company header + activity feed ── */}
          <div className="min-w-0 flex-1 ">
            <div className="mb-6 flex items-start justify-between gap-4 ">
              <div className="flex items-start gap-4 ">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Building2 className="size-6 text-foreground/80" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {company.name}
                  </h1>
                  {company.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {company.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-right backdrop-blur-xl">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p
                  className={`text-lg font-bold ${
                    total > 0 ? "text-status-unpaid" : "text-status-paid"
                  }`}
                >
                  EGP {total.toLocaleString()}
                </p>
              </div>
            </div>

            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Activity & notes
            </h2>
            {feed.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
                Nothing here yet. Add the first note above.
              </div>
            ) : (
              <ul className="space-y-3">
                {feed.map((item) => {
                  const isEditing =
                    item.kind === "note" && editingId === item.id;
                  const isBusy = busyId === item.id;
                  const isAdjusting =
                    item.kind === "note" && adjust?.noteId === item.id;
                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
                    >
                      {isEditing ? (
                        <div className="flex gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                            <StickyNote className="size-4 text-foreground/70" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-foreground outline-none focus:border-white/30"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(item.id)}
                                disabled={isBusy || !editText.trim()}
                                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-all hover:bg-white/90 disabled:opacity-40"
                              >
                                {isBusy ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <X className="size-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                              {item.kind === "note" ? (
                                <StickyNote className="size-4 text-foreground/70" />
                              ) : (
                                <Activity className="size-4 text-foreground/70" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">
                                {item.text}
                              </p>
                              {item.kind === "note" && item.amount > 0 && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    EGP {item.amount.toLocaleString()}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}
                                  >
                                    {statusLabel[item.status]}
                                  </span>
                                </div>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.userName} · {timeAgo(item.createdAt)}
                              </p>

                              {item.kind === "note" &&
                                item.amountHistory.length > 0 && (
                                  <button
                                    onClick={() =>
                                      setExpandedId(
                                        expandedId === item.id ? null : item.id,
                                      )
                                    }
                                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <HistoryIcon className="size-3" />
                                    {item.amountHistory.length}{" "}
                                    {item.amountHistory.length === 1
                                      ? "change"
                                      : "changes"}
                                    <ChevronDown
                                      className={`size-3 transition-transform ${
                                        expandedId === item.id
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                )}
                            </div>
                          </div>

                          {/* inline adjust input */}
                          {isAdjusting && (
                            <div className="ml-11 mt-3 flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  EGP
                                </span>
                                <input
                                  autoFocus
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={adjustValue}
                                  onChange={(e) =>
                                    setAdjustValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") submitAdjust();
                                    if (e.key === "Escape") cancelAdjust();
                                  }}
                                  placeholder={
                                    adjust?.sign === 1
                                      ? "Amount to add"
                                      : "Amount to deduct"
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-11 pr-3 text-sm text-foreground outline-none focus:border-white/30"
                                />
                              </div>
                              <button
                                onClick={submitAdjust}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-white/90 disabled:opacity-40"
                              >
                                {isBusy ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                Confirm
                              </button>
                              <button
                                onClick={cancelAdjust}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          )}

                          {/* action rows */}
                          {item.kind === "note" && !isAdjusting && (
                            <div className="ml-11 mt-3 space-y-2">
                              {/* Payment row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Payment:
                                </span>
                                <button
                                  onClick={() => openAdjust(item.id, 1)}
                                  disabled={isBusy}
                                  className="flex items-center gap-1 rounded-lg border border-status-paid/30 bg-status-paid/10 px-2.5 py-1 text-xs font-medium text-status-paid transition-colors hover:bg-status-paid/20 disabled:opacity-40"
                                >
                                  <Plus className="size-3" /> Add amount
                                </button>
                                <button
                                  onClick={() => openAdjust(item.id, -1)}
                                  disabled={isBusy}
                                  className="flex items-center gap-1 rounded-lg border border-status-unpaid/30 bg-status-unpaid/10 px-2.5 py-1 text-xs font-medium text-status-unpaid transition-colors hover:bg-status-unpaid/20 disabled:opacity-40"
                                >
                                  <Minus className="size-3" /> Deduct amount
                                </button>
                                {item.amount > 0 && (
                                  <button
                                    onClick={() => markPaid(item.id)}
                                    disabled={isBusy}
                                    className="flex items-center gap-1 rounded-lg border border-status-paid/40 bg-status-paid/15 px-2.5 py-1 text-xs font-medium text-status-paid transition-colors hover:bg-status-paid/25 disabled:opacity-40"
                                  >
                                    <CheckCircle2 className="size-3" /> Mark as
                                    paid
                                  </button>
                                )}
                              </div>

                              {/* Note row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Note:
                                </span>
                                <button
                                  onClick={() => startEdit(item.id, item.text)}
                                  disabled={isBusy}
                                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                >
                                  <Pencil className="size-3" /> Edit text
                                </button>
                                <button
                                  onClick={() => deleteNote(item.id)}
                                  disabled={isBusy}
                                  className="flex items-center gap-1 rounded-lg border border-status-unpaid/30 px-2.5 py-1 text-xs font-medium text-status-unpaid transition-colors hover:bg-status-unpaid/10 disabled:opacity-40"
                                >
                                  <Trash2 className="size-3" /> Delete note
                                </button>
                              </div>
                            </div>
                          )}

                          {/* expandable history */}
                          {item.kind === "note" &&
                            expandedId === item.id &&
                            item.amountHistory.length > 0 && (
                              <div className="ml-11 mt-3 space-y-2 border-l border-white/10 pl-4">
                                {item.amountHistory.map((h, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                                      <span>Amount</span>
                                      <span className="font-medium text-foreground">
                                        EGP {h.previousAmount.toLocaleString()}
                                      </span>
                                      <span>→</span>
                                      <span className="font-medium text-foreground">
                                        EGP {h.newAmount.toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-muted-foreground/70">
                                      {h.userName} · {timeAgo(h.changedAt)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* end right column */}
        </div>
        {/* end two-column layout */}
      </div>
    </main>
  );
}
