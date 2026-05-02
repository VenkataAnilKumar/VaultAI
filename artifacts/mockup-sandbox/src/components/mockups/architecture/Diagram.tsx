import { useState } from "react";

type Layer = {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  nodes: Node[];
};

type Node = {
  id: string;
  label: string;
  sub?: string;
  tag?: string;
  tagColor?: string;
};

const LAYERS: Layer[] = [
  {
    id: "frontend",
    label: "Frontend — React + Vite (port 5173)",
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    nodes: [
      { id: "chat", label: "Chat", sub: "Tool use · Sessions · Vision" },
      { id: "docagent", label: "Document Agent", sub: "RAG · Extract · Classify", tag: "Core", tagColor: "#7C3AED" },
      { id: "search", label: "Web Search", sub: "DuckDuckGo · Images" },
      { id: "research", label: "Deep Research", sub: "SSE streaming · Citations" },
      { id: "skills", label: "Skills", sub: "10 built-in · Custom" },
      { id: "settings", label: "Settings", sub: "Theme · Shortcuts · Privacy" },
    ],
  },
  {
    id: "backend",
    label: "Backend — Express / Node.js (port 3001)",
    color: "#0369A1",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    nodes: [
      { id: "chatroute", label: "/api/chat", sub: "Tool use · Multi-agent" },
      { id: "docroute", label: "/api/documents", sub: "Ingest · Query · Transform", tag: "Core", tagColor: "#7C3AED" },
      { id: "searchroute", label: "/api/websearch", sub: "DuckDuckGo HTML parser" },
      { id: "researchroute", label: "/api/research", sub: "Agent pipeline · SSE" },
      { id: "genroute", label: "/api/generate", sub: "Draft · Transform · Extract" },
      { id: "mcproute", label: "/api/mcp", sub: "MCP tools · Connectors" },
    ],
  },
  {
    id: "services",
    label: "Service Layer — Business Logic",
    color: "#065F46",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    nodes: [
      { id: "parser", label: "Parser", sub: "PDF · DOCX · XLSX · Email · OCR", tag: "Core", tagColor: "#7C3AED" },
      { id: "chunker", label: "Chunker", sub: "512 tok · 64 overlap · Section-aware" },
      { id: "embeddings", label: "Embeddings", sub: "nomic-embed-text via Ollama" },
      { id: "vectorstore", label: "Vector Store", sub: "SQLite · Cosine similarity" },
      { id: "webfetcher", label: "Web Fetcher", sub: "Fetch · Strip HTML · Extract" },
      { id: "fileops", label: "File Ops", sub: "fs-extra · Path validation" },
    ],
  },
  {
    id: "ai",
    label: "AI Layer — Ollama (port 11434)",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    nodes: [
      { id: "chat-model", label: "Chat Models", sub: "llama3.2 · mistral · gemma2" },
      { id: "vision-model", label: "Vision Models", sub: "llava · bakllava · minicpm-v" },
      { id: "embed-model", label: "Embedding Model", sub: "nomic-embed-text (768 dims)" },
      { id: "code-model", label: "Code Models", sub: "qwen2.5-coder · deepseek-coder" },
    ],
  },
  {
    id: "storage",
    label: "Storage — Local Only",
    color: "#9D174D",
    bg: "#FFF1F2",
    border: "#FECDD3",
    nodes: [
      { id: "sqlite", label: "SQLite DB", sub: "~/.vault-ai/vault.db" },
      { id: "filesystem", label: "File System", sub: "User docs — never moved" },
      { id: "localstorage", label: "localStorage", sub: "Sessions · Theme · Skills" },
    ],
  },
];

const PRINCIPLES = [
  { icon: "🔒", label: "Local-first", desc: "All AI inference on device" },
  { icon: "🚫", label: "No telemetry", desc: "Zero data sent to cloud" },
  { icon: "📁", label: "File system truth", desc: "Docs live in standard formats" },
  { icon: "⚡", label: "Ollama runtime", desc: "Single consistent AI interface" },
];

const FLOWS = [
  {
    id: "rag",
    label: "RAG — Phase 1 (Naive)",
    color: "#7C3AED",
    steps: ["Upload File", "Parse → Chunk (512 tok)", "Embed Chunks (Ollama)", "Store in SQLite", "User Question", "Embed Question", "Cosine Similarity", "Top-5 Chunks", "Ollama Chat", "Cited Answer"],
  },
  {
    id: "hyde",
    label: "RAG — Phase 2 (HyDE)",
    color: "#B45309",
    steps: ["User Question", "Fast Ollama: write hypothetical answer", "Embed Hypothesis (not question)", "Cosine Similarity — better match", "Top-5 Chunks", "Ollama Chat", "Cited Answer (+30–50% accuracy)"],
  },
  {
    id: "research",
    label: "Deep Research Flow",
    color: "#0369A1",
    steps: ["Research Query", "DuckDuckGo Search", "Fetch Top-5 URLs", "Strip HTML", "Summarize each (Ollama)", "Synthesize Report (Ollama)", "SSE → Frontend", "Markdown + Citations"],
  },
  {
    id: "chat",
    label: "Chat + Tool Use (ReAct)",
    color: "#065F46",
    steps: ["User Message", "Ollama + FILE_TOOLS", "Reason: need file?", "Act: tool_call", "Observe: result", "Reason: can answer?", "Final Answer → UI"],
  },
];

