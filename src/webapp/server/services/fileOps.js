const fs = require('fs-extra');
const path = require('path');
const os = require('os');

function validatePath(filePath) {
  try {
    const resolved = path.resolve(filePath);
    if (resolved.includes('..')) {
      return { valid: false, resolved, error: 'Path traversal detected' };
    }
    const home = os.homedir();
    if (!resolved.startsWith(home) && !resolved.startsWith('/tmp') && !resolved.startsWith('/home')) {
      return { valid: false, resolved, error: `Path must be within home directory: ${home}` };
    }
    return { valid: true, resolved };
  } catch (err) {
    return { valid: false, resolved: filePath, error: err.message };
  }
}

async function executeTool(toolName, args) {
  try {
    switch (toolName) {
      case 'list_directory': {
        const { path: dirPath } = args;
        const v = validatePath(dirPath);
        if (!v.valid) return { success: false, error: v.error };
        const entries = await fs.readdir(v.resolved, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (e) => {
          const fullPath = path.join(v.resolved, e.name);
          let stat = null;
          try { stat = await fs.stat(fullPath); } catch {}
          return {
            name: e.name,
            path: fullPath,
            type: e.isDirectory() ? 'directory' : 'file',
            size: stat ? stat.size : 0,
            modified: stat ? stat.mtime.toISOString() : null,
            extension: e.isDirectory() ? null : path.extname(e.name).toLowerCase()
          };
        }));
        files.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        return { success: true, result: { files } };
      }

      case 'read_file': {
        const docReader = require('./docReader');
        const { path: filePath } = args;
        const v = validatePath(filePath);
        if (!v.valid) return { success: false, error: v.error };
        const result = await docReader.extractText(v.resolved);
        return { success: true, result };
      }

      case 'move_file': {
        const { source, destination } = args;
        const vs = validatePath(source);
        const vd = validatePath(destination);
        if (!vs.valid) return { success: false, error: vs.error };
        if (!vd.valid) return { success: false, error: vd.error };
        await fs.move(vs.resolved, vd.resolved, { overwrite: false });
        return { success: true, result: { moved: true, from: vs.resolved, to: vd.resolved } };
      }

      case 'copy_file': {
        const { source, destination } = args;
        const vs = validatePath(source);
        const vd = validatePath(destination);
        if (!vs.valid) return { success: false, error: vs.error };
        if (!vd.valid) return { success: false, error: vd.error };
        await fs.copy(vs.resolved, vd.resolved);
        return { success: true, result: { copied: true, from: vs.resolved, to: vd.resolved } };
      }

      case 'delete_file': {
        const { path: filePath } = args;
        const v = validatePath(filePath);
        if (!v.valid) return { success: false, error: v.error };
        const { default: trash } = await import('trash');
        await trash(v.resolved);
        return { success: true, result: { deleted: true, path: v.resolved, sentToTrash: true } };
      }

      case 'create_folder': {
        const { path: dirPath } = args;
        const v = validatePath(dirPath);
        if (!v.valid) return { success: false, error: v.error };
        await fs.mkdir(v.resolved, { recursive: true });
        return { success: true, result: { created: true, path: v.resolved } };
      }

      case 'rename_file': {
        const { path: filePath, new_name } = args;
        if (new_name.includes('/') || new_name.includes('\\')) {
          return { success: false, error: 'New name cannot contain path separators' };
        }
        const v = validatePath(filePath);
        if (!v.valid) return { success: false, error: v.error };
        const newPath = path.join(path.dirname(v.resolved), new_name);
        await fs.rename(v.resolved, newPath);
        return { success: true, result: { renamed: true, from: v.resolved, to: newPath } };
      }

      case 'get_file_info': {
        const { path: filePath } = args;
        const v = validatePath(filePath);
        if (!v.valid) return { success: false, error: v.error };
        const stat = await fs.stat(v.resolved);
        return {
          success: true,
          result: {
            name: path.basename(v.resolved),
            path: v.resolved,
            size: stat.size,
            type: stat.isDirectory() ? 'directory' : 'file',
            created: stat.birthtime.toISOString(),
            modified: stat.mtime.toISOString(),
            extension: path.extname(v.resolved).toLowerCase(),
            isDirectory: stat.isDirectory()
          }
        };
      }

      case 'search_files': {
        const { query, directory, recursive = true } = args;
        const v = validatePath(directory);
        if (!v.valid) return { success: false, error: v.error };
        const results = [];
        async function walk(dir) {
          let entries;
          try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
          await Promise.all(entries.map(async (e) => {
            const fullPath = path.join(dir, e.name);
            if (e.name.toLowerCase().includes(query.toLowerCase())) {
              let stat = null;
              try { stat = await fs.stat(fullPath); } catch {}
              results.push({ name: e.name, path: fullPath, size: stat?.size || 0, modified: stat?.mtime?.toISOString() });
            }
            if (recursive && e.isDirectory()) await walk(fullPath);
          }));
        }
        await walk(v.resolved);
        return { success: true, result: { results, count: results.length } };
      }

      case 'bulk_move': {
        const { files, destination } = args;
        const vd = validatePath(destination);
        if (!vd.valid) return { success: false, error: vd.error };
        await fs.ensureDir(vd.resolved);
        const moved = [];
        const errors = [];
        for (const f of files) {
          const v = validatePath(f);
          if (!v.valid) { errors.push({ file: f, error: v.error }); continue; }
          const dest = path.join(vd.resolved, path.basename(v.resolved));
          try {
            await fs.move(v.resolved, dest, { overwrite: false });
            moved.push(dest);
          } catch (err) {
            errors.push({ file: f, error: err.message });
          }
        }
        return { success: true, result: { moved: moved.length, errors, files: moved } };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { validatePath, executeTool };
