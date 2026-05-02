---
description: "Run a privacy and security audit on any VaultAI server file. Checks for path traversal, external HTTP calls, hardcoded model names, unhandled errors, and unsafe file deletions."
name: "Privacy & Security Audit"
argument-hint: "Paste the file path or select the file to audit"
agent: "agent"
---

Perform a full privacy and security audit on this VaultAI server file: $input

Check every item in this list and report findings grouped by severity (CRITICAL / WARNING / INFO):

## CRITICAL — Must Fix

- [ ] **Path traversal**: Are all user-supplied file paths validated with `path.resolve` + startsWith check? Any unvalidated path is a critical vulnerability.
- [ ] **External HTTP calls**: Does the server make any HTTP request to a host other than `localhost` or `127.0.0.1`? Even npm packages that phone home are a violation.
- [ ] **Shell injection**: Is any user input passed to `exec`, `spawn`, `execSync`, or template literals that become shell commands?
- [ ] **eval / Function()**: Is any Ollama response or user input passed to `eval()` or `new Function()`?
- [ ] **Hard delete**: Does any code call `fs.unlink`, `fs.remove`, `fs.rmdir`, or `rimraf` on user files? Must use `trash` instead.

## WARNING — Should Fix

- [ ] **Hardcoded model names**: Are model names like `"mistral:7b"` hardcoded in routes or services instead of calling `routeModel()`?
- [ ] **Unhandled promise rejections**: Does every `async` function have a `try/catch` or `.catch()`?
- [ ] **Error response leaks**: Do error responses accidentally return stack traces or internal paths to the client?
- [ ] **Missing input validation**: Are required request body fields validated before use?
- [ ] **Content logged**: Is any document content or file data being `console.log`-ged?

## INFO — Best Practice

- [ ] **Response shape consistency**: Do all success responses use `{ success: true, data }` and errors `{ success: false, error, code }`?
- [ ] **SSE headers**: Do all streaming routes set `Content-Type: text/event-stream` and `Cache-Control: no-cache`?
- [ ] **Confirmation for destructive ops**: Are deletes and bulk operations (3+ files) gated behind a confirmation step?

For each issue found, provide:
1. The exact line(s) where the issue occurs
2. Why it's a problem for VaultAI's privacy/security model
3. The correct fix with a code snippet
