// ── Vault AI · Demo Mode Data ──────────────────────────────────
// Pre-written, realistic AI responses so judges can see every
// feature working without a local Ollama install.

const SAMPLE_DOCS = [
  {
    filePath: '/demo/NDA-Agreement-2024.pdf',
    fileName: 'NDA-Agreement-2024.pdf',
    chunkCount: 12, indexedAt: new Date(Date.now() - 86400000).toISOString(), ext: 'pdf'
  },
  {
    filePath: '/demo/Q4-Financial-Report.xlsx',
    fileName: 'Q4-Financial-Report.xlsx',
    chunkCount: 8, indexedAt: new Date(Date.now() - 172800000).toISOString(), ext: 'xlsx'
  },
  {
    filePath: '/demo/Product-Roadmap.docx',
    fileName: 'Product-Roadmap.docx',
    chunkCount: 15, indexedAt: new Date(Date.now() - 259200000).toISOString(), ext: 'docx'
  }
];

const DEMO_MODEL = 'llama3.2 (demo)';

const DEMO_SOURCES = [
  { filePath: '/demo/NDA-Agreement-2024.pdf', excerpt: 'This Non-Disclosure Agreement ("Agreement") is entered into as of January 15, 2024, between Acme Corp ("Disclosing Party") and Beta Solutions Ltd ("Receiving Party"). The Receiving Party agrees to keep all Confidential Information strictly confidential for a period of five (5) years.', score: 0.94 },
  { filePath: '/demo/NDA-Agreement-2024.pdf', excerpt: 'Confidential Information shall include all technical data, trade secrets, know-how, research, product plans, services, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration, marketing, finances or other business information.', score: 0.87 }
];

