const fs = require('fs');
const path = require('path');

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.rst', '.log'];
const CODE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.cs', '.rb', '.php', '.sh', '.yaml', '.yml', '.toml', '.json', '.xml', '.html', '.css', '.sql'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (IMAGE_EXTENSIONS.includes(ext)) {
      return { text: null, wordCount: 0, type: 'image', isImage: true };
    }

    if (ext === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return {
          text: data.text,
          wordCount: data.text.split(/\s+/).filter(Boolean).length,
          type: 'pdf'
        };
      } catch (err) {
        return { text: null, wordCount: 0, type: 'pdf', error: err.message };
      }
    }

    if (ext === '.docx' || ext === '.doc') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return {
          text: result.value,
          wordCount: result.value.split(/\s+/).filter(Boolean).length,
          type: 'docx'
        };
      } catch (err) {
        return { text: null, wordCount: 0, type: 'docx', error: err.message };
      }
    }

    if (TEXT_EXTENSIONS.includes(ext) || CODE_EXTENSIONS.includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        text: content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        type: TEXT_EXTENSIONS.includes(ext) ? 'text' : 'code'
      };
    }

    return { text: null, wordCount: 0, type: 'unsupported', unsupported: true };
  } catch (err) {
    return { text: null, wordCount: 0, type: 'error', error: err.message };
  }
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const approxCharsPerToken = 4;
  const chunkChars = chunkSize * approxCharsPerToken;
  const overlapChars = overlap * approxCharsPerToken;

  const chunks = [];
  let startChar = 0;
  let index = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkChars, text.length);
    const chunk = text.slice(startChar, endChar);
    chunks.push({ chunk, index, startChar });
    index++;
    startChar += chunkChars - overlapChars;
    if (startChar >= text.length) break;
  }

  return chunks;
}

module.exports = { extractText, chunkText };
