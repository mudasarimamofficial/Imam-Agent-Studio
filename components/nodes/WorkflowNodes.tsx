import { Handle, Position } from '@xyflow/react';
import { Cpu, Database, Wrench, Globe, Trash2 } from 'lucide-react';

interface NodeProps {
  id: string;
  data: {
    label: string;
    model: string;
    detail: string;
    currentCost?: string;
    activeModel?: string;
    onDelete?: (id: string) => void;
  };
  isConnectable: boolean;
}

const NodeWrapper = ({ id, children, active = false, data }: { id: string, children: React.ReactNode, active?: boolean, data?: NodeProps['data'] }) => (
  <div className={`w-64 glass-elevated rounded-xl p-4 shadow-lg ${active ? 'pulse-active' : ''} hover:border-surface-border-hover transition-colors border border-cyber-border bg-surface relative overflow-hidden`}>
    {children}
    {data?.currentCost && (
      <div className="absolute top-0 right-8 bg-primary/20 text-primary font-mono text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-primary/30 z-10">
        ${data.currentCost}
      </div>
    )}
    {data?.onDelete && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); data.onDelete!(id); }}
        className="absolute top-2 right-2 text-on-surface-variant hover:text-error transition-colors p-1 z-20 cursor-pointer"
        title="Remove action node"
      >
        <Trash2 size={13} />
      </button>
    )}
    {data?.activeModel && (
      <div className="absolute bottom-0 left-0 right-0 bg-surface-elevated/90 border-t border-cyber-border px-3 py-1.5 font-mono text-[9px] text-on-surface-variant flex justify-between z-10">
        <span>ROUTING:</span>
        <span className="text-primary truncate ml-2">{data.activeModel}</span>
      </div>
    )}
  </div>
);

export const LLMNode = ({ id, data, isConnectable }: NodeProps) => (
  <NodeWrapper id={id} active={!!data.currentCost} data={data}>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-primary rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center text-primary">
        <Cpu size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto mr-5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">LLM</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-[200px]">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-primary border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const MemoryNode = ({ id, data, isConnectable }: NodeProps) => (
  <NodeWrapper id={id} active={!!data.currentCost} data={data}>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-telemetry-blue rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-telemetry-blue/15 flex items-center justify-center text-telemetry-blue">
        <Database size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto mr-5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">MEMORY</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-[200px]">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-telemetry-blue border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const ToolNode = ({ id, data, isConnectable }: NodeProps) => (
  <NodeWrapper id={id} active={!!data.currentCost} data={data}>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-strategic-violet rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-strategic-violet/15 flex items-center justify-center text-strategic-violet">
        <Wrench size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto mr-5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">TOOL</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-[200px]">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-strategic-violet border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);

export const APINode = ({ id, data, isConnectable }: NodeProps) => (
  <NodeWrapper id={id} active={!!data.currentCost} data={data}>
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-surface-border border-2 border-agent-active-glow rounded-full" />
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded bg-agent-active-glow/15 flex items-center justify-center text-agent-active-glow">
        <Globe size={15} />
      </div>
      <span className="text-sm font-semibold text-on-surface">{data.label}</span>
      <span className="ml-auto mr-5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">API</span>
    </div>
    <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
    <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2 truncate max-w-[200px]">
      {data.model}
    </div>
    <p className="text-[11px] text-on-surface-variant leading-relaxed break-words">{data.detail}</p>
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-agent-active-glow border-2 border-surface-container rounded-full" />
  </NodeWrapper>
);
