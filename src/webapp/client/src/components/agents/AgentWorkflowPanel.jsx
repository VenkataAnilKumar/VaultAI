import React from 'react';
import { BotIcon, GitBranchIcon } from 'lucide-react';
import AgentStep from './AgentStep.jsx';

export default function AgentWorkflowPanel({ workflow, isRunning }) {
  if (!workflow) return null;
  const { steps = [], parallel, parallelCount = 0 } = workflow;
  const parallelSteps = parallel ? steps.slice(0, parallelCount) : [];
  const sequentialSteps = parallel ? steps.slice(parallelCount) : steps;
  const totalDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="mb-3 border border-blue-100 rounded-xl bg-blue-50/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-100 bg-blue-50">
        <BotIcon size={14} className="text-blue-600" />
        <span className="text-xs font-medium text-blue-700">
          {isRunning ? 'Running multi-agent workflow...' : 'Workflow complete'}
        </span>
        {!isRunning && (
          <span className="ml-auto text-xs text-blue-400">
            {steps.length} agent{steps.length !== 1 ? 's' : ''} • {(totalDuration / 1000).toFixed(1)}s total
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {parallelSteps.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <GitBranchIcon size={11} />
              <span>Parallel</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {parallelSteps.map((step, i) => (
                <AgentStep key={i} agentType={step.agentType} status={step.error ? 'error' : 'done'}
                  result={step.result} model={step.model} toolsUsed={step.toolsUsed} duration={step.duration} />
              ))}
            </div>
          </div>
        )}

        {sequentialSteps.length > 0 && (
          <div className="space-y-1.5">
            {sequentialSteps.map((step, i) => (
              <AgentStep key={i} agentType={step.agentType} status={step.error ? 'error' : 'done'}
                result={step.result} model={step.model} toolsUsed={step.toolsUsed} duration={step.duration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
