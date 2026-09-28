import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const HINDSIGHT_URL =
  process.env.HINDSIGHT_API_URL || "http://localhost:8888";

const BANK_ID = process.env.HINDSIGHT_BANK_ID || "memoryos";

type HindsightMemory = {
  id?: string;
  text?: string;
  type?: string;
  context?: string;
  occurred_start?: string;
  occurred_end?: string;
  mentioned_at?: string;
  document_id?: string;
  metadata?: unknown;
  tags?: string[];
  [key: string]: unknown;
};

type StructuredAnalysis = {
  rootCause: string;
  evidence: string[];
  immediateActions: string[];
  memoryMatch: string;
  confidence: "Low" | "Medium" | "High";
  lessonForFuture: string[];
};

function extractMemories(data: unknown): HindsightMemory[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as Record<string, unknown>;

  if (Array.isArray(response.results)) {
    return response.results as HindsightMemory[];
  }

  if (
    response.results &&
    typeof response.results === "object" &&
    Array.isArray(
      (response.results as Record<string, unknown>).results
    )
  ) {
    return (
      (response.results as Record<string, unknown>)
        .results as HindsightMemory[]
    );
  }

  if (Array.isArray(response.memories)) {
    return response.memories as HindsightMemory[];
  }

  return [];
}

function formatMemoriesForPrompt(memories: HindsightMemory[]) {
  if (memories.length === 0) {
    return "No previous incidents were retrieved from Hindsight.";
  }

  return memories
    .map((memory, index) => {
      return `
PREVIOUS INCIDENT ${index + 1}

Memory:
${memory.text || "No memory text available."}

Type:
${memory.type || "Unknown"}

Context:
${memory.context || "Unknown"}

Occurred:
${memory.occurred_start || memory.mentioned_at || "Unknown"}

Document ID:
${memory.document_id || "Unknown"}
`;
    })
    .join("\n");
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeAnalysis(
  parsed: Partial<StructuredAnalysis>
): StructuredAnalysis {
  const confidence =
    parsed.confidence === "Low" ||
    parsed.confidence === "Medium" ||
    parsed.confidence === "High"
      ? parsed.confidence
      : "Medium";

  return {
    rootCause:
      typeof parsed.rootCause === "string" && parsed.rootCause.trim()
        ? parsed.rootCause.trim()
        : "Unable to determine a reliable root cause from the available evidence.",

    evidence: normalizeStringArray(parsed.evidence),

    immediateActions: normalizeStringArray(
      parsed.immediateActions
    ),

    memoryMatch:
      typeof parsed.memoryMatch === "string" &&
      parsed.memoryMatch.trim()
        ? parsed.memoryMatch.trim()
        : "No strong previous match identified.",

    confidence,

    lessonForFuture: normalizeStringArray(
      parsed.lessonForFuture
    ),
  };
}

function buildCleanAnalysis(analysis: StructuredAnalysis) {
  const evidence =
    analysis.evidence.length > 0
      ? analysis.evidence.map((item) => `- ${item}`).join("\n")
      : "- No additional evidence provided.";

  const actions =
    analysis.immediateActions.length > 0
      ? analysis.immediateActions
          .map((item, index) => `${index + 1}. ${item}`)
          .join("\n")
      : "1. Continue investigation using available service and database telemetry.";

  const lessons =
    analysis.lessonForFuture.length > 0
      ? analysis.lessonForFuture
          .map((item) => `- ${item}`)
          .join("\n")
      : "- Capture the root cause and resolution so similar incidents can be handled faster.";

  return `1. ROOT CAUSE

${analysis.rootCause}

2. EVIDENCE

${evidence}

3. IMMEDIATE ACTIONS

${actions}

4. MEMORY MATCH

${analysis.memoryMatch}

5. CONFIDENCE

${analysis.confidence}

6. LESSON FOR FUTURE

${lessons}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      service,
      symptoms,
      logs,
    }: {
      title?: string;
      service?: string;
      symptoms?: string;
      logs?: string;
    } = body;

    if (!title || !service || !symptoms) {
      return NextResponse.json(
        {
          success: false,
          error: "title, service, and symptoms are required",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. RECALL PREVIOUS INCIDENTS FROM HINDSIGHT
    // ============================================================

    let memories: HindsightMemory[] = [];
    let hindsightRecallError: string | null = null;

    try {
      const recallResponse = await fetch(
        `${HINDSIGHT_URL}/v1/default/banks/${BANK_ID}/memories/recall`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
Service: ${service}

Incident: ${title}

Symptoms:
${symptoms}

Logs:
${logs || "No logs provided."}

Find previous production incidents that are similar to this incident,
especially incidents involving the same service, symptoms, root cause,
database connection problems, latency, timeouts, or 503 errors.
`,
            types: ["experience", "observation"],
            budget: "mid",
            max_tokens: 3000,
          }),
        }
      );

      const recallText = await recallResponse.text();

      if (recallResponse.ok) {
        const recallData = recallText
          ? JSON.parse(recallText)
          : {};

        memories = extractMemories(recallData);
      } else {
        hindsightRecallError =
          `Hindsight recall failed (${recallResponse.status}): ${recallText}`;
      }
    } catch (error) {
      hindsightRecallError =
        error instanceof Error
          ? error.message
          : "Unknown Hindsight recall error";
    }

    // ============================================================
    // 2. BUILD MEMORY CONTEXT
    // ============================================================

    const memoryContext = formatMemoriesForPrompt(memories);

    // ============================================================
    // 3. ANALYZE INCIDENT WITH GROQ
    // ============================================================

    const prompt = `
You are MemoryOS, an expert AI production incident-response copilot.

Analyze the current production incident using:

1. The current incident.
2. Previous incidents retrieved from Hindsight.

The most important capability is MEMORY.

When previous incidents are relevant:
- Identify the relevant previous incident.
- Explain why it matches.
- Use its root cause or resolution as supporting evidence.
- Explain what MemoryOS learned from it.

Do not invent incidents, logs, metrics, or facts.

============================================================
CURRENT INCIDENT
============================================================

Title:
${title}

Service:
${service}

Symptoms:
${symptoms}

Logs:
${logs || "No logs provided."}

============================================================
PREVIOUS INCIDENTS FROM HINDSIGHT
============================================================

${memoryContext}

============================================================
RESPONSE REQUIREMENTS
============================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "rootCause": "string",
  "evidence": [
    "string",
    "string",
    "string"
  ],
  "immediateActions": [
    "string",
    "string",
    "string"
  ],
  "memoryMatch": "string",
  "confidence": "Low | Medium | High",
  "lessonForFuture": [
    "string",
    "string"
  ]
}

Rules:

- rootCause must contain the most likely root cause.
- evidence must contain concrete evidence from the current incident.
- If Hindsight memories are relevant, include their evidence in the evidence array.
- immediateActions must contain 3-5 practical engineering actions.
- memoryMatch must clearly say Strong match, Partial match, or No strong previous match.
- If there is a match, identify which previous incident or incidents are relevant.
- confidence must be exactly Low, Medium, or High.
- lessonForFuture must contain practical lessons that should be remembered for future incidents.
- Keep responses concise and technical.
`;

    let structuredAnalysis: StructuredAnalysis;

    try {
      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",
            content:
              "You are an expert production incident-response engineer. Return only valid JSON when requested. Never invent facts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.2,

        response_format: {
          type: "json_object",
        },
      });

      const rawAnalysis =
        completion.choices[0]?.message?.content || "{}";

      try {
        const parsed = JSON.parse(rawAnalysis);
        structuredAnalysis = normalizeAnalysis(parsed);
      } catch {
        // Safe fallback if the provider returns malformed JSON.
        structuredAnalysis = normalizeAnalysis({
          rootCause: rawAnalysis,
          evidence: [],
          immediateActions: [],
          memoryMatch:
            memories.length > 0
              ? "Previous Hindsight memories were retrieved."
              : "No strong previous match identified.",
          confidence: "Medium",
          lessonForFuture: [],
        });
      }
    } catch (error) {
      console.error("Groq analysis error:", error);

      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate incident analysis",
        },
        { status: 500 }
      );
    }

    const analysis = buildCleanAnalysis(structuredAnalysis);

    // ============================================================
    // 4. RETAIN CURRENT INCIDENT IN HINDSIGHT
    // ============================================================

    let hindsightStored = false;
    let hindsightRetainError: string | null = null;

    try {
      const incidentDocument = `
MemoryOS Production Incident

Incident: ${title}

Service: ${service}

Symptoms:
${symptoms}

Root Cause:
${structuredAnalysis.rootCause}

Evidence:
${structuredAnalysis.evidence.join("\n")}

Immediate Actions:
${structuredAnalysis.immediateActions.join("\n")}

Memory Match:
${structuredAnalysis.memoryMatch}

Confidence:
${structuredAnalysis.confidence}

Lessons Learned:
${structuredAnalysis.lessonForFuture.join("\n")}
`;

      const retainResponse = await fetch(
        `${HINDSIGHT_URL}/v1/default/banks/${BANK_ID}/memories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                content: incidentDocument,
                context: "production incident response",
                document_id: `incident-${Date.now()}`,
                tags: [
                  "memoryos",
                  "incident",
                  service,
                ],
                metadata: {
                  source: "memoryos",
                  type: "incident",
                  service,
                  title,
                },
              },
            ],
            async: false,
          }),
        }
      );

      const retainText = await retainResponse.text();

      if (retainResponse.ok) {
        hindsightStored = true;
      } else {
        hindsightRetainError =
          `Hindsight retain failed (${retainResponse.status}): ${retainText}`;
      }
    } catch (error) {
      hindsightRetainError =
        error instanceof Error
          ? error.message
          : "Unknown Hindsight retain error";
    }

    // ============================================================
    // 5. RETURN MEMORYOS RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      incident: {
        title,
        service,
        symptoms,
        logs: logs || "",
      },

      analysis,

      // Structured data is also returned for future UI improvements.
      structuredAnalysis,

      memories,

      memoryCount: memories.length,

      hindsight: {
        recalled: memories.length > 0,
        stored: hindsightStored,
        recallError: hindsightRecallError,
        retainError: hindsightRetainError,
      },
    });
  } catch (error) {
    console.error("MemoryOS incident error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze incident",
      },
      { status: 500 }
    );
  }
}