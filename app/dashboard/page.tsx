"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSpreadsheet,
  Loader2,
  Plus,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

type Tab = "upload" | "manual";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* ambient white glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-20">
        {/* hero heading */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              Add
            </span>{" "}
            <span className="text-foreground">Companies</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            
          </p>
          <span className="mx-auto mt-4 text-foreground font-semibold bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-1 rounded-md">
                Import a spreadsheet or add a company by hand.
              </span>
        </div>

        {/* segmented control */}
        <div className="mx-auto mb-6 grid max-w-md grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
            <FileSpreadsheet className="size-4" /> Upload Excel
          </TabButton>
          <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
            <Plus className="size-4" /> Add Manually
          </TabButton>
        </div>

        {tab === "upload" ? <UploadCard /> : <ManualCard />}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
        active
          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function GlowCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-2xl"
      style={{
        boxShadow:
          "0 0 50px rgba(139,92,246,0.5), 0 0 100px rgba(124,58,237,0.3)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
}

function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/companies/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(
        `Imported ${data.inserted} new ${
          data.inserted === 1 ? "company" : "companies"
        }` + (data.skipped ? ` · ${data.skipped} already existed` : "")
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlowCard>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">
          Upload Excel sheet
        </h2>
        <p className="text-sm text-muted-foreground">
          First column should contain company names. Duplicates are skipped.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) setFile(dropped);
        }}
        className={`group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center transition-all duration-300 ${
          dragging
            ? "border-white/40 bg-white/5"
            : file
              ? "border-status-paid/50 bg-status-paid/5"
              : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
        }`}
      >
        <div
          className={`flex size-14 items-center justify-center rounded-full transition-all duration-300 ${
            file
              ? "bg-status-paid/15 text-status-paid"
              : "bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-white"
          }`}
        >
          {file ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <UploadCloud className="size-7" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {file ? file.name : "Click or drop an .xlsx file here"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">.xlsx or .xls</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <Button
        onClick={handleUpload}
        disabled={!file || busy}
        className="mt-5 w-full bg-white text-black font-medium shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] disabled:opacity-30 disabled:shadow-none"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Importing…
          </>
        ) : (
          <>
            <UploadCloud className="size-4" /> Import companies
          </>
        )}
      </Button>
    </GlowCard>
  );
}

function ManualCard() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Company name is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add company");
      toast.success(`Added ${data.company.name}`);
      setName("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlowCard>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">
          Add a company
        </h2>
        <p className="text-sm text-muted-foreground">
          Create a single company record.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground/80">
            Company name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="border-white/10 bg-white/5 placeholder:text-muted-foreground focus-visible:border-white/30 focus-visible:ring-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground/80">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about this company…"
            rows={3}
            className="border-white/10 bg-white/5 placeholder:text-muted-foreground focus-visible:border-white/30 focus-visible:ring-white/10"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full bg-white text-black font-medium shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] disabled:opacity-30 disabled:shadow-none"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <Plus className="size-4" /> Add company
            </>
          )}
        </Button>
      </div>
    </GlowCard>
  );
}