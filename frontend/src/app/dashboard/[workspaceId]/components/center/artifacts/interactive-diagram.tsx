'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus,
  Database,
  Server,
  Globe,
  Cpu,
  ShieldCheck,
  Save,
  Download,
  Image as ImageIcon,
  Trash2,
  Layers,
  Zap,
  Terminal,
  Cloud,
  StickyNote,
  Type,
  Maximize2,
  MousePointer2,
  RotateCcw,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useDesignStore } from '../../../stores/design.store';
import { useDesign } from '../../../hooks/use-design';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  database: Database,
  shield: ShieldCheck,
  globe: Globe,
  server: Server,
  zap: Zap,
  cloud: Cloud,
  cpu: Cpu,
  terminal: Terminal,
};

// Enhanced Custom Node Component with Support for multiple icons/logos
const SystemNode = ({ data, id }: any) => {
  let Icon = Server;
  if (typeof data.icon === 'string') {
    Icon = ICON_MAP[data.icon] || Server;
  } else if (typeof data.icon === 'function' || (typeof data.icon === 'object' && data.icon && data.icon.$$typeof)) {
    // If it's a function or a React component object (like memo/forwardRef)
    Icon = data.icon;
  }

  const { setNodes } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };

  return (
    <div className="bg-card border-primary/20 group hover:border-primary hover:shadow-primary/10 min-w-[200px] rounded-2xl border-2 px-5 py-4 shadow-2xl transition-all duration-500">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !h-3 !w-3 !border-none"
      />

      <div className="flex items-center gap-4">
        <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transform rounded-xl p-3 shadow-sm transition-all duration-300 group-hover:rotate-6">
          <Icon size={20} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="text-muted-foreground/50 mb-1 text-[10px] leading-none font-black tracking-widest uppercase">
            {data.type || 'Component'}
          </span>
          <span className="text-foreground truncate text-sm font-bold">{data.label}</span>
        </div>
        <button
          onClick={onDelete}
          className="hover:bg-destructive/10 hover:text-destructive rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !h-3 !w-3 !border-none"
      />
    </div>
  );
};

const StickyNode = ({ data, id }: any) => {
  const { setNodes } = useReactFlow();
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };
  const onBlur = (e: any) => {
    const newLabel = e.target.innerText;
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)));
  };
  return (
    <div className="bg-amber-100/90 text-amber-900 shadow-amber-900/10 min-h-[150px] min-w-[150px] rounded-sm p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-start justify-between">
        <StickyNote size={14} className="opacity-50" />
        <button
          onClick={onDelete}
          className="hover:bg-amber-200 rounded p-1 opacity-0 transition-all group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div
        contentEditable
        onBlur={onBlur}
        suppressContentEditableWarning
        className="text-xs font-medium outline-none"
      >
        {data.label}
      </div>
    </div>
  );
};

const TextNode = ({ data, id }: any) => {
  const { setNodes } = useReactFlow();
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== id));
  };
  const onBlur = (e: any) => {
    const newLabel = e.target.innerText;
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)));
  };
  return (
    <div className="group relative min-w-[100px] p-2">
      <div
        contentEditable
        onBlur={onBlur}
        suppressContentEditableWarning
        className="text-foreground text-sm font-bold outline-none"
      >
        {data.label}
      </div>
      <button
        onClick={onDelete}
        className="bg-destructive/10 text-destructive absolute -top-4 -right-4 rounded p-1 opacity-0 transition-all group-hover:opacity-100"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
};

const nodeTypes = {
  system: SystemNode,
  sticky: StickyNode,
  text: TextNode,
};