const RESPONSES = {
  'models/status': { connected: true, baseUrl: 'http://localhost:11434' },
  'models': { models: [{ name: 'llama3.2', size: '2.0GB', modified_at: new Date().toISOString() }, { name: 'nomic-embed-text', size: '274MB', modified_at: new Date().toISOString() }] },
  'documents/list': { documents: SAMPLE_DOCS },

  'documents/ingest': (data) => ({
    success: true,
    filePath: data?.filePath || '/demo/document.pdf',
    fileName: (data?.filePath || '/demo/document.pdf').split('/').pop(),
    chunks: 10, wordCount: 1240, type: 'pdf'
  }),

  'documents/query': (data) => ({
    answer: `Based on the document [1], the NDA agreement establishes a 5-year confidentiality period starting January 15, 2024. The Receiving Party (Beta Solutions Ltd) must keep all technical data, trade secrets, and business information strictly confidential [1]. Violations of this agreement may result in legal action and the Disclosing Party (Acme Corp) is entitled to seek injunctive relief [2].`,
    sources: DEMO_SOURCES,
    model: DEMO_MODEL
  }),

  'documents/summarize/tldr': () => ({
    summary: `This is a comprehensive Non-Disclosure Agreement between Acme Corp and Beta Solutions Ltd, effective January 2024. The agreement establishes a 5-year confidentiality obligation covering all technical data, trade secrets, and business information. Key terms include mandatory return of materials upon termination and jurisdiction in Delaware courts.`,
    type: 'tldr', model: DEMO_MODEL
  }),

  'documents/summarize/keypoints': () => ({
    summary: `• **Parties**: Acme Corp (Disclosing) and Beta Solutions Ltd (Receiving)\n• **Duration**: 5-year confidentiality obligation from January 15, 2024\n• **Scope**: All technical data, trade secrets, customer lists, financial information, and proprietary software\n• **Obligations**: Receiving party must restrict access to need-to-know personnel only\n• **Exclusions**: Public information, independently developed materials, and court-ordered disclosures\n• **Remedies**: Disclosing party entitled to injunctive relief for breaches\n• **Jurisdiction**: State of Delaware, binding arbitration for disputes`,
    type: 'keypoints', model: DEMO_MODEL
  }),

  'documents/summarize/full': () => ({
    summary: `## Executive Summary\nThis Non-Disclosure Agreement (NDA) governs the confidential exchange of information between Acme Corp and Beta Solutions Ltd for a proposed technology partnership.\n\n## Key Findings\nThe agreement imposes strict 5-year confidentiality obligations with comprehensive scope covering technical, financial, and operational data. The Receiving Party faces significant restrictions on disclosure, use, and reproduction of confidential materials.\n\n## Important Details\n- **Effective Date**: January 15, 2024\n- **Confidential Information**: Broadly defined to include all non-public business information\n- **Permitted Disclosures**: Limited to employees/advisors with signed confidentiality agreements\n- **Termination**: Either party may terminate with 30 days written notice; obligations survive for 5 years\n\n## Conclusions / Next Steps\nThis is a standard but comprehensive NDA. Legal review recommended before signing. Consider negotiating the 5-year term and clarifying the definition of "trade secrets" to avoid overly broad interpretation.`,
    type: 'full', model: DEMO_MODEL
  }),

  'documents/extract': () => ({
    extracted: {
      parties: ['Acme Corp', 'Beta Solutions Ltd'],
      dates: ['January 15, 2024', '5 years from execution'],
      monetary_amounts: [],
      key_decisions: ['5-year confidentiality period', 'Delaware jurisdiction', 'Mandatory arbitration'],
      action_items: ['Both parties must sign', 'Legal counsel review recommended', 'Designate confidentiality officers'],
      obligations: ['Return all materials upon termination', 'Restrict access to need-to-know basis', 'Notify of unauthorized disclosure within 48 hours']
    },
    model: DEMO_MODEL
  }),

  'documents/classify': () => ({
    classification: {
      type: 'contract',
      tags: ['nda', 'legal', 'confidentiality', '2024', 'corporate'],
      sensitivity: 'confidential',
      confidence: 0.97,
      reason: 'This is a formal legal NDA agreement between two corporations containing sensitive business terms and confidential obligations.'
    },
    model: DEMO_MODEL
  }),

  'documents/pii': () => ({
    filePath: '/demo/NDA-Agreement-2024.pdf',
    fileName: 'NDA-Agreement-2024.pdf',
    riskLevel: 'medium',
    totalFindings: 9,
    regexFindings: {
      emails: { label: 'Email Addresses', matches: ['legal@acmecorp.com', 'contracts@betasolutions.com'], count: 2 },
      phones: { label: 'Phone Numbers', matches: ['+1 (555) 234-5678', '+1 (415) 987-6543'], count: 2 },
      dates:  { label: 'Dates', matches: ['January 15, 2024', 'December 31, 2028'], count: 2 }
    },
    aiFindings: [
      { type: 'Full Name', value: 'Jonathan P. Richardson (CEO, Acme Corp)', risk: 'medium' },
      { type: 'Full Name', value: 'Sarah K. Nakamura (CTO, Beta Solutions)', risk: 'medium' },
      { type: 'Address', value: '1 Market Street, Suite 200, San Francisco, CA 94105', risk: 'high' }
    ],
    model: DEMO_MODEL
  }),

  'documents/multi-query': (data) => ({
    answer: `Across all three documents, the key financial obligations include: **NDA Agreement** [1] — no direct financial terms but establishes liability framework; **Q4 Financial Report** [2] — Q4 revenue reached $4.2M (+18% YoY), with net margin of 22%; **Product Roadmap** [3] — planned investment of $800K in AI infrastructure for H1 2025. The combined picture shows a company in strong financial health, actively investing in growth with solid legal protections in place.`,
    sources: [
      { filePath: '/demo/NDA-Agreement-2024.pdf', excerpt: 'Indemnification clause: each party shall bear their own costs...', score: 0.78 },
      { filePath: '/demo/Q4-Financial-Report.xlsx', excerpt: 'Q4 Net Revenue: $4,248,000 | Operating Margin: 22.3% | YoY Growth: 18.2%', score: 0.92 },
      { filePath: '/demo/Product-Roadmap.docx', excerpt: 'H1 2025 AI Infrastructure Budget: $800,000 — includes local LLM deployment and vector database scaling', score: 0.85 }
    ],
    documentsSearched: 3,
    documentsReferenced: ['NDA-Agreement-2024.pdf', 'Q4-Financial-Report.xlsx', 'Product-Roadmap.docx'],
    model: DEMO_MODEL
  }),

  'documents/organize': () => ({
    suggestions: {
      'Legal & Compliance': ['NDA-Agreement-2024.pdf'],
      'Finance & Reporting': ['Q4-Financial-Report.xlsx'],
      'Strategy & Planning': ['Product-Roadmap.docx']
    },
    model: DEMO_MODEL,
    fileCount: 3
  }),

  'documents/index-directory': () => ({
    success: true, indexed: 3, failed: 0, total: 3,
    files: ['NDA-Agreement-2024.pdf', 'Q4-Financial-Report.xlsx', 'Product-Roadmap.docx']
  }),

  'research/deep': (data) => ({
    question: data?.question || 'Research question',
    subQuestions: [
      `What are the key aspects of "${data?.question || 'this topic'}"?`,
      `What are the latest developments and research findings?`,
      `What are the practical implications and use cases?`
    ],
    searchResults: [
      { question: `Key aspects of "${data?.question || 'this topic'}"`, results: [{ title: 'Wikipedia Overview', url: 'https://en.wikipedia.org', snippet: 'Comprehensive overview of the topic including history, methodology, and key stakeholders.' }, { title: 'Research Paper', url: 'https://arxiv.org', snippet: 'Latest academic research with quantitative analysis and experimental results.' }] },
      { question: 'Latest developments', results: [{ title: 'Industry Report 2024', url: 'https://techcrunch.com', snippet: 'Recent developments show significant advancement in practical applications and adoption rates.' }] }
    ],
    report: `## Overview\nThis research examines "${data?.question || 'the topic'}" across multiple dimensions, drawing from academic literature, industry reports, and recent developments.\n\n## Key Findings\n- The field has seen accelerating growth over the past 2 years, with adoption rates increasing by 340% since 2022\n- Academic consensus supports a multi-disciplinary approach combining technical and human factors\n- Industry leaders are investing heavily in scalable, privacy-preserving implementations\n- Regulatory frameworks are evolving rapidly, particularly in the EU and US markets\n\n## Analysis\nThe evidence suggests this topic sits at a critical inflection point. Early adopters are seeing significant competitive advantages, while laggards face increasing pressure to adapt. The technology stack is maturing rapidly, lowering barriers to entry.\n\nKey success factors identified across case studies:\n1. Strong data governance and privacy practices\n2. Human-in-the-loop validation processes\n3. Iterative deployment with continuous monitoring\n\n## Conclusion\nBased on the available evidence, investment in this area represents a high-value strategic opportunity. Organizations should prioritize building internal capability while maintaining flexibility to adapt as best practices evolve.`,
    model: DEMO_MODEL
  }),

  'research/summarize-url': (data) => ({
    url: data?.url || '',
    summary: `• The article discusses key developments in the field with emphasis on practical applications\n• Three major trends are identified: increased automation, privacy-first design, and edge computing adoption\n• Industry experts predict 40% cost reduction in operational overhead within 2 years\n• Recommended action items include piloting new tools in sandboxed environments before production rollout`,
    model: DEMO_MODEL
  }),

  'generate/document': (data) => ({
    content: `# ${data?.title || 'Generated Document'}\n\n*Generated by Vault AI — ${new Date().toLocaleDateString()}*\n\n## Overview\n\nThis document was automatically generated based on your specifications. The content below represents a structured analysis relevant to your request.\n\n## Key Sections\n\n### Introduction\nThis analysis covers the primary aspects of the requested topic, drawing from available data and best practices in the field.\n\n### Findings\n- Primary recommendation: Implement a phased approach with quarterly milestones\n- Risk level: Medium, mitigated by proposed controls\n- Expected outcomes: 25-30% efficiency improvement within 6 months\n\n### Conclusion\nThe proposed approach aligns with organizational goals and industry standards. Immediate next steps are recommended to capitalize on current market conditions.`,
    model: DEMO_MODEL
  }),

  'chat': (data) => {
    const msg = (data?.message || '').toLowerCase();

    if (msg.includes('file') || msg.includes('list') || msg.includes('folder') || msg.includes('director')) {
      return {
        response: `I found **12 files** in your home directory:\n\n📁 Documents/\n  ├── 📄 NDA-Agreement-2024.pdf (245 KB)\n  ├── 📊 Q4-Financial-Report.xlsx (1.2 MB)\n  └── 📝 Product-Roadmap.docx (88 KB)\n\n📁 Projects/\n  ├── 📁 vault-ai/\n  └── 📁 research-notes/\n\n📄 README.md (4 KB)\n📄 config.yaml (2 KB)\n\n*Showing top-level items. Ask me to explore any folder in detail.*`,
        model: DEMO_MODEL, toolsUsed: ['list_files']
      };
    }
    if (msg.includes('search') || msg.includes('find') || msg.includes('pdf')) {
      return {
        response: `I searched your filesystem and found **3 PDF files**:\n\n1. \`~/Documents/NDA-Agreement-2024.pdf\` — 245 KB, modified 2 days ago\n2. \`~/Downloads/invoice-march.pdf\` — 89 KB, modified 1 week ago\n3. \`~/Desktop/presentation-draft.pdf\` — 2.1 MB, modified yesterday\n\nWant me to ingest any of these into the Document Agent for Q&A and summarization?`,
        model: DEMO_MODEL, toolsUsed: ['search_files']
      };
    }
    if (msg.includes('create') || msg.includes('mkdir') || msg.includes('make')) {
      return {
        response: `✅ I've created the folder **Projects** in your home directory.\n\nThe directory is ready at \`~/Projects\`. Would you like me to:\n- Move any existing files into it?\n- Create subdirectories (e.g., Projects/active, Projects/archive)?\n- Set up a README?`,
        model: DEMO_MODEL, toolsUsed: ['create_directory']
      };
    }
    if (msg.includes('summar') || msg.includes('brief') || msg.includes('tldr')) {
      return {
        response: `Here's a **TL;DR** of your documents:\n\n**NDA-Agreement-2024.pdf**: A 5-year confidentiality agreement between Acme Corp and Beta Solutions Ltd, covering trade secrets and technical data. High sensitivity.\n\n**Q4-Financial-Report.xlsx**: Q4 revenue hit $4.2M (+18% YoY) with 22% net margins. Strong cash position, recommends increased R&D investment for 2025.\n\n**Product-Roadmap.docx**: 18-month roadmap prioritizing AI integration, mobile expansion, and enterprise tier launch. Key milestone: public beta in Q2 2025.`,
        model: DEMO_MODEL, toolsUsed: ['read_file', 'summarize']
      };
    }
    if (msg.includes('privacy') || msg.includes('pii') || msg.includes('sensitive')) {
      return {
        response: `🔍 **Privacy Audit Complete** — Scanned 3 documents:\n\n⚠️ **Medium Risk** — NDA-Agreement-2024.pdf\n  - 2 email addresses found\n  - 2 phone numbers found\n  - 3 full names (executives)\n  - 1 physical address\n\n✅ **Clean** — Q4-Financial-Report.xlsx\n  - No PII detected beyond company names\n\n✅ **Clean** — Product-Roadmap.docx\n  - No sensitive personal data found\n\n*Recommend redacting executive contact details before sharing the NDA externally.*`,
        model: DEMO_MODEL, toolsUsed: ['scan_pii']
      };
    }
    return {
      response: `I understand you'd like help with: *"${data?.message}"*\n\nAs your local AI assistant, I can help you:\n- **Navigate & search** your files with natural language\n- **Analyze documents** — Q&A, summarization, extraction, PII scanning\n- **Research topics** on the web privately via DuckDuckGo\n- **Generate content** — reports, drafts, transformed documents\n- **Organize** your file library with AI-suggested structures\n\nAll processing happens **100% locally** on your machine. No data is ever sent to the cloud.\n\nWhat would you like to do first?`,
      model: DEMO_MODEL, toolsUsed: []
    };
  },

  'agents/run': (data) => ({
    success: true,
    result: 'Agent workflow completed successfully in demo mode.',
    model: DEMO_MODEL
  })
};

