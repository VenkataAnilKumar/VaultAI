const path = require('path');
const fs = require('fs-extra');
const docReader = require('./docReader');

class GenAIService {
  async generateDocument(prompt, contextFiles = [], outputPath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('generate');
    if (!model) throw new Error('No generation model available');

    const contextTexts = await Promise.all(
      (contextFiles || []).map(f => docReader.extractText(f))
    );
    const contextSection = contextTexts
      .map((t, i) => `Context from ${path.basename(contextFiles[i])}:\n${(t.text || '').slice(0, 2000)}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a document writer. Generate well-structured, professional content based on the user\'s instructions and any provided context. Output clean markdown.'
      },
      {
        role: 'user',
        content: contextSection ? `${contextSection}\n\nInstruction: ${prompt}` : prompt
      }
    ];

    const response = await ollama.chat(model, messages);
    const content = response.message?.content || '';

    if (outputPath) {
      await fs.outputFile(outputPath, content);
    }

    return {
      success: true,
      content,
      outputPath,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      model
    };
  }

  async transformDocument(inputPath, instruction, outputPath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('transform');
    if (!model) throw new Error('No model available');

    const sourceText = await docReader.extractText(inputPath);
    const messages = [
      {
        role: 'system',
        content: 'You are a document editor. Transform the provided document according to the user\'s instruction. Preserve the meaning and structure unless instructed otherwise.'
      },
      {
        role: 'user',
        content: `Document:\n${sourceText.text}\n\nInstruction: ${instruction}`
      }
    ];

    const response = await ollama.chat(model, messages);
    const content = response.message?.content || '';
    const finalPath = outputPath || inputPath.replace(/(\.\w+)$/, '_transformed$1');

    if (finalPath) {
      await fs.outputFile(finalPath, content);
    }

    return { success: true, content, outputPath: finalPath, model };
  }

  async synthesizeDocuments(inputPaths, instruction, outputPath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('synthesize');
    if (!model) throw new Error('No model available');

    const texts = await Promise.all(inputPaths.map(p => docReader.extractText(p)));
    const combined = texts
      .map((t, i) => `=== ${path.basename(inputPaths[i])} ===\n${(t.text || '').slice(0, 1500)}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You synthesize multiple documents. Be accurate, cite which document supports each point.'
      },
      {
        role: 'user',
        content: `${combined}\n\nTask: ${instruction}`
      }
    ];

    const response = await ollama.chat(model, messages);
    const content = response.message?.content || '';

    if (outputPath) {
      await fs.outputFile(outputPath, content);
    }

    return { success: true, content, outputPath, sourceFiles: inputPaths, model };
  }

  async extractStructuredData(inputPath, goal, outputPath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('extract');
    if (!model) throw new Error('No model available');

    const sourceText = await docReader.extractText(inputPath);
    const messages = [
      {
        role: 'system',
        content: 'Extract structured data from documents. Return ONLY valid JSON array. No explanation.'
      },
      {
        role: 'user',
        content: `Document:\n${sourceText.text}\n\nExtract: ${goal}\nReturn as JSON array of objects.`
      }
    ];

    const response = await ollama.chat(model, messages);
    let data;
    try {
      data = JSON.parse(response.message?.content || '[]');
    } catch {
      data = [{ raw: response.message?.content }];
    }

    if (outputPath) {
      if (outputPath.endsWith('.csv')) {
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
          await fs.outputFile(outputPath, [headers, ...rows].join('\n'));
        }
      } else {
        await fs.outputFile(outputPath, JSON.stringify(data, null, 2));
      }
    }

    return { success: true, data, recordCount: data.length, outputPath, model };
  }

  async autoRenameFile(filePath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('file_op');
    if (!model) throw new Error('No model available');

    const text = await docReader.extractText(filePath);
    const preview = (text.text || '').slice(0, 800);
    const ext = path.extname(filePath);

    const messages = [
      {
        role: 'user',
        content: `Based on this content, suggest a descriptive filename (no extension, use_underscores, lowercase, max 40 chars):\n\n${preview}\n\nReturn ONLY the filename, nothing else.`
      }
    ];

    const response = await ollama.chat(model, messages);
    const suggestion = (response.message?.content || '').trim().replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

    return {
      original: path.basename(filePath),
      suggestion: suggestion + ext,
      model
    };
  }

  async suggestOrganization(directoryPath, ollama, modelRouter) {
    const model = await modelRouter.selectModel('doc_qa');
    if (!model) throw new Error('No model available');

    const fs2 = require('fs');
    const files = fs2.readdirSync(directoryPath);
    const fileList = files.slice(0, 50).join('\n');

    const messages = [
      {
        role: 'user',
        content: `Suggest a folder organization for these files. Return JSON with { folders: [{ name, purpose, files: [] }] }\n\nFiles:\n${fileList}`
      }
    ];

    const response = await ollama.chat(model, messages);
    return { suggestion: response.message?.content, model };
  }
}

module.exports = { GenAIService };