// Parser to convert Mermaid string to React Flow nodes/edges
const parseMermaidToFlow = (mermaid: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lines = mermaid.split('\n');
  const nodeMap = new Map<string, { label: string; level: number; index: number }>();
  const adjacencyList = new Map<string, string[]>();

  const isSequence = mermaid.toLowerCase().includes('sequencediagram');

  const getIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('db') || lowerLabel.includes('sql') || lowerLabel.includes('redis') || lowerLabel.includes('mongo') || lowerLabel.includes('storage')) return 'database';
    if (lowerLabel.includes('auth') || lowerLabel.includes('security') || lowerLabel.includes('shield')) return 'shield';
    if (lowerLabel.includes('client') || lowerLabel.includes('app') || lowerLabel.includes('web')) return 'globe';
    if (lowerLabel.includes('gateway') || lowerLabel.includes('proxy') || lowerLabel.includes('lb') || lowerLabel.includes('balancer')) return 'server';
    if (lowerLabel.includes('fast') || lowerLabel.includes('quick') || lowerLabel.includes('cache')) return 'zap';
    if (lowerLabel.includes('cloud') || lowerLabel.includes('aws') || lowerLabel.includes('azure')) return 'cloud';
    return 'cpu';
  };

  const getType = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('db') || lowerLabel.includes('database')) return 'Storage';
    if (lowerLabel.includes('gateway')) return 'Security';
    if (lowerLabel.includes('client') || lowerLabel.includes('app')) return 'Frontend';
    if (lowerLabel.includes('service') || lowerLabel.includes('api')) return 'Backend';
    if (lowerLabel.includes('cache')) return 'Cache';
    return isSequence ? 'Actor' : 'Compute';
  };

  if (isSequence) {
    // Parse Sequence Diagram
    let participants: string[] = [];
    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('sequenceDiagram')) return;

      // Match participants
      const partMatch = cleanLine.match(/participant\s+([a-zA-Z0-9_-]+)(?:\s+as\s+(".*?"|.*?))?/);
      if (partMatch) {
        const id = partMatch[1];
        const label = partMatch[2] ? partMatch[2].replace(/"/g, '') : id;
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label, level: 0, index: nodeMap.size });
          participants.push(id);
        }
        return;
      }

      // Match messages/arrows
      const arrowMatch = cleanLine.match(/([a-zA-Z0-9_-]+)\s*(-+>>?|--+>>?)\s*([a-zA-Z0-9_-]+)(?:\s*:\s*(.*))?/);
      if (arrowMatch) {
        const [_, srcId, type, tgtId, label] = arrowMatch;
        if (!nodeMap.has(srcId)) nodeMap.set(srcId, { label: srcId, level: 0, index: nodeMap.size });
        if (!nodeMap.has(tgtId)) nodeMap.set(tgtId, { label: tgtId, level: 0, index: nodeMap.size });

        edges.push({
          id: `e-${srcId}-${tgtId}-${edges.length}`,
          source: srcId,
          target: tgtId,
          label: label,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
          labelStyle: { fill: 'var(--foreground)', fontSize: 10, fontWeight: 'bold' },
        });
      }
    });

    // Layout sequence diagram horizontally
    const SPACING = 250;
    Array.from(nodeMap.entries()).forEach(([id, data], i) => {
      nodes.push({
        id,
        type: 'system',
        position: { x: i * SPACING + 100, y: 100 },
        data: { label: data.label, type: getType(data.label), icon: getIcon(data.label) },
      });
    });

    return { nodes, edges };
  }

  // Standard Graph Parser (Flowchart/Architecture)
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('graph') || cleanLine.startsWith('subgraph')) return;

    const edgeMatch = cleanLine.match(
      /([a-zA-Z0-9_-]+)(?:\[(.*?)\])?\s*(-+>>?|--+>>?)\s*([a-zA-Z0-9_-]+)(?:\[(.*?)\])?/
    );

    if (edgeMatch) {
      const [_, srcId, srcLabel, type, tgtId, tgtLabel] = edgeMatch;
      if (!nodeMap.has(srcId)) nodeMap.set(srcId, { label: srcLabel || srcId, level: -1, index: nodeMap.size });
      if (!nodeMap.has(tgtId)) nodeMap.set(tgtId, { label: tgtLabel || tgtId, level: -1, index: nodeMap.size });
      if (!adjacencyList.has(srcId)) adjacencyList.set(srcId, []);
      adjacencyList.get(srcId)!.push(tgtId);

      edges.push({
        id: `e-${srcId}-${tgtId}-${index}`,
        source: srcId,
        target: tgtId,
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        animated: srcId.toLowerCase().includes('client'),
      });
    } else {
      // Static node definitions: A["Label"]
      const nodeOnlyMatch = cleanLine.match(/([a-zA-Z0-9_-]+)\[(.*?)\]/);
      if (nodeOnlyMatch) {
        const [_, id, label] = nodeOnlyMatch;
        if (!nodeMap.has(id)) nodeMap.set(id, { label: label.replace(/"/g, ''), level: -1, index: nodeMap.size });
      }
    }
  });

  // Calculate hierarchical levels using BFS
  const calculateLevels = () => {
    const incomingCount = new Map<string, number>();
    nodeMap.forEach((_, id) => incomingCount.set(id, 0));
    edges.forEach((edge) => incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1));
    const roots = Array.from(nodeMap.keys()).filter((id) => incomingCount.get(id) === 0);
    const queue = roots.map((id) => ({ id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const nodeData = nodeMap.get(id)!;
      nodeData.level = Math.max(nodeData.level, level);
      const children = adjacencyList.get(id) || [];
      children.forEach((childId) => queue.push({ id: childId, level: level + 1 }));
    }
    nodeMap.forEach((data, id) => { if (data.level === -1) data.level = 0; });
  };

  calculateLevels();

  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 200;
  const levelCounts = new Map<number, number>();

  nodeMap.forEach((data, id) => {
    const level = data.level;
    const countAtLevel = levelCounts.get(level) || 0;
    levelCounts.set(level, countAtLevel + 1);

    nodes.push({
      id,
      type: 'system',
      position: { x: countAtLevel * HORIZONTAL_SPACING + 100, y: level * VERTICAL_SPACING + 100 },
      data: { label: data.label, type: getType(data.label), icon: getIcon(data.label) },
    });
  });

  return { nodes, edges };
};

function FlowInner({
  initialMermaid,
  projectId,
  type,
}: {
  initialMermaid?: string;
  projectId: string;
  type: string;
}) {
  const { getNodes, getEdges, zoomTo, fitView } = useReactFlow();
  const { whiteboardData, setWhiteboardData } = useDesignStore();
  const { saveWhiteboard } = useDesign(projectId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const flowWrapper = useRef<HTMLDivElement>(null);

  // Load state from store or parse Mermaid
  useEffect(() => {
    const savedData = whiteboardData[`${projectId}_${type}`];
    if (savedData && savedData.nodes?.length > 0) {
      setNodes(savedData.nodes);
      setEdges(savedData.edges);
    } else if (initialMermaid) {
      const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(initialMermaid);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    }
  }, [initialMermaid, projectId, type, setNodes, setEdges, whiteboardData]);

  // Internal save whenever items change (debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      if (currentNodes.length > 0) {
        setIsSaving(true);
        // Local Save
        setWhiteboardData(projectId, type, { nodes: currentNodes, edges: currentEdges });
        // Remote Save
        await saveWhiteboard(type, { nodes: currentNodes, edges: currentEdges });
        setIsSaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, edges, getNodes, getEdges, projectId, type, setWhiteboardData, saveWhiteboard]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, style: { stroke: 'var(--primary)', strokeWidth: 2 } }, eds)
      ),
    [setEdges]
  );

  const addNode = (type: string, label: string, icon: any) => {
    const id = `node_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: Node = {
      id,
      type: 'system',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label, type, icon },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const downloadImage = () => {
    if (flowWrapper.current) {
      const toastId = toast.loading('Generating architecture snapshot...');
      toPng(flowWrapper.current, {
        filter: (node: HTMLElement) => {
          const isControl =
            node?.classList?.contains('react-flow__controls') ||
            node?.classList?.contains('react-flow__minimap');
          return !isControl;
        },
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `system-design-${type}.png`;
          link.href = dataUrl;
          link.click();
          toast.success('Diagram exported to PNG', { id: toastId });
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to capture snapshot', { id: toastId });
        });
    }
  };

  const addCustomNode = (nodeType: string, label: string, data: any = {}) => {
    const id = `${nodeType}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode: Node = {
      id,
      type: nodeType,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label, ...data },
    };
    setNodes((nds) => nds.concat(newNode));
    toast.success(`${label} placed on canvas`, {
      icon: <Plus size={14} />,
      duration: 1500,
    });
  };

  return (
    <div
      className="bg-background relative flex h-full w-full flex-col overflow-hidden"
      ref={flowWrapper}
    >
      {/* Tool Dock (Left Side) */}
      <div className="absolute top-1/2 left-6 z-10 flex -translate-y-1/2 flex-col gap-2">
        <div className="bg-card/90 border-border flex flex-col gap-1 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl">
          <ToolButton
            onClick={() => addCustomNode('system', 'New Microservice', { type: 'Backend', icon: 'server' })}
            icon={Plus}
            tooltip="Add System Component"
          />
          <ToolButton
            onClick={() => addCustomNode('sticky', 'New architectural note...', {})}
            icon={StickyNote}
            tooltip="Add Sticky Note"
          />
          <ToolButton
            onClick={() => addCustomNode('text', 'Project Title', {})}
            icon={Type}
            tooltip="Add Text Label"
          />
          <div className="bg-border my-1 h-px w-full" />
          <ToolButton
            onClick={() => fitView()}
            icon={Maximize2}
            tooltip="Fit View"
          />
        </div>
      </div>

      {/* Persistence State Indicator */}
      <div className="absolute top-6 right-6 z-10">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-500",
          isSaving ? "bg-primary/10 text-primary animate-pulse" : "bg-emerald-500/10 text-emerald-500"
        )}>
          {isSaving ? (
            <>
              <RotateCcw size={10} className="animate-spin" />
              Syncing Changes...
            </>
          ) : (
            <>
              <Save size={10} />
              Saved to Cloud
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
        <div className="bg-card/90 border-border flex rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => addCustomNode('system', 'New API', { type: 'Service', icon: 'terminal' })}
            className="hover:bg-primary/10 text-muted-foreground hover:text-primary group flex items-center gap-2 rounded-xl p-3 px-4 transition-all"
          >
            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Add Block</span>
          </button>
          <div className="bg-border mx-1 w-px" />
          <button
            onClick={downloadImage}
            className="hover:bg-primary/5 text-muted-foreground hover:text-primary flex items-center gap-2 rounded-xl p-3 px-4 transition-all"
          >
            <ImageIcon size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">PNG</span>
          </button>
        </div>

        <div className="bg-card/90 border-border animate-in fade-in slide-in-from-left-6 flex w-56 flex-col gap-4 rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl duration-700">
          <div className="border-border mb-1 flex items-center gap-2 border-b pb-3">
            <Layers size={14} className="text-primary" />
            <h4 className="text-muted-foreground/80 text-[10px] font-black tracking-[0.2em] uppercase">
              {type === 'scaling' ? 'Scaling Blocks' : type === 'cloud' ? 'Cloud Resources' : type === 'api' ? 'API Components' : 'General Blocks'}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {type === 'scaling' ? (
              <>
                <TemplateButton onClick={() => addCustomNode('system', 'Load Balancer', { type: 'Infra', icon: 'server' })} icon={Server} label="Load Balancer" color="text-sky-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'Auto Scaling Group', { type: 'Infra', icon: 'cpu' })} icon={Cpu} label="Auto Scaling" color="text-orange-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'Read Replica', { type: 'Database', icon: 'database' })} icon={Database} label="Read Replica" color="text-amber-500" />
              </>
            ) : type === 'cloud' ? (
              <>
                <TemplateButton onClick={() => addCustomNode('system', 'VPC / Subnet', { type: 'Network', icon: 'globe' })} icon={Globe} label="VPC Network" color="text-blue-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'S3 Bucket', { type: 'Storage', icon: 'database' })} icon={Database} label="Cloud Storage" color="text-green-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'Lambda / Function', { type: 'Compute', icon: 'zap' })} icon={Zap} label="Serverless Fn" color="text-violet-500" />
              </>
            ) : (
              <>
                <TemplateButton onClick={() => addCustomNode('system', 'Redis Cache', { type: 'Database', icon: 'zap' })} icon={Zap} label="Redis Cache" color="text-red-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'Postgres', { type: 'Database', icon: 'database' })} icon={Database} label="Postgres DB" color="text-amber-500" />
                <TemplateButton onClick={() => addCustomNode('system', 'Microservice', { type: 'Backend', icon: 'cpu' })} icon={Cpu} label="Microservice" color="text-emerald-500" />
              </>
            )}
          </div>
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
        className="bg-neutral-950/20"
      >
        <Controls className="!bg-card !border-border !fill-foreground !stroke-foreground overflow-hidden !rounded-xl !shadow-2xl" />
        <MiniMap
          className="!bg-card !border-border !m-6 !overflow-hidden !rounded-2xl !shadow-2xl"
          maskColor="rgba(0, 0, 0, 0.6)"
          nodeColor="#3b82f6"
          zoomable
          pannable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1}
          color="rgba(255,255,255,0.03)"
        />
      </ReactFlow>
    </div>
  );
}

export function InteractiveDiagram(props: {
  initialMermaid?: string;
  projectId: string;
  type: string;
}) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}

function TemplateButton({ icon: Icon, label, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-muted/50 text-muted-foreground hover:text-foreground group hover:border-border/50 flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-left transition-all"
    >
      <div
        className={cn(
          'bg-card border-border rounded-md border p-1.5 shadow-sm transition-all duration-300 group-hover:scale-110',
          color
        )}
      >
        <Icon size={12} />
      </div>
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </button>
  );
}

function ToolButton({ icon: Icon, onClick, tooltip }: any) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="hover:bg-primary/10 text-muted-foreground hover:text-primary flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90"
    >
      <Icon size={18} />
    </button>
  );
}
