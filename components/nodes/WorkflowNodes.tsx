import { Handle, Position } from '@xyflow/react';
import { Cpu, Database, Wrench, Globe } from 'lucide-react';

interface NodeProps {
  data: {
    label: string;
    model: string;
    detail: string;
  };
  isConnectable: boolean;
}

const NodeWrapper = ({ children, active = false }: { children: React.ReactNode, active?: boolean }) => (
  <div className={`w-64 glass-elevated rounded-xl p-4 shadow-lg ${active ? 'pulse-active' : ''} hover:border-surface-border-hover transition-colors border border-cyber-border bg-surface`}>
    {children}
  </div>
);

export const LLMNode = ({ data, isConnectable }: NodeProps) => (
  <NodeWrapper>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-primary rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center text-primary">
        <Cpu size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">LLM</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-full">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-primary border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const MemoryNode = ({ data, isConnectable }: NodeProps) => (
  <NodeWrapper>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-telemetry-blue rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-telemetry-blue/15 flex items-center justify-center text-telemetry-blue">
        <Database size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">MEMORY</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-full">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-telemetry-blue border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const ToolNode = ({ data, isConnectable }: NodeProps) => (
  <NodeWrapper>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-strategic-violet rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-strategic-violet/15 flex items-center justify-center text-strategic-violet">
        <Wrench size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">TOOL</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-full">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-strategic-violet border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const APINode = ({ data, isConnectable }: NodeProps) => (
  <NodeWrapper>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-agent-active-glow rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-agent-active-glow/15 flex items-center justify-center text-agent-active-glow">
        <Globe size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">API</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-full">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-agent-active-glow border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);
