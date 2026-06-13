"use client";

import { useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Database,
  Cpu,
  Wrench,
  Globe,
  Play,
  Square,
  Eye,
} from 'lucide-react';
import { LLMNode, MemoryNode, ToolNode, APINode } from '@/components/nodes/WorkflowNodes';

const nodeTypes = {
  llm: LLMNode,
  memory: MemoryNode,
  tool: ToolNode,
  api: APINode,
};

const NODE_LIBRARY = [
  { type: 'llm', label: 'LLM Reasoner', icon: Cpu, model: 'Gemini / Llama (hybrid router)', accent: 'text-primary', desc: 'Routes a prompt through the weighted Gemini/NVIDIA router.' },
  { type: 'memory', label: 'Memory Recall', icon: Database, model: 'Supabase keyword search', accent: 'text-telemetry-blue', desc: 'Searches your persisted memory store for matching context.' },
  { type: 'tool', label: 'Tool Runner', icon: Wrench, model: 'Sandboxed registry', accent: 'text-strategic-violet', desc: 'Runs a sandboxed tool: calc, timestamp, echo, uppercase, word_count.' },
  { type: 'api', label: 'API Fetch', icon: Globe, model: 'Guarded HTTP GET', accent: 'text-agent-active-glow', desc: 'Fetches a public URL (SSRF-guarded, 15s timeout).' },
];

const initialNodes: Node[] = [
  {
    id: 'recall',
    type: 'memory',
    position: { x: 50, y: 150 },
    data: { label: 'Memory Recall', model: 'Supabase search', detail: 'Pulls prior context matching "agent".' },
  },
  {
    id: 'reason',
    type: 'llm',
    position: { x: 400, y: 150 },
    data: { label: 'LLM Reasoner', model: 'Gemini / Llama', detail: 'Drafts a short technical summary from context.' },
  },
  {
    id: 'review',
    type: 'llm',
    position: { x: 750, y: 150 },
    data: { label: 'LLM Reviewer', model: 'Gemini / Llama', detail: 'Tightens and reviews the draft.' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-recall-reason', source: 'recall', target: 'reason', animated: true, style: { stroke: '#a3e635' } },
  { id: 'e-reason-review', source: 'reason', target: 'review', animated: true, style: { stroke: '#a3e635' } },
];

export default function WorkflowPage() {
  const [running, setRunning] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#a3e635' } } as Edge, eds)),
    [setEdges],
  );

  const executeWorkflow = async () => {
    if (running) return;
    setRunning(true);
    setWorkflowStatus("Booting engine...");

    // Serialize the graph state
    const serializedNodes = nodes.map(n => ({
      id: n.id,
      type: n.type,
      input: n.data.detail,
      output: '',
      status: 'pending'
    }));

    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Orchestration_Alpha_01",
          nodes: serializedNodes,
          edges: edges.map(e => ({ source: e.source, target: e.target }))
        })
      });
      const data = await res.json();
      if (data.success && data.data?.status === "completed") {
        setWorkflowStatus("Success — pipeline executed against the live engine.");
      } else {
        setWorkflowStatus(data.error?.message || "Workflow execution failed.");
      }
    } catch (e) {
      console.error(e);
      setWorkflowStatus("System exception");
    } finally {
      setRunning(false);
      setTimeout(() => setWorkflowStatus(null), 6000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <TopNav title="Architect" tabs={['Pipeline Viewer']} activeTab="Pipeline Viewer" />

      <main className="flex-1 flex overflow-hidden">
        {/* Node Library */}
        <aside className="w-72 glass-panel border-r border-cyber-border flex flex-col h-full z-20 shrink-0">
          <div className="p-4 border-b border-cyber-border">
            <h2 className="font-bold text-on-surface text-xl mb-1">Node Library</h2>
            <p className="font-mono text-[12px] text-on-surface-variant">Drag disabled in this view</p>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto terminal-scroll">
            {NODE_LIBRARY.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.type} className="bg-surface border border-cyber-border p-3 rounded-lg hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded bg-surface-bright flex items-center justify-center ${n.accent}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">{n.label}</div>
                      <div className="text-[11px] font-mono text-on-surface-variant">{n.model}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{n.desc}</p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Pipeline Canvas */}
        <section className="flex-1 relative overflow-hidden bg-obsidian-deep">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start gap-3">
            <div className="glass-panel rounded-lg p-2 flex items-center gap-3">
              <div className="flex flex-col px-2">
                <span className="text-sm font-semibold text-on-surface">Orchestration_Alpha_01</span>
                <span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1">
                  <Eye size={11} /> Interactive DAG Canvas
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {workflowStatus && (
                <span className="glass-panel px-4 py-2 text-on-surface text-sm font-mono rounded-lg animate-fade-in max-w-md truncate">
                  {workflowStatus}
                </span>
              )}
              <button
                onClick={executeWorkflow}
                disabled={running}
                className={`glass-panel rounded-lg px-4 py-2 font-mono text-[12px] font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${running ? 'text-secondary' : 'text-primary hover:brightness-110'}`}
              >
                {running ? <Square size={14} className="animate-pulse" /> : <Play size={14} />}
                {running ? 'RUNNING...' : 'TEST RUN'}
              </button>
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="react-flow-glass"
          >
            <Background color="rgba(255, 255, 255, 0.05)" gap={24} size={1} />
            <Controls className="bg-surface border-cyber-border text-on-surface fill-on-surface" />
            <MiniMap 
              nodeColor={(n) => {
                switch(n.type) {
                  case 'llm': return '#a3e635';
                  case 'memory': return '#7cc0ff';
                  case 'tool': return '#8b8cf8';
                  case 'api': return '#bef264';
                  default: return '#1a1d23';
                }
              }}
              maskColor="rgba(8, 9, 11, 0.7)"
              className="bg-surface border-cyber-border"
            />
          </ReactFlow>
        </section>
      </main>
    </div>
  );
}
