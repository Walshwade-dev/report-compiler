"use client";

import { useEffect, useState } from "react";
import ReportsLayout from "../reports/layout";
import {
  Ticket,
  PlusCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Code2,
  Cpu,
  FileCheck2,
} from "lucide-react";

interface DeveloperTicket {
  id: string;
  title: string;
  category: "Bug" | "Feature" | "Enhancement";
  severity: "Low" | "Medium" | "High" | "Critical";
  affectedArea: string;
  description: string;
  expectedBehavior: string;
  submittedAt: string;
  prompt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<DeveloperTicket[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Bug" | "Feature" | "Enhancement">("Bug");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [affectedArea, setAffectedArea] = useState("");
  const [description, setDescription] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<DeveloperTicket | null>(null);
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
  const [developerPassword, setDeveloperPassword] = useState("");
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [developerPasswordError, setDeveloperPasswordError] = useState("");

  // Load tickets on mount
  useEffect(() => {
    const saved = localStorage.getItem("dev-tickets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Promise.resolve().then(() => {
          setTickets(parsed);
        });
      } catch (e) {
        console.error("Failed to parse tickets", e);
      }
    }
  }, []);

  // Save tickets helper
  const saveTickets = (updated: DeveloperTicket[]) => {
    setTickets(updated);
    localStorage.setItem("dev-tickets", JSON.stringify(updated));
  };

  // Compile Developer Prompt
  const compilePrompt = (
    ticketTitle: string,
    ticketCategory: string,
    ticketSeverity: string,
    ticketArea: string,
    ticketDesc: string,
    ticketExpected: string
  ) => {
    return `### AI Coding Agent Instruction Prompt
**Goal**: Resolve the ${ticketCategory.toLowerCase()} reported in the report compiler system.

#### Issue Profile
- **Title**: ${ticketTitle}
- **Category**: ${ticketCategory}
- **Severity**: ${ticketSeverity}
- **Affected Area/File**: ${ticketArea || "General / Unknown"}

#### Detailed Description
${ticketDesc}

#### Expected Behavior / Target State
${ticketExpected}

#### Verification & Quality Guidelines
1. Locate the files in the workspace matching the Affected Area: \`${ticketArea || "Related files"}\`.
2. Inspect the current logic, identify the root cause, and implement the necessary changes.
3. Keep the styling beautiful, cohesive, and premium, avoiding default styling placeholders.
4. Clean up any unused imports, variables, or functions to satisfy all linter checks.
5. Verify the fix runs cleanly and does not break existing test cases or other dashboard pages.
6. Present the summary of modified files and lines in a final report.`;
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !expectedBehavior.trim()) {
      return;
    }

    const compiled = compilePrompt(
      title,
      category,
      severity,
      affectedArea,
      description,
      expectedBehavior
    );

    const newTicket: DeveloperTicket = {
      id: `TKT-${Date.now()}`,
      title,
      category,
      severity,
      affectedArea,
      description,
      expectedBehavior,
      submittedAt: new Date().toLocaleString(),
      prompt: compiled,
    };

    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    setActiveTicket(newTicket);

    // Reset Form
    setTitle("");
    setAffectedArea("");
    setDescription("");
    setExpectedBehavior("");
  };

  const handleDeveloperUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (developerPassword === "Sinimimi8*") {
      setDeveloperUnlocked(true);
      setDeveloperPassword("");
      setDeveloperPasswordError("");
      return;
    }

    setDeveloperPasswordError("Invalid developer password.");
  };

  // Delete Ticket
  const handleDelete = (id: string) => {
    const updated = tickets.filter((t) => t.id !== id);
    saveTickets(updated);
    if (activeTicket?.id === id) {
      setActiveTicket(null);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string, isPrompt = false) => {
    navigator.clipboard.writeText(text);
    if (isPrompt) {
      setIsCopiedPrompt(true);
      setTimeout(() => setIsCopiedPrompt(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Download Markdown file
  const handleDownload = (ticket: DeveloperTicket) => {
    const blob = new Blob([ticket.prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticket.id}_developer_prompt.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Category classes helper
  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "Bug":
        return "bg-rose-500/10 text-rose-300 border-rose-500/25";
      case "Feature":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
      default:
        return "bg-sky-500/10 text-sky-300 border-sky-500/25";
    }
  };

  // Severity classes helper
  const getSeverityClass = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-500/20 text-red-200 border-red-500/30";
      case "High":
        return "bg-amber-500/20 text-amber-200 border-amber-500/30";
      case "Medium":
        return "bg-cyan-500/20 text-cyan-200 border-cyan-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                <Cpu size={12} className="animate-pulse" /> Developer Integration Center
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Ticket Page
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Submit app flaws and suggestions on feature improvements.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5 shadow-lg">
              <div className="flex items-center gap-3 border-b border-cyan-900/50 pb-4 mb-5">
                <PlusCircle className="text-cyan-400" size={20} />
                <h2 className="text-base font-bold text-cyan-200">Submit New Flaw or Request</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ticket-title" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Issue Title
                  </label>
                  <input
                    id="ticket-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily summary cell formula error"
                    className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ticket-category" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </label>
                    <select
                      id="ticket-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as "Bug" | "Feature" | "Enhancement")}
                      className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <option value="Bug">Bug / Flaw</option>
                      <option value="Feature">Feature Request</option>
                      <option value="Enhancement">Enhancement</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ticket-severity" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Severity
                    </label>
                    <select
                      id="ticket-severity"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as "Low" | "Medium" | "High" | "Critical")}
                      className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ticket-area" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Affected File / Page / Component
                  </label>
                  <input
                    id="ticket-area"
                    type="text"
                    value={affectedArea}
                    onChange={(e) => setAffectedArea(e.target.value)}
                    placeholder="e.g. backend/app/services/daily_summary_processor.py or Mobile Report"
                    className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="ticket-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Observed Flaw / Description
                  </label>
                  <textarea
                    id="ticket-desc"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what is currently wrong, steps to reproduce, or context..."
                    className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <div>
                  <label htmlFor="ticket-expected" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Expected Behavior / Fix Details
                  </label>
                  <textarea
                    id="ticket-expected"
                    required
                    rows={3}
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="Describe how it should behave once fixed..."
                    className="mt-1.5 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  <Code2 size={16} />
                  Submit Ticket
                </button>
              </form>
            </div>

            {/* History List */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5 shadow-lg">
              <h2 className="text-base font-bold text-cyan-200 border-b border-cyan-900/50 pb-4 mb-4">Ticket History</h2>
              
              {tickets.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Ticket size={36} className="mx-auto text-slate-500 opacity-40 mb-3" />
                  No tickets generated yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className={`p-4 rounded-lg border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        activeTicket?.id === t.id
                          ? "bg-cyan-950/40 border-cyan-400"
                          : "bg-[#071827]/60 border-cyan-900/40 hover:border-cyan-800"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-400 font-bold">{t.id}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getCategoryClass(t.category)}`}>
                            {t.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityClass(t.severity)}`}>
                            {t.severity}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-slate-100">{t.title}</h3>
                        <p className="text-xs text-slate-400">Submitted: {t.submittedAt}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:self-center">
                        {developerUnlocked && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(t.prompt, t.id);
                              }}
                              title="Copy Prompt"
                              className="p-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 transition"
                            >
                              {copiedId === t.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(t);
                              }}
                              title="Download Prompt (.md)"
                              className="p-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 transition"
                            >
                              <Download size={14} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t.id);
                          }}
                          title="Delete Ticket"
                          className="p-2 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Developer Prompt Access Column */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5 shadow-lg h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="text-cyan-400" size={20} />
                  <h2 className="text-base font-bold text-cyan-200">Developer Prompt Access</h2>
                </div>
                {developerUnlocked && activeTicket && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(activeTicket.prompt, activeTicket.id, true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 text-slate-950 text-xs font-bold transition hover:bg-cyan-300"
                    >
                      {isCopiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                      {isCopiedPrompt ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleDownload(activeTicket)}
                      className="p-1 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 transition"
                      title="Download Markdown"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>

              {!developerUnlocked ? (
                <form
                  onSubmit={handleDeveloperUnlock}
                  className="flex-1 flex flex-col items-center justify-center text-center py-20 text-slate-400 bg-[#071827]/40 rounded-lg border border-dashed border-cyan-900/30"
                >
                  <Code2 size={48} className="text-cyan-600 opacity-30 mb-3" />
                  <p className="max-w-sm text-sm">
                    AI prompt previews are restricted to the developer.
                  </p>
                  <div className="mt-5 w-full max-w-xs">
                    <label htmlFor="developer-password" className="sr-only">
                      Developer password
                    </label>
                    <input
                      id="developer-password"
                      type="password"
                      value={developerPassword}
                      onChange={(e) => {
                        setDeveloperPassword(e.target.value);
                        setDeveloperPasswordError("");
                      }}
                      placeholder="Developer password"
                      className="w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                    />
                    {developerPasswordError && (
                      <p className="mt-2 text-xs font-semibold text-rose-300">
                        {developerPasswordError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="mt-3 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      Unlock Preview
                    </button>
                  </div>
                </form>
              ) : activeTicket ? (
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <div className="flex-1 bg-[#071827] rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto border border-cyan-900/50 max-h-[700px] whitespace-pre-wrap">
                    {activeTicket.prompt}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-slate-400 bg-[#071827]/40 rounded-lg border border-dashed border-cyan-900/30">
                  <Code2 size={48} className="text-cyan-600 opacity-30 mb-3" />
                  <p className="text-sm">Submit a ticket or select a ticket from your history to view its AI Developer Prompt here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
