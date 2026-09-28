"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  Gauge,
  GitBranch,
  History,
  Layers3,
  Lightbulb,
  Menu,
  Network,
  Plus,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Memory = {
  id?: string;
  text?: string;
  type?: string;
  context?: string;
  occurred_start?: string;
  mentioned_at?: string;
  document_id?: string;
};

type IncidentRecord = {
  id: string;
  title: string;
  service: string;
  symptoms: string;
  logs: string;
  createdAt: string;
  memoryCount: number;
  stored: boolean;
  recalled: boolean;
  analysis?: string;
};

type Result = {
  success: boolean;
  incident?: {
    title?: string;
    service?: string;
    symptoms?: string;
    logs?: string;
  };
  analysis: string;
  memories: Memory[];
  memoryCount: number;
  hindsight: {
    recalled: boolean;
    stored: boolean;
    recallError: string | null;
    retainError: string | null;
  };
};

function parseSection(text: string, title: string, nextTitles: string[]) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (nextTitles.length === 0) {
    const regex = new RegExp(`${escapedTitle}\\s*([\\s\\S]*?)$`, "i");
    return text.match(regex)?.[1]?.trim() || "";
  }

  const escapedNext = nextTitles
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(
    `${escapedTitle}\\s*([\\s\\S]*?)(?=\\n\\s*(?:${escapedNext})\\s*$|$)`,
    "i"
  );

  return text.match(regex)?.[1]?.trim() || "";
}

