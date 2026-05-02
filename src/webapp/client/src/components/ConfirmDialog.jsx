import React, { useState } from 'react';
import { AlertTriangleIcon, XIcon } from 'lucide-react';
import useStore from '../store/useStore.js';
import { confirmAction } from '../api/client.js';

export default function ConfirmDialog() {
  const { pendingAction, clearPendingAction, addMessage, workingDirectory } = useStore();
  const [loading, setLoading] = useState(false);

  if (!pendingAction) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await confirmAction({ pendingAction, workingDirectory });
      addMessage({
        role: 'assistant',
        content: result.success
          ? `Done! The action was completed successfully.${result.result ? `\n\nResult: ${JSON.stringify(result.result, null, 2)}` : ''}`
          : `The action failed: ${result.error}`
      });
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `Error confirming action: ${err.message}`,
        isError: true
      });
    } finally {
      setLoading(false);
      clearPendingAction();
    }
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" style={{ position: 'fixed' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={18} className="text-red-600" />
            <h3 className="font-semibold text-red-900 text-sm">Confirm Action</h3>
          </div>
          <button onClick={clearPendingAction} className="text-gray-400 hover:text-gray-600">
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-700 mb-3">
            Vault AI wants to: <span className="font-medium">{pendingAction.description}</span>
          </p>

          {pendingAction.affectedFiles && pendingAction.affectedFiles.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Affected items:</p>
              <ul className="space-y-1">
                {pendingAction.affectedFiles.map(f => (
                  <li key={f} className="text-xs text-gray-700 font-mono truncate">• {f}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-4">
            This action cannot be easily undone. Files deleted will be moved to trash.
          </p>

          <div className="flex gap-2">
            <button
              onClick={clearPendingAction}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Working...' : 'Confirm — Do it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
