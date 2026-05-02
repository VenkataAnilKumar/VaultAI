# Vault AI — Gen AI Addon Prompt

Use this prompt to add Gen AI capabilities to an existing Vault AI build.
Paste into Replit Agent after the base app is running.

---

```
Extend the existing Vault AI application with full Generative AI 
capabilities. The base app already handles file operations and document 
Q&A. Add the following generative features:

---

## NEW BACKEND SERVICE: src/webapp/server/services/genAI.js

Create a GenAIService class with these methods. All methods accept 
ollamaClient and modelRouter as dependencies.

METHOD: generateDocument(prompt, contextFiles[], outputPath, ollama, router)
  1. model = await router.selectModel('generate')
  2. Read each contextFile via docReader.extractText()
  3. Truncate each to first 2000 chars to fit context window
  4. Build messages:
     system: "You are a professional document writer. Output clean Markdown. 
              No preamble — just the document content."
     user: "[Context files content]\n\nInstruction: {prompt}"
  5. response = await ollama.chat(model, messages)
  6. await fs.outputFile(outputPath, response.message.content)
  7. Return { success, outputPath, wordCount, model }

METHOD: transformDocument(inputPath, instruction, outputPath, ollama, router)
  1. model = await router.selectModel('transform')
  2. source = await docReader.extractText(inputPath)
  3. Build messages:
     system: "Transform the document per the instruction. Output only 
              the transformed content — no commentary."
     user: "Document:\n{source.text}\n\nInstruction: {instruction}"
  4. Execute and save to outputPath (or inputPath + '_transformed' if null)
  5. Return { success, outputPath, originalWordCount, newWordCount, model }

METHOD: synthesizeDocuments(inputPaths[], instruction, outputPath, ollama, router)
  1. model = await router.selectModel('synthesize')
  2. Read all files, truncate each to 1500 chars
  3. Build combined context with === filename === headers
  4. messages:
     system: "Synthesize multiple documents. Cite sources as (Source: filename)"
     user: "{combined}\n\nTask: {instruction}"
  5. Save if outputPath provided
  6. Return { success, content, outputPath, sourceFiles, model }

METHOD: extractStructuredData(inputPath, goal, outputPath, ollama, router)
  1. model = await router.selectModel('extract')
  2. source = await docReader.extractText(inputPath)
  3. messages:
     system: "Extract structured data. Return ONLY valid JSON array. 
              Include source_location field for each record."
     user: "Document:\n{source.text}\n\nExtract: {goal}"
  4. Parse JSON response (wrap in try/catch)
  5. If outputPath ends in .csv: convert to CSV and save
  6. If outputPath ends in .json: save as JSON
  7. Return { success, data, recordCount, outputPath, model }

METHOD: autoRenameFile(filePath, ollama, router)
  1. model = await router.selectModel('file_op')
  2. Read first 800 chars of file content
  3. ext = path.extname(filePath)
  4. Ask model: "Suggest a descriptive filename (no extension, 
     snake_case, max 40 chars). Return ONLY the name."
  5. Clean response: lowercase, replace spaces/special chars with _
  6. Return { original: path.basename(filePath), suggestion: clean + ext }
  NOTE: Do NOT rename the file — return suggestion only

METHOD: suggestOrganization(directoryPath, ollama, router)
  1. model = await router.selectModel('doc_qa')
  2. files = fs.readdirSync(directoryPath, { withFileTypes: true })
  3. fileList = files.slice(0, 50).map(f => f.name).join('\n')
  4. Ask model to return JSON: { folders: [{ name, purpose, files[] }], rationale }
  5. Return { suggestion, parsedFolders, model }
  NOTE: Do NOT move any files — return suggestion only

---

## NEW ROUTE: src/webapp/server/routes/generate.js

Mount at /api/generate in src/webapp/server/index.js

POST /api/generate/document
  Body: { prompt, contextFiles: string[], outputPath: string }
  Validation: prompt required, outputPath required
  Call: genAI.generateDocument(...)
  Response: { success, outputPath, wordCount, model }

POST /api/generate/transform  
  Body: { inputPath, instruction, outputPath }
  Validation: inputPath + instruction required
  Call: genAI.transformDocument(...)
  Response: { success, outputPath, originalWordCount, newWordCount, model }

POST /api/generate/synthesize
  Body: { inputPaths: string[], instruction, outputPath }
  Validation: inputPaths (min 2) + instruction required
  Call: genAI.synthesizeDocuments(...)
  Response: { success, content, outputPath, sourceFiles, model }

POST /api/generate/extract
  Body: { inputPath, goal, outputPath }
  Validation: inputPath + goal required
  Call: genAI.extractStructuredData(...)
  Response: { success, data, recordCount, outputPath, model }

POST /api/generate/autorename
  Body: { filePath }
  Call: genAI.autoRenameFile(...)
  Response: { original, suggestion, model }

POST /api/generate/suggest-organization
  Body: { directoryPath }
  Call: genAI.suggestOrganization(...)
  Response: { suggestion, parsedFolders, model }

---

## STREAMING: src/webapp/server/routes/generate.js

Add streaming support to EXISTING endpoints (do NOT add a separate /stream route).
Add an optional `stream: boolean` parameter to POST /api/generate/document and 
POST /api/generate/transform.

When stream: true is passed:
  Set headers:
    Content-Type: text/event-stream
    Cache-Control: no-cache
    Connection: keep-alive
  
  Call Ollama /api/generate with stream: true
  For each chunk: res.write('data: ' + JSON.stringify({ token }) + '\n\n')
  On finish: save file to outputPath, res.write('data: [DONE]\n\n')
  On error: res.write('data: ' + JSON.stringify({ error }) + '\n\n')

When stream: false (default):
  Return full response as JSON (existing behavior)

---

## NEW FRONTEND COMPONENT: src/webapp/client/src/components/GeneratePanel.jsx

Side panel that opens by clicking "Generate" button in header.
Panel slides in from right, 400px wide on desktop.

Four tabs: Create | Transform | Synthesize | Extract

=== CREATE TAB ===

State: prompt, contextFiles[], outputPath, isGenerating, output

UI:
  Label: "What do you want to create?"
  Textarea: placeholder "Write a project proposal based on my notes..."
             rows=4
  
  Label: "Context files (optional)"
  Context files list: chips showing selected filenames, X to remove each
  "Add files" button → opens file selector modal
  
  Label: "Save to"  
  Input: output path
  
  "Generate" button (blue, full width, disabled while generating)
  
  Output preview area (appears after generation):
    Shows streaming text in real time
    Word count badge
    "Model: {modelName}" badge
  
  Footer (appears after generation):
    "Save" button (saves to outputPath)
    "Copy" button (copies to clipboard)
    "Send to Chat" button (pastes in main chat)

=== TRANSFORM TAB ===

State: inputFile, instruction, outputPreview, originalPreview, isSaving

UI:
  Label: "Select document to transform"
  File picker input + browse button
  
  Label: "How to transform it"
  Quick action buttons (wrap):
    [Summarize] [Simplify] [Translate] [Expand] [Rewrite] [Shorten]
  Each button sets instruction textarea
  
  If "Translate" selected: language dropdown appears
    Options: Spanish, French, German, Japanese, Chinese, Portuguese, Arabic
  
  Custom instruction textarea: "Or describe a custom transformation..."
  
  "Transform" button (blue, full width)
  
  After transformation:
    Side-by-side preview:
      Left: "Original" (first 300 chars + "...")
      Right: "Transformed" (full output, scrollable)
    "Save As" button → save to new file
    "Replace Original" button (red) → overwrites original (requires confirm)

=== SYNTHESIZE TAB ===

State: inputFiles[], instruction, output

UI:
  Label: "Add documents to synthesize (minimum 2)"
  File list with add/remove:
    Each file shown as chip with X button
    "Add another file" button
  
  Label: "What do you want to do with these documents?"
  Quick action buttons:
    [Compare] [Merge into one] [Find Contradictions] [Extract Themes] [Timeline]
  
  Custom instruction textarea
  
  "Synthesize" button
  
  Output area with streaming preview
  "Save as document" button + path input

=== EXTRACT TAB ===

State: inputFile, goal, extractedData, outputFormat

UI:
  Label: "Document to extract from"
  File picker
  
  Label: "What to extract"
  Quick type buttons:
    [Dates & Deadlines] [Names & Contacts] [Prices & Amounts] 
    [Action Items] [Key Terms]
  Each sets the goal input
  
  Custom goal textarea: "Or describe what to extract..."
  
  "Extract" button
  
  Results area (appears after extraction):
    Table view: shows extracted records in columns
    Row count: "Extracted 12 records"
  
  Export row:
    "Export CSV" button
    "Export JSON" button
    "Copy Table" button

---

## CHAT INTEGRATION

In src/webapp/server/routes/chat.js, extend the intent detection 
to handle generation requests in the main chat:

After classifying task type, if type is generate/transform/synthesize/extract:
  Route to genAI service
  Return response with generated content inline
  Include file path if saved: "Generated document saved to {path}"

Add to system prompt:
  "For document generation requests: generate the content, save it to 
   the user's working directory, and tell them the filename.
   For transformation requests: transform the content and ask if they 
   want to save it."

Example chat flows:
  User: "Write a README for the files in /src"
  AI: [reads directory] → [generates README.md] → "Created README.md in /src (342 words)"
  
  User: "Translate invoice.pdf to Spanish"
  AI: [reads file] → [translates] → "Translated version saved as invoice_spanish.md"

---

## UPDATE HEADER: Add Generate Button

In src/webapp/client/src/App.jsx, add a "Generate" button that toggles GeneratePanel:
  Icon: SparklesIcon (lucide-react)
  Text: "Generate"
  Active state: blue background when panel is open

---

## UPDATE STORE: Add Generate State

Add to src/webapp/client/src/store/useStore.js:
  generatePanelOpen: false
  toggleGeneratePanel: () => set(s => ({ generatePanelOpen: !s.generatePanelOpen }))
  lastGenerated: null  // { outputPath, wordCount, model, timestamp }
  setLastGenerated: (data) => set({ lastGenerated: data })
```