export function getDemoResponse(method, url, bodyData) {
  const path = url.replace(/^\/api\//, '').replace(/^\//, '');
  let data = bodyData;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = {}; }
  }

  // Exact match
  if (typeof RESPONSES[path] === 'function') return RESPONSES[path](data);
  if (RESPONSES[path] !== undefined) return RESPONSES[path];

  // Prefix match
  if (path.startsWith('models/status')) return RESPONSES['models/status'];
  if (path.startsWith('models'))        return RESPONSES['models'];
  if (path === 'documents' && method?.toLowerCase() === 'get') return RESPONSES['documents/list'];
  if (path === 'documents' && method?.toLowerCase() === 'delete') return { success: true };
  if (path.startsWith('documents/ingest'))       return RESPONSES['documents/ingest'](data);
  if (path.startsWith('documents/query'))        return RESPONSES['documents/query'](data);
  if (path.startsWith('documents/summarize')) {
    const type = data?.type || 'tldr';
    const key = `documents/summarize/${type}`;
    return RESPONSES[key] ? RESPONSES[key]() : RESPONSES['documents/summarize/tldr']();
  }
  if (path.startsWith('documents/extract'))      return RESPONSES['documents/extract']();
  if (path.startsWith('documents/classify'))     return RESPONSES['documents/classify']();
  if (path.startsWith('documents/pii'))          return RESPONSES['documents/pii']();
  if (path.startsWith('documents/multi-query'))  return RESPONSES['documents/multi-query'](data);
  if (path.startsWith('documents/organize'))     return RESPONSES['documents/organize']();
  if (path.startsWith('documents/index-directory')) return RESPONSES['documents/index-directory']();
  if (path.startsWith('research/deep'))          return RESPONSES['research/deep'](data);
  if (path.startsWith('research/summarize-url')) return RESPONSES['research/summarize-url'](data);
  if (path.startsWith('generate/document'))      return RESPONSES['generate/document'](data);
  if (path.startsWith('agents'))                 return RESPONSES['agents/run'](data);
  if (path.startsWith('skills'))                 return { skills: [] };
  if (path.startsWith('chat'))                   return RESPONSES['chat'](data);

  // Fallback
  return { success: true, demo: true };
}

export const DEMO_SAMPLE_DOCS = SAMPLE_DOCS;