export function Diagram() {
  const [activeTab, setActiveTab] = useState<"layers" | "flows" | "principles">("layers");
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState(FLOWS[0].id);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: "#F5F3FF", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🔒</div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Vault AI — System Architecture</h1>
            <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>Privacy-first · Local AI · No cloud · All via Ollama</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "#E9E5F8", borderRadius: "10px", padding: "4px", width: "fit-content", marginTop: "12px" }}>
          {(["layers", "flows", "principles"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 16px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500,
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#4F46E5" : "#6B7280",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(79,70,229,0.12)" : "none",
              transition: "all 0.15s",
            }}>
              {tab === "layers" ? "Architecture Layers" : tab === "flows" ? "Data Flows" : "Design Principles"}
            </button>
          ))}
        </div>
      </div>

      {/* LAYERS VIEW */}
      {activeTab === "layers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Stack direction arrows */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>User Browser</span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, #C4B5FD, transparent)" }} />
            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>↕ Request / Response</span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, #C4B5FD, transparent)" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Local Machine</span>
          </div>

          {LAYERS.map((layer, i) => (
            <div key={layer.id}>
              {/* Arrow between layers */}
              {i > 0 && (
                <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}>
                  <span style={{ fontSize: "18px", color: "#9CA3AF" }}>↕</span>
                </div>
              )}
              <div
                onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                style={{
                  background: layer.bg,
                  border: `1.5px solid ${layer.border}`,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: expandedLayer === layer.id ? `0 4px 16px ${layer.border}` : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {/* Layer header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expandedLayer === layer.id ? "12px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: layer.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: layer.color }}>{layer.label}</span>
                  </div>
                  <span style={{ fontSize: "16px", color: layer.color, transform: expandedLayer === layer.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </div>

                {/* Nodes — always visible as mini chips */}
                {expandedLayer !== layer.id && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    {layer.nodes.map(node => (
                      <span key={node.id} style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 500,
                        background: "#fff", color: layer.color, border: `1px solid ${layer.border}`
                      }}>
                        {node.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded node detail cards */}
                {expandedLayer === layer.id && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {layer.nodes.map(node => (
                      <div key={node.id} style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        border: `1px solid ${layer.border}`,
                        position: "relative",
                      }}>
                        {node.tag && (
                          <span style={{
                            position: "absolute", top: "8px", right: "8px",
                            padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                            background: "#EDE9FE", color: node.tagColor || layer.color, letterSpacing: "0.04em"
                          }}>
                            {node.tag}
                          </span>
                        )}
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{node.label}</div>
                        {node.sub && <div style={{ fontSize: "11px", color: "#6B7280", lineHeight: 1.5 }}>{node.sub}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* External section */}
          <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}>
            <span style={{ fontSize: "18px", color: "#9CA3AF" }}>↑</span>
          </div>
          <div style={{
            background: "#F9FAFB", border: "1.5px dashed #D1D5DB", borderRadius: "12px",
            padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "#9CA3AF" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>External (User-initiated only)</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["DuckDuckGo Web Search", "DuckDuckGo Image Search", "Target Websites (Research)"].map(s => (
                <span key={s} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", background: "#fff", color: "#9CA3AF", border: "1px solid #E5E7EB" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOWS VIEW */}
      {activeTab === "flows" && (
        <div>
          {/* Flow selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {FLOWS.map(flow => (
              <button key={flow.id} onClick={() => setActiveFlow(flow.id)} style={{
                padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "12.5px", fontWeight: 500,
                background: activeFlow === flow.id ? flow.color : "#fff",
                color: activeFlow === flow.id ? "#fff" : "#374151",
                border: `1.5px solid ${activeFlow === flow.id ? flow.color : "#E5E7EB"}`,
                transition: "all 0.15s",
              }}>
                {flow.label}
              </button>
            ))}
          </div>

          {FLOWS.filter(f => f.id === activeFlow).map(flow => (
            <div key={flow.id} style={{ background: "#fff", borderRadius: "14px", padding: "24px", border: "1.5px solid #E9E5F8" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: flow.color, marginBottom: "24px", margin: "0 0 24px" }}>{flow.label}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0" }}>
                {flow.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                      background: i === 0 ? flow.color : i === flow.steps.length - 1 ? flow.color : "#F5F3FF",
                      color: i === 0 || i === flow.steps.length - 1 ? "#fff" : flow.color,
                      border: `2px solid ${i === 0 || i === flow.steps.length - 1 ? flow.color : "#C4B5FD"}`,
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: i === 0 || i === flow.steps.length - 1 ? 700 : 500,
                      whiteSpace: "nowrap",
                      position: "relative",
                    }}>
                      <div style={{
                        position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)",
                        background: flow.color, color: "#fff", borderRadius: "10px",
                        fontSize: "9px", fontWeight: 700, padding: "0px 5px",
                        minWidth: "16px", textAlign: "center"
                      }}>
                        {i + 1}
                      </div>
                      {step}
                    </div>
                    {i < flow.steps.length - 1 && (
                      <div style={{ color: flow.color, fontSize: "18px", margin: "0 4px", opacity: 0.6 }}>→</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Flow description */}
              <div style={{ marginTop: "24px", padding: "14px", background: "#F5F3FF", borderRadius: "8px", fontSize: "12px", color: "#4B5563", lineHeight: 1.6 }}>
                {flow.id === "rag" && (
                  <><strong style={{ color: flow.color }}>Phase 1 — Naive RAG:</strong> Documents are parsed, split into 512-token chunks with 64-token overlap, then embedded via <code>nomic-embed-text</code>. At query time, the question is embedded directly and compared with all chunks using cosine similarity. Top-5 chunks form the context for Ollama's answer with citations. Simple, fast, works well for direct questions.</>
                )}
                {flow.id === "hyde" && (
                  <><strong style={{ color: flow.color }}>Phase 2 — HyDE (Hypothetical Document Embeddings):</strong> Instead of embedding the question, a fast Ollama model first writes a short hypothetical answer (~100 words). That hypothesis — written in document style — is then embedded. Since it lives in the same semantic space as real document chunks, cosine similarity finds far better matches. Improves retrieval accuracy <strong>30–50%</strong> for indirect questions. One extra Ollama call; no changes to the vector store. (Gao et al., 2022)</>
                )}
                {flow.id === "research" && (
                  <><strong style={{ color: flow.color }}>Research Agent:</strong> Searches DuckDuckGo server-side (avoiding CORS), fetches top N pages, strips HTML, summarizes each source with a fast Ollama model, then synthesizes a final Markdown report with citations using the main model. All steps stream via SSE — the UI shows live step-by-step progress.</>
                )}
                {flow.id === "chat" && (
                  <><strong style={{ color: flow.color }}>ReAct Loop (Reason + Act):</strong> The same pattern used by Codex Agent and Claude. The user's message is sent to Ollama with FILE_TOOLS. Ollama reasons, optionally calls a tool (list directory, read file, write file), observes the result, and loops until it can answer — or reaches the 10-call cap. Destructive tool calls pause the loop and require user confirmation.</>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINCIPLES VIEW */}
      {activeTab === "principles" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {PRINCIPLES.map((p, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1.5px solid #E9E5F8", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ fontSize: "28px" }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>#{i + 1} {p.label}</div>
                  <div style={{ fontSize: "12.5px", color: "#6B7280" }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy table */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1.5px solid #E9E5F8" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "16px", margin: "0 0 16px" }}>Data Isolation — What Leaves Your Machine?</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#6B7280", fontWeight: 600 }}>Data Type</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#6B7280", fontWeight: 600 }}>Where It Lives</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#6B7280", fontWeight: 600 }}>Leaves Machine?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Documents", "User's file system", "Never"],
                  ["Embeddings", "~/.vault-ai/vault.db", "Never"],
                  ["Chat history", "~/.vault-ai/vault.db", "Never"],
                  ["AI inference", "Ollama (local port 11434)", "Never"],
                  ["Web search queries", "DuckDuckGo (user-initiated)", "Yes — no account/tracking"],
                  ["Research page fetches", "Target websites (user-initiated)", "Yes — request headers only"],
                ].map(([type, where, leaves], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F9FAFB", background: i % 2 === 0 ? "transparent" : "#FAFAFA" }}>
                    <td style={{ padding: "10px 12px", color: "#111827", fontWeight: 500 }}>{type}</td>
                    <td style={{ padding: "10px 12px", color: "#4B5563", fontFamily: "monospace", fontSize: "11.5px" }}>{where}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                        background: leaves === "Never" ? "#ECFDF5" : "#FFF7ED",
                        color: leaves === "Never" ? "#065F46" : "#92400E",
                      }}>
                        {leaves}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tech stack */}
          <div style={{ marginTop: "12px", background: "#fff", borderRadius: "12px", padding: "20px", border: "1.5px solid #E9E5F8" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "16px", margin: "0 0 16px" }}>Confirmed Tech Stack</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                ["AI Runtime", "Ollama", "Local inference, all model types"],
                ["Embedding Model", "nomic-embed-text", "768 dims, fits 2GB RAM"],
                ["Vector Store", "SQLite (custom)", "No external service needed"],
                ["Database", "better-sqlite3", "Sync API, zero config"],
                ["Frontend", "React + Vite", "Fast HMR, great DX"],
                ["State", "Zustand", "Minimal boilerplate + persist"],
                ["Web Search", "DuckDuckGo HTML", "No API key, privacy-aligned"],
                ["Styling", "Tailwind + CSS vars", "Utility + design tokens"],
                ["File Parsing", "pdf-parse + mammoth", "PDF and DOCX parsing"],
              ].map(([label, tech, desc]) => (
                <div key={label} style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#4F46E5", marginBottom: "3px" }}>{tech}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
