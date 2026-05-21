"use client";

import { useState } from "react";
import { Search, Loader2, Building2, Clock3 } from "lucide-react";
import Link from "next/link";

type Company = {
  _id: string;
  name: string;
  notes?: string;
  totalOutstanding?: number;
  debts?: { amount: number; amountPaid: number }[];
};

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/companies/search?name=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      setCompanies(res.ok ? data.companies : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-[rgba(139,92,246,0.15)] blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-20">
        {/* heading */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              Find
            </span>{" "}
            <span className="text-foreground">a Company</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Search by company name to view its details.
          </p>
        </div>

        {/* search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="e.g. Acme Inc."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur-xl transition-colors placeholder:text-muted-foreground focus:border-white/30"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search
          </button>
        </div>

        {/* results */}
        <div className="mt-6 space-y-3">
          {searched && !loading && companies.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
              No company found with that name.
            </div>
          )}

          {companies.map((c) => {
            const outstanding =
              c.totalOutstanding ??
              (c.debts ?? []).reduce(
                (s, d) => s + Math.max(d.amount - d.amountPaid, 0),
                0,
              );
            return (
              <Link
                key={c._id}
                href={`/companies/${c._id}`}
                className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-2xl"
                style={{
                  boxShadow:
                    "0 0 40px rgba(139,92,246,0.25), 0 0 80px rgba(124,58,237,0.15)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <Building2 className="size-5 text-foreground/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    {c.notes ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {c.notes}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm italic text-muted-foreground/60">
                        No description
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p
                      className={`font-semibold ${
                        outstanding > 0
                          ? "text-status-unpaid"
                          : "text-status-paid"
                      }`}
                    >
                      {outstanding.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
