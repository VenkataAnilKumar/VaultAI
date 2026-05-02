const FILE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List all files and folders in a directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to list' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the text content of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_file',
      description: 'Move a file or folder to a new location',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source path' },
          destination: { type: 'string', description: 'Destination path' }
        },
        required: ['source', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'copy_file',
      description: 'Copy a file to a new location',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source path' },
          destination: { type: 'string', description: 'Destination path' }
        },
        required: ['source', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Move a file to trash (recoverable delete)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path of file to delete' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_folder',
      description: 'Create a new directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path of folder to create' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rename_file',
      description: 'Rename a file or folder',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Current file path' },
          new_name: { type: 'string', description: 'New filename (not full path, just the name)' }
        },
        required: ['path', 'new_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_file_info',
      description: 'Get metadata about a file: size, type, dates',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search for files by name pattern in a directory',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query / filename pattern' },
          directory: { type: 'string', description: 'Directory to search in' },
          recursive: { type: 'boolean', description: 'Search recursively', default: true }
        },
        required: ['query', 'directory']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_move',
      description: 'Move multiple files to a destination folder',
      parameters: {
        type: 'object',
        properties: {
          files: { type: 'array', items: { type: 'string' }, description: 'Array of file paths to move' },
          destination: { type: 'string', description: 'Destination folder path' }
        },
        required: ['files', 'destination']
      }
    }
  }
];

const DESTRUCTIVE_TOOLS = ['delete_file'];
const CONFIRM_THRESHOLD_TOOLS = ['bulk_move'];

module.exports = { FILE_TOOLS, DESTRUCTIVE_TOOLS, CONFIRM_THRESHOLD_TOOLS };