function clean(value: string) {
  return value
    .replace(/^[\s:*#-]+/, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getAnalysis(text: string) {
  const sections = [
    "1. ROOT CAUSE",
    "2. EVIDENCE",
    "3. IMMEDIATE ACTIONS",
    "4. MEMORY MATCH",
    "5. CONFIDENCE",
    "6. LESSON FOR FUTURE",
  ];

  return {
    rootCause: clean(parseSection(text, sections[0], sections.slice(1))),
    evidence: clean(parseSection(text, sections[1], sections.slice(2))),
    actions: clean(parseSection(text, sections[2], sections.slice(3))),
    memoryMatch: clean(parseSection(text, sections[3], sections.slice(4))),
    confidence: clean(parseSection(text, sections[4], sections.slice(5))),
    lesson: clean(parseSection(text, sections[5], [])),
  };
}

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");

  // Hydration-safe: localStorage is read only after the client mounts.
  const [result, setResult] = useState<Result | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<IncidentRecord[]>([]);

  const [title, setTitle] = useState("");
  const [service, setService] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [logs, setLogs] = useState("");

  useEffect(() => {
    try {
      const savedResult = localStorage.getItem("memoryos:last-result");
      if (savedResult) {
        setResult(JSON.parse(savedResult));
      }

      const savedIncidents = localStorage.getItem("memoryos:incidents");
      if (savedIncidents) {
        setIncidentHistory(JSON.parse(savedIncidents));
      }
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "memoryos:incidents",
        JSON.stringify(incidentHistory)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [incidentHistory]);

  async function analyzeIncident(event: FormEvent) {
    event.preventDefault();

    if (!title.trim() || !service.trim() || !symptoms.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          service: service.trim(),
          symptoms: symptoms.trim(),
          logs: logs.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to analyze incident");
      }

      setResult(data);

      try {
        localStorage.setItem("memoryos:last-result", JSON.stringify(data));
      } catch {
        // Ignore storage errors.
      }

      const newIncident: IncidentRecord = {
        id: `INC-${Date.now().toString().slice(-5)}`,
        title: data.incident?.title || title,
        service: data.incident?.service || service,
        symptoms: data.incident?.symptoms || symptoms,
        logs: data.incident?.logs || logs,
        createdAt: new Date().toISOString(),
        memoryCount: data.memoryCount || 0,
        stored: Boolean(data.hindsight?.stored),
        recalled: Boolean(data.hindsight?.recalled),
        analysis: data.analysis,
      };

      setIncidentHistory((current) => [
        newIncident,
        ...current.filter(
          (item) =>
            item.title !== newIncident.title ||
            item.service !== newIncident.service
        ),
      ]);

      setShowIncident(false);
      setActiveNav("Overview");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to analyze incident."
      );
    } finally {
      setLoading(false);
    }
  }

  const analysis = result ? getAnalysis(result.analysis) : null;
  const totalMemories = result?.memoryCount ?? 0;

  const recalledMemories = incidentHistory.reduce(
    (total, incident) => total + incident.memoryCount,
    0
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070a] text-white selection:bg-cyan-400/20">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[30%] top-[-20%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.045] blur-[150px]" />
        <div className="absolute right-[-15%] top-[30%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.025] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/[0.07] bg-[#07090d]/75 px-5 py-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <Brand />

          <div className="mt-11">
            <p className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/25">
              Navigation
            </p>

            <nav className="mt-4 space-y-1.5">
              {[
                ["Overview", Activity],
                ["Incidents", AlertTriangle],
                ["Memory", BrainCircuit],
                ["Patterns", Network],
              ].map(([name, Icon]) => (
                <button
                  key={String(name)}
                  onClick={() => setActiveNav(String(name))}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition ${
                    activeNav === name
                      ? "border border-white/[0.08] bg-white/[0.055] text-white"
                      : "text-white/40 hover:bg-white/[0.035] hover:text-white/80"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.7}
                    className={
                      activeNav === name
                        ? "text-cyan-300"
                        : "text-white/30"
                    }
                  />
                  <span>{String(name)}</span>

                  {name === "Incidents" && (
                    <span className="ml-auto rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/35">
                      {String(Math.max(incidentHistory.length, 3)).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5">
              <div className="absolute right-[-25px] top-[-25px] h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-[14px] text-white/70">
                  Hindsight connected
                </span>
              </div>

              <p className="relative mt-3 text-[12px] leading-6 text-white/30">
                Previous incident experience is available during investigations.
              </p>
            </div>

            <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] text-white/30 hover:bg-white/[0.03] hover:text-white/70">
              <Settings size={17} />
              Settings
            </button>

            <div className="mt-5 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-sm">
                  C
                </div>

                <div>
                  <p className="text-[14px] font-medium">Chaitanya</p>
                  <p className="text-[11px] text-white/25">Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[78px] items-center justify-between border-b border-white/[0.07] px-5 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNav(true)}
                className="rounded-lg p-2 text-white/40 hover:bg-white/5 lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div className="hidden items-center gap-2 text-[13px] text-white/25 sm:flex">
                <span>Workspace</span>
                <ChevronRight size={14} />
                <span className="text-white/55">{activeNav}</span>
              </div>

              <div className="sm:hidden">
                <Brand compact />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.05] px-4 py-2 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-emerald-300/70">
                  Hindsight connected
                </span>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm">
                C
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-9 lg:px-10 lg:py-12">
            {activeNav === "Overview" && (
              <OverviewView
                result={result}
                analysis={analysis}
                totalMemories={totalMemories}
                incidentHistory={incidentHistory}
                onNewIncident={() => setShowIncident(true)}
                onOpenIncidents={() => setActiveNav("Incidents")}
                onOpenMemory={() => setActiveNav("Memory")}
              />
            )}

            {activeNav === "Incidents" && (
              <IncidentsView
                history={incidentHistory}
                onNewIncident={() => setShowIncident(true)}
              />
            )}

            {activeNav === "Memory" && (
              <MemoryView
                result={result}
                history={incidentHistory}
                recalledMemories={recalledMemories}
              />
            )}

            {activeNav === "Patterns" && (
              <PatternsView result={result} history={incidentHistory} />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => setMobileNav(false)}
          >
            <motion.div
              initial={{ x: -270 }}
              animate={{ x: 0 }}
              exit={{ x: -270 }}
              onClick={(event) => event.stopPropagation()}
              className="h-full w-[290px] border-r border-white/10 bg-[#080a0e] p-6"
            >
              <div className="flex items-center justify-between">
                <Brand />

                <button
                  onClick={() => setMobileNav(false)}
                  className="text-white/30"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="mt-11 space-y-1.5">
                {["Overview", "Incidents", "Memory", "Patterns"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setActiveNav(item);
                        setMobileNav(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-4 py-3.5 text-left text-[15px] transition ${
                        activeNav === item
                          ? "bg-white/[0.06] text-white"
                          : "text-white/45 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIncident && (
          <IncidentModal
            loading={loading}
            title={title}
            service={service}
            symptoms={symptoms}
            logs={logs}
            setTitle={setTitle}
            setService={setService}
            setSymptoms={setSymptoms}
            setLogs={setLogs}
            onClose={() => setShowIncident(false)}
            onSubmit={analyzeIncident}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function OverviewView({
  result,
  analysis,
  totalMemories,
  incidentHistory,
  onNewIncident,
  onOpenIncidents,
  onOpenMemory,
}: {
  result: Result | null;
  analysis: ReturnType<typeof getAnalysis> | null;
  totalMemories: number;
  incidentHistory: IncidentRecord[];
  onNewIncident: () => void;
  onOpenIncidents: () => void;
  onOpenMemory: () => void;
}) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col justify-between gap-8 md:flex-row md:items-end"
      >
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300/60">
            <Activity size={13} />
            Incident workspace
          </div>

          <h1 className="mt-4 max-w-3xl text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[52px]">
            Investigate incidents
            <br />
            <span className="text-white/35">with experience.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/40">
            Connect current production signals with previous incidents, root causes, and proven resolution steps.
          </p>
        </div>

        <button
          onClick={onNewIncident}
          className="group flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-medium text-black transition hover:bg-cyan-50"
        >
          <Plus size={19} />
          New incident
          <ArrowRight
            size={17}
            className="ml-1 transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
        className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          label="Investigations"
          value={String(incidentHistory.length).padStart(2, "0")}
          detail="Recorded in this workspace"
          icon={AlertTriangle}
        />

        <Metric
          label="Memory retained"
          value={String(
            incidentHistory.filter((incident) => incident.stored).length
          ).padStart(2, "0")}
          detail="Successful retention events"
          icon={ShieldCheck}
        />

        <Metric
          label="Memory matches"
          value={totalMemories > 0 ? String(totalMemories) : "—"}
          detail={
            totalMemories > 0
              ? "Recalled for latest investigation"
              : "No recall yet"
          }
          icon={BrainCircuit}
          cyan
        />

        <Metric
          label="Services investigated"
          value={String(
            new Set(incidentHistory.map((incident) => incident.service)).size
          ).padStart(2, "0")}
          detail="Distinct services"
          icon={GitBranch}
        />
      </motion.section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                Current incidents
              </p>
              <h2 className="mt-1.5 text-[18px] font-medium">
                Active incidents
              </h2>
            </div>

            <button
              onClick={onOpenIncidents}
              className="text-[11px] uppercase tracking-wider text-white/30 hover:text-cyan-300"
            >
              View all
            </button>
          </div>

          <div className="p-4">
            {incidentHistory.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No investigations yet"
                text="Run an incident analysis to create your first investigation."
              />
            ) : (
              incidentHistory.slice(0, 3).map((incident) => (
                <IncidentRow
                  key={incident.id}
                  id={incident.id}
                  title={incident.title}
                  service={incident.service}
                  severity="INCIDENT"
                  status={
                    incident.stored
                      ? "Memory retained"
                      : "Investigation recorded"
                  }
                  active={incident.recalled}
                />
              ))
            )}
          </div>
        </motion.div>

        <MemoryEngine memoryCount={totalMemories} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018]"
      >
        <div className="border-b border-white/[0.06] px-6 py-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                Investigation workflow
              </p>

              <h2 className="mt-1.5 text-[20px] font-medium">
                From incident to reusable knowledge.
              </h2>
            </div>

            <div className="text-[11px] uppercase tracking-[0.18em] text-white/20">
              Retain → Recall → Reason → Learn
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-4">
          <PipelineStep
            number="01"
            icon={Terminal}
            title="Incident"
            text="Capture symptoms, logs and service context."
          />

          <PipelineStep
            number="02"
            icon={Search}
            title="Recall"
            text="Search Hindsight for relevant experience."
            active
          />

          <PipelineStep
            number="03"
            icon={BrainCircuit}
            title="Reason"
            text="Correlate current signals with prior outcomes."
          />

          <PipelineStep
            number="04"
            icon={Lightbulb}
            title="Learn"
            text="Retain the resolution for future incidents."
          />
        </div>
      </motion.section>

      <AnimatePresence>
        {result && analysis && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 overflow-hidden rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.018]"
          >
            <div className="border-b border-white/[0.07] px-6 py-6 lg:px-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                      <Check size={13} />
                    </span>

                    <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/60">
                      Investigation complete
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-[22px] font-semibold">
                    {result.incident?.title || "Incident analysis"}
                  </h2>

                  <p className="mt-1.5 text-[12px] text-white/30">
                    {result.incident?.service || "unknown service"} ·{" "}
                    {result.memoryCount} memories retrieved
                  </p>
                </div>

                <div className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2 text-[12px] text-emerald-300">
                  {analysis.memoryMatch.split("\n")[0] ||
                    "Memory analyzed"}
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_.85fr] lg:p-7">
              <div className="space-y-5">
                <ResultCard
                  eyebrow="Root cause"
                  icon={AlertTriangle}
                  title={analysis.rootCause || "Analysis available"}
                  primary
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <ResultCard
                    eyebrow="Evidence"
                    icon={Activity}
                    title={analysis.evidence || "No evidence summary."}
                  />

                  <ResultCard
                    eyebrow="Confidence"
                    icon={Gauge}
                    title={analysis.confidence || "Unknown"}
                  />
                </div>

                <ResultCard
                  eyebrow="Immediate actions"
                  icon={Zap}
                  title={
                    analysis.actions || "No immediate actions returned."
                  }
                />

                <ResultCard
                  eyebrow="Lesson for future"
                  icon={Lightbulb}
                  title={analysis.lesson || "No lesson returned."}
                />
              </div>

              <HindsightResults
                result={result}
                memoryMatch={analysis.memoryMatch}
                onOpenMemory={onOpenMemory}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function IncidentsView({
  history,
  onNewIncident,
}: {
  history: IncidentRecord[];
  onNewIncident: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        eyebrow="Incident intelligence"
        title="Incident history."
        description="Every investigation becomes reusable engineering experience."
        action={onNewIncident}
      />

      <div className="mt-9 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
              Investigations
            </p>
          </div>

          {history.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No investigations yet"
              text="Run your first production incident analysis to create a persistent investigation trail."
            />
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {history.map((incident, index) => (
                <div
                  key={incident.id}
                  className="group flex items-center gap-4 px-6 py-6 transition hover:bg-white/[0.025]"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                      incident.recalled
                        ? "border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300"
                        : "border-white/[0.07] bg-white/[0.025] text-white/25"
                    }`}
                  >
                    {incident.recalled ? (
                      <BrainCircuit size={20} />
                    ) : (
                      <AlertTriangle size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-white/25">
                        {incident.id}
                      </span>

                      {index === 0 && (
                        <span className="rounded-md bg-cyan-400/[0.08] px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-300/60">
                          Latest
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 truncate text-[16px] font-medium text-white/80">
                      {incident.title}
                    </p>

                    <p className="mt-1.5 text-[11px] text-white/25">
                      {incident.service} · {formatDate(incident.createdAt)}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="text-[18px] font-semibold">
                      {incident.memoryCount}
                    </p>

                    <p className="text-[10px] uppercase tracking-wider text-white/20">
                      memories
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-white/10 transition group-hover:text-white/40"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <InsightCard
            icon={BrainCircuit}
            eyebrow="Investigation workflow"
            title="Every incident can teach the next one."
            text="Hindsight retrieves previous production experience before generating its recommendation."
          />

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
              Workflow
            </p>

            <div className="mt-6 space-y-5">
              <WorkflowLine number="01" title="Capture" text="Symptoms + logs" />
              <WorkflowLine number="02" title="Recall" text="Hindsight memory" />
              <WorkflowLine number="03" title="Reason" text="AI investigation" />
              <WorkflowLine number="04" title="Retain" text="Future learning" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MemoryView({
  result,
  history,
  recalledMemories,
}: {
  result: Result | null;
  history: IncidentRecord[];
  recalledMemories: number;
}) {
  const memories = result?.memories || [];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        eyebrow="Hindsight memory"
        title="Incident memory."
        description="See the experiences Hindsight retrieved and how they influence incident reasoning."
      />

      <div className="mt-9 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.018] p-7">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.08] blur-[70px]" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-cyan-300" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/60">
                  Hindsight
                </span>
              </div>

              <p className="mt-9 text-[48px] font-semibold tracking-[-0.06em]">
                {result?.memoryCount ?? 0}
              </p>

              <p className="mt-2 text-[14px] text-white/35">
                memories recalled in the latest investigation
              </p>

              <div className="mt-9 grid grid-cols-2 gap-4">
                <MiniStat
                  label="Recall"
                  value={result?.hindsight.recalled ? "ACTIVE" : "IDLE"}
                />

                <MiniStat
                  label="Retention"
                  value={result?.hindsight.stored ? "STORED" : "PENDING"}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
              Memory lifecycle
            </p>

            <div className="mt-6">
              <MemoryLifecycle />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.018]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                  Retrieved experiences
                </p>

                <h2 className="mt-1.5 text-[18px] font-medium">
                  Hindsight recall results
                </h2>
              </div>

              <span className="rounded-md bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] text-cyan-300/60">
                {memories.length} RESULTS
              </span>
            </div>
          </div>

          {memories.length === 0 ? (
            <EmptyState
              icon={BrainCircuit}
              title="Memory is waiting"
              text="Run an incident analysis. Retrieved Hindsight experiences will appear here."
            />
          ) : (
            <div className="space-y-4 p-5">
              {memories.map((memory, index) => (
                <div
                  key={memory.id || memory.document_id || index}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-5 transition hover:border-cyan-400/10 hover:bg-cyan-400/[0.015]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/[0.06] text-[10px] text-cyan-300/60">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="text-[10px] uppercase tracking-wider text-white/25">
                        {memory.type || "experience"}
                      </span>
                    </div>

                    <History size={14} className="text-white/15" />
                  </div>

                  <p className="mt-4 whitespace-pre-line text-[14px] leading-7 text-white/50">
                    {memory.text ||
                      memory.context ||
                      "Previous production experience retrieved from Hindsight."}
                  </p>

                  {memory.document_id && (
                    <p className="mt-3 truncate text-[10px] text-white/15">
                      {memory.document_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
              Recent memory activity
            </p>

            <h2 className="mt-1.5 text-[18px] font-medium">
              Memory-assisted investigations
            </h2>
          </div>

          <span className="text-[11px] text-white/25">
            {recalledMemories} total recalled
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {history.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/[0.06] bg-black/20 p-5"
            >
              <p className="text-[10px] text-white/20">{item.id}</p>

              <p className="mt-2.5 line-clamp-2 text-[14px] font-medium text-white/65">
                {item.title}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[10px] text-white/20">
                  {item.service}
                </span>

                <span
                  className={
                    item.stored
                      ? "text-[10px] text-emerald-300/70"
                      : "text-[10px] text-amber-300/70"
                  }
                >
                  {item.stored ? "STORED" : "PENDING"}
                </span>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="md:col-span-3">
              <p className="text-[14px] text-white/25">
                Your investigation timeline will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PatternsView({
  result,
  history,
}: {
  result: Result | null;
  history: IncidentRecord[];
}) {
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    history.forEach((item) => {
      counts[item.service] = (counts[item.service] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [history]);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        eyebrow="Operational patterns"
        title="Patterns across incidents."
        description="MemoryOS turns repeated production experience into recognizable operational signals."
      />

      <div className="mt-9 grid gap-6 lg:grid-cols-3">
        <PatternCard
          icon={Database}
          title="Database pressure"
          description="Connection pool exhaustion"
          status={
            result?.analysis?.toLowerCase().includes("connection")
              ? "Detected"
              : "Observed"
          }
        />

        <PatternCard
          icon={Server}
          title="Payment degradation"
          description="503 + elevated latency"
          status="Recurring"
        />

        <PatternCard
          icon={Network}
          title="Service dependency"
          description="Downstream resource contention"
          status="Tracked"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.75fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                Service frequency
              </p>

              <h2 className="mt-1.5 text-[18px] font-medium">
                Where memory is accumulating
              </h2>
            </div>

            <Layers3 size={18} className="text-white/20" />
          </div>

          <div className="mt-7 space-y-6">
            {serviceCounts.length === 0 ? (
              <>
                <PatternBar label="payments-api" value={68} />
                <PatternBar label="checkout-api" value={44} />
                <PatternBar label="orders-webhook" value={31} />
              </>
            ) : (
              serviceCounts.map(([service, count]) => (
                <PatternBar
                  key={service}
                  label={service}
                  value={Math.min(count * 25, 100)}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.018] p-6">
          <div className="flex items-center gap-2">
            <Lightbulb size={17} className="text-cyan-300/70" />

            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/60">
              What memory adds
            </p>
          </div>

          <p className="mt-6 text-[24px] font-semibold tracking-[-0.03em]">
            Context before conclusion.
          </p>

          <p className="mt-4 text-[14px] leading-7 text-white/35">
            Instead of treating every incident as a new problem, MemoryOS
            retrieves previous engineering experience and gives the reasoning
            layer historical context.
          </p>

          <div className="mt-7 rounded-xl border border-white/[0.06] bg-black/20 p-5">
            <div className="flex items-center gap-2">
              <BrainCircuit size={15} className="text-cyan-300" />

              <span className="text-[10px] uppercase tracking-wider text-white/35">
                Why memory matters
              </span>
            </div>

            <p className="mt-3 text-[13px] leading-6 text-white/55">
              Similar symptoms can be connected to previously observed causes,
              evidence and successful actions.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300/60">
          <Sparkles size={13} />
          {eyebrow}
        </div>

        <h1 className="mt-4 text-[42px] font-semibold leading-tight tracking-[-0.045em] sm:text-[50px]">
          {title}
        </h1>

        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/40">
          {description}
        </p>
      </div>

      {action && (
        <button
          onClick={action}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-medium text-black transition hover:bg-cyan-50"
        >
          <Plus size={18} />
          New incident
        </button>
      )}
    </div>
  );
}

function IncidentModal({
  loading,
  title,
  service,
  symptoms,
  logs,
  setTitle,
  setService,
  setSymptoms,
  setLogs,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  title: string;
  service: string;
  symptoms: string;
  logs: string;
  setTitle: (value: string) => void;
  setService: (value: string) => void;
  setSymptoms: (value: string) => void;
  setLogs: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/[0.1] bg-[#090c11] shadow-2xl shadow-black/60"
      >
        <div className="border-b border-white/[0.07] px-7 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-300/60">
                <CircleDot size={13} />
                Incident workspace
              </div>

              <h2 className="mt-2.5 text-[23px] font-semibold">
                Investigate production incident
              </h2>

              <p className="mt-2 text-[13px] text-white/30">
                Hindsight retrieves relevant previous incidents before the investigation is generated.
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2.5 text-white/25 hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-7">
          <div className="space-y-6">
            <Field
              label="Incident title"
              placeholder="Payment API elevated latency"
              value={title}
              onChange={setTitle}
              required
            />

            <Field
              label="Service"
              placeholder="payments-api"
              value={service}
              onChange={setService}
              required
            />

            <TextArea
              label="Symptoms"
              placeholder="Customers are receiving 503 responses..."
              value={symptoms}
              onChange={setSymptoms}
              required
            />

            <TextArea
              label="Logs / technical signals"
              placeholder="Paste logs, errors, metrics or observations..."
              value={logs}
              onChange={setLogs}
              rows={5}
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <MiniFeature icon={Search} text="Recall memory" />
            <MiniFeature icon={Network} text="Find patterns" />
            <MiniFeature icon={Lightbulb} text="Recommend action" />
          </div>

          <div className="mt-7 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className="text-cyan-300" />

              <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/60">
                Memory-assisted investigation
              </span>
            </div>

            <p className="mt-2.5 text-[12px] leading-6 text-white/30">
              Hindsight retrieves relevant previous incidents before the investigation is generated.
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-6 py-3.5 text-[14px] text-white/40 hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-medium text-black transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Investigating...
                </>
              ) : (
                <>
                  Investigate incident
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08]">
        <BrainCircuit size={19} className="text-cyan-300" strokeWidth={1.6} />
      </div>

      {!compact && (
        <div>
          <p className="text-[14px] font-semibold tracking-[0.18em]">
            MEMORYOS
          </p>

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
            Incident response
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  cyan,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  cyan?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.022] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.17em] text-white/25">
          {label}
        </p>

        <Icon
          size={18}
          className={cyan ? "text-cyan-300/60" : "text-white/20"}
          strokeWidth={1.6}
        />
      </div>

      <p className="mt-5 text-[34px] font-semibold tracking-[-0.05em]">
        {value}
      </p>

      <p className="mt-2 text-[12px] text-white/25">{detail}</p>
    </div>
  );
}

function IncidentRow({
  id,
  title,
  service,
  severity,
  status,
  active,
}: {
  id: string;
  title: string;
  service: string;
  severity: string;
  status: string;
  active?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-5 hover:border-white/[0.06] hover:bg-white/[0.025]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            active
              ? "bg-cyan-300"
              : status === "Investigation recorded"
                ? "bg-emerald-400"
                : "bg-cyan-300"
          }`}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/25">{id}</span>

            <span className="rounded-md border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/30">
              {severity}
            </span>
          </div>

          <p className="mt-1.5 truncate text-[15px] font-medium text-white/80">
            {title}
          </p>

          <p className="mt-1.5 text-[11px] text-white/25">
            {service} · {status}
          </p>
        </div>
      </div>

      <ChevronRight
        size={17}
        className="text-white/10 transition group-hover:text-white/40"
      />
    </motion.div>
  );
}

function MemoryEngine({ memoryCount }: { memoryCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.018] p-6"
    >
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.07] blur-[70px]" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrainCircuit size={17} className="text-cyan-300/70" />

            <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/60">
              Hindsight memory
            </span>
          </div>

          <span className="text-[10px] uppercase tracking-wider text-emerald-300/60">
            Connected
          </span>
        </div>

        <h2 className="mt-7 text-[24px] font-semibold tracking-[-0.025em]">
          Memory changes
          <br />
          the response.
        </h2>

        <p className="mt-4 max-w-md text-[13px] leading-6 text-white/30">
          Hindsight connects current incidents to previous experiences,
          allowing MemoryOS to recognize patterns that a stateless assistant
          would miss.
        </p>

        <div className="relative mt-7 h-[165px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
          <MemoryNetwork />

          <div className="absolute bottom-3 left-3 rounded-md border border-white/[0.07] bg-black/50 px-3 py-1.5 text-[10px] text-white/40 backdrop-blur">
            {memoryCount} memories available
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MemoryNetwork() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-[14%] top-[42%] h-px w-[70%] rotate-[-10deg] bg-white/[0.08]" />
      <div className="absolute left-[30%] top-[25%] h-px w-[45%] rotate-[24deg] bg-white/[0.06]" />

      {[
        ["12%", "46%", "h-2.5 w-2.5"],
        ["30%", "25%", "h-3.5 w-3.5"],
        ["50%", "52%", "h-3 w-3"],
        ["70%", "32%", "h-4 w-4"],
        ["84%", "58%", "h-2.5 w-2.5"],
      ].map(([left, top, size], index) => (
        <div
          key={index}
          className={`absolute ${size} rounded-full border border-cyan-300/30 bg-cyan-300/50`}
          style={{ left, top }}
        />
      ))}

      <div className="absolute left-[47%] top-[38%] flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-none">
        <BrainCircuit size={20} className="text-cyan-200" />
      </div>

      <span className="absolute bottom-4 left-[8%] text-[10px] uppercase tracking-wider text-white/15">
        past
      </span>

      <span className="absolute bottom-4 right-[8%] text-[10px] uppercase tracking-wider text-white/15">
        current
      </span>
    </div>
  );
}

function PipelineStep({
  number,
  icon: Icon,
  title,
  text,
  active,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative border-white/[0.06] p-6 md:border-r last:md:border-r-0 ${
        active ? "bg-cyan-400/[0.025]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/20">{number}</span>

        <Icon
          size={18}
          className={active ? "text-cyan-300/70" : "text-white/20"}
          strokeWidth={1.5}
        />
      </div>

      <h3 className="mt-6 text-[16px] font-medium">{title}</h3>

      <p className="mt-2.5 text-[12px] leading-6 text-white/30">{text}</p>

      {active && (
        <div className="absolute bottom-0 left-6 right-6 h-px bg-cyan-300/30" />
      )}
    </div>
  );
}

function ResultCard({
  eyebrow,
  icon: Icon,
  title,
  primary,
}: {
  eyebrow: string;
  icon: React.ElementType;
  title: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        primary
          ? "border-cyan-400/10 bg-cyan-400/[0.025]"
          : "border-white/[0.06] bg-white/[0.018]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={15} className="text-white/25" strokeWidth={1.5} />

        <p className="text-[11px] uppercase tracking-[0.17em] text-white/30">
          {eyebrow}
        </p>
      </div>

      <p
        className={`mt-4 whitespace-pre-line leading-7 ${
          primary
            ? "text-[16px] font-medium text-white/90"
            : "text-[14px] text-white/50"
        }`}
      >
        {title}
      </p>
    </div>
  );
}

function HindsightResults({
  result,
  memoryMatch,
  onOpenMemory,
}: {
  result: Result;
  memoryMatch: string;
  onOpenMemory: () => void;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-black/20 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <BrainCircuit size={17} className="text-cyan-300/70" />

            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/60">
              Hindsight recall
            </p>
          </div>

          <h3 className="mt-2.5 text-[18px] font-medium">
            Recall summary
          </h3>
        </div>

        <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/35">
          {result.memoryCount} recalled
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[28px] font-semibold">{result.memoryCount}</p>

          <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/25">
            memories recalled
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[28px] font-semibold text-cyan-300">
            {result.memoryCount > 0 ? "✓" : "—"}
          </p>

          <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/25">
            relevant history
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/50">
          Memory match
        </p>

        <p className="mt-2.5 text-[14px] leading-6 text-white/55">
          {memoryMatch || "No previous memory match was identified."}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {result.memories.slice(0, 4).map((memory, index) => (
          <div
            key={memory.id || memory.document_id || index}
            className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-cyan-300/50">
                Memory {String(index + 1).padStart(2, "0")}
              </span>

              <History size={13} className="text-white/15" />
            </div>

            <p className="mt-2.5 line-clamp-4 text-[13px] leading-6 text-white/40">
              {memory.text ||
                memory.context ||
                "Previous production experience retrieved from Hindsight."}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenMemory}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] py-3.5 text-[11px] uppercase tracking-[0.16em] text-white/35 transition hover:border-cyan-400/10 hover:bg-cyan-400/[0.025] hover:text-cyan-300"
      >
        Explore memory
        <ArrowRight size={14} />
      </button>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
        <span className="text-[11px] text-white/25">Memory retention</span>

        <span
          className={`text-[11px] ${
            result.hindsight.stored
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {result.hindsight.stored
            ? "● Stored successfully"
            : "● Retention pending"}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.17em] text-white/30">
        {label}
        {required && <span className="ml-1 text-cyan-400">*</span>}
      </span>

      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2.5 h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-[15px] text-white outline-none placeholder:text-white/15 focus:border-cyan-400/30 focus:bg-white/[0.04]"
      />
    </label>
  );
}

function TextArea({
  label,
  placeholder,
  value,
  onChange,
  required,
  rows = 4,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.17em] text-white/30">
        {label}
        {required && <span className="ml-1 text-cyan-400">*</span>}
      </span>

      <textarea
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2.5 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 text-[15px] leading-7 text-white outline-none placeholder:text-white/15 focus:border-cyan-400/30 focus:bg-white/[0.04]"
      />
    </label>
  );
}

function MiniFeature({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.018] px-4 py-3.5">
      <Icon size={15} className="text-cyan-300/60" />

      <span className="text-[12px] text-white/35">{text}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        <Icon size={21} className="text-white/20" />
      </div>

      <h3 className="mt-6 text-[16px] font-medium text-white/65">{title}</h3>

      <p className="mt-2.5 max-w-sm text-[13px] leading-6 text-white/25">
        {text}
      </p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  eyebrow,
  title,
  text,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.018] p-6">
      <div className="flex items-center gap-2.5">
        <Icon size={17} className="text-cyan-300/70" />

        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/60">
          {eyebrow}
        </p>
      </div>

      <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.025em]">
        {title}
      </h3>

      <p className="mt-3.5 text-[13px] leading-6 text-white/30">{text}</p>
    </div>
  );
}

function WorkflowLine({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-[10px] text-white/25">
        {number}
      </span>

      <div>
        <p className="text-[13px] font-medium text-white/60">{title}</p>
        <p className="text-[10px] text-white/20">{text}</p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-2.5 text-[14px] font-medium text-cyan-300/80">
        {value}
      </p>
    </div>
  );
}

function MemoryLifecycle() {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {[
        ["01", "Retain"],
        ["02", "Recall"],
        ["03", "Reason"],
        ["04", "Learn"],
      ].map(([number, title], index) => (
        <div
          key={title}
          className="relative rounded-xl border border-white/[0.06] bg-black/20 p-5"
        >
          <span className="text-[10px] text-white/15">{number}</span>

          <p className="mt-3 text-[14px] font-medium">{title}</p>

          {index < 3 && (
            <ArrowRight
              size={13}
              className="absolute right-[-9px] top-1/2 hidden -translate-y-1/2 text-white/15 sm:block"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PatternCard({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6 transition hover:border-cyan-400/10 hover:bg-cyan-400/[0.015]">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04]">
          <Icon size={18} className="text-cyan-300/70" />
        </div>

        <span className="rounded-md bg-emerald-400/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-wider text-emerald-300/60">
          {status}
        </span>
      </div>

      <h3 className="mt-7 text-[16px] font-medium">{title}</h3>

      <p className="mt-2.5 text-[12px] text-white/30">{description}</p>
    </div>
  );
}

function PatternBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/45">{label}</span>

        <span className="text-[11px] text-white/25">{value}%</span>
      </div>

      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full bg-cyan-300/50"
        />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}
