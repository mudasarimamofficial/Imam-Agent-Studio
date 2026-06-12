export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyber-border border-t-primary rounded-full animate-spin"></div>
        <div className="font-mono text-primary animate-pulse text-sm">INITIALIZING_NODE...</div>
      </div>
    </div>
  );
}
