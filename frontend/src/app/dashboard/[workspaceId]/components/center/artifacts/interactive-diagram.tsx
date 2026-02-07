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
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useDesignStore } from '../../../stores/design.store';

// Enhanced Custom Node Component with Support for multiple icons/logos
const SystemNode = ({ data, id }: any) => {
  const Icon = data.icon || Server;
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

const nodeTypes = {
  system: SystemNode,
};

// Parser to convert Mermaid string to React Flow nodes/edges
const parseMermaidToFlow = (mermaid: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lines = mermaid.split('\n');
  const nodeMap = new Map<string, { label: string; level: number; index: number }>();
  const adjacencyList = new Map<string, string[]>();

  const getIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (
      lowerLabel.includes('db') ||
      lowerLabel.includes('sql') ||
      lowerLabel.includes('redis') ||
      lowerLabel.includes('mongo') ||
      lowerLabel.includes('storage')
    )
      return Database;
    if (
      lowerLabel.includes('auth') ||
      lowerLabel.includes('security') ||
      lowerLabel.includes('shield')
    )
      return ShieldCheck;
    if (lowerLabel.includes('client') || lowerLabel.includes('app') || lowerLabel.includes('web'))
      return Globe;
    if (
      lowerLabel.includes('gateway') ||
      lowerLabel.includes('proxy') ||
      lowerLabel.includes('lb') ||
      lowerLabel.includes('balancer')
    )
      return Server;
    if (lowerLabel.includes('fast') || lowerLabel.includes('quick') || lowerLabel.includes('cache'))
      return Zap;
    if (lowerLabel.includes('cloud') || lowerLabel.includes('aws') || lowerLabel.includes('azure'))
      return Cloud;
    return Cpu;
  };

  const getType = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('db') || lowerLabel.includes('database')) return 'Storage';
    if (lowerLabel.includes('gateway')) return 'Security';
    if (lowerLabel.includes('client') || lowerLabel.includes('app')) return 'Frontend';
    if (lowerLabel.includes('service') || lowerLabel.includes('api')) return 'Backend';
    if (lowerLabel.includes('cache')) return 'Cache';
    return 'Compute';
  };

  // First pass: collect all nodes and edges
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('graph') || cleanLine.startsWith('subgraph')) return;

    const edgeMatch = cleanLine.match(
      /([a-zA-Z0-9_-]+)(?:\[(.*?)\])?\s*--+>\s*([a-zA-Z0-9_-]+)(?:\[(.*?)\])?/
    );

    if (edgeMatch) {
      const [_, srcId, srcLabel, tgtId, tgtLabel] = edgeMatch;

      // Register nodes
      if (!nodeMap.has(srcId)) {
        nodeMap.set(srcId, { label: srcLabel || srcId, level: -1, index: nodeMap.size });
      }
      if (!nodeMap.has(tgtId)) {
        nodeMap.set(tgtId, { label: tgtLabel || tgtId, level: -1, index: nodeMap.size });
      }

      // Build adjacency list for hierarchical layout
      if (!adjacencyList.has(srcId)) adjacencyList.set(srcId, []);
      adjacencyList.get(srcId)!.push(tgtId);

      edges.push({
        id: `e-${srcId}-${tgtId}-${index}`,
        source: srcId,
        target: tgtId,
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        animated: srcId.toLowerCase().includes('client'),
      });
    }
  });

  // Calculate hierarchical levels using BFS
  const calculateLevels = () => {
    // Find root nodes (nodes with no incoming edges)
    const incomingCount = new Map<string, number>();
    nodeMap.forEach((_, id) => incomingCount.set(id, 0));

    edges.forEach((edge) => {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    });

    const roots = Array.from(nodeMap.keys()).filter((id) => incomingCount.get(id) === 0);

    // BFS to assign levels
    const queue = roots.map((id) => ({ id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const nodeData = nodeMap.get(id)!;
      nodeData.level = Math.max(nodeData.level, level);

      const children = adjacencyList.get(id) || [];
      children.forEach((childId) => {
        queue.push({ id: childId, level: level + 1 });
      });
    }

    // Assign level 0 to any unvisited nodes
    nodeMap.forEach((data, id) => {
      if (data.level === -1) data.level = 0;
    });
  };

  calculateLevels();

  // Create nodes with hierarchical positioning
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
      position: {
        x: countAtLevel * HORIZONTAL_SPACING + 100,
        y: level * VERTICAL_SPACING + 100,
      },
      data: {
        label: data.label,
        type: getType(data.label),
        icon: getIcon(data.label),
      },
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
  const { getNodes, getEdges } = useReactFlow();
  const { whiteboardData, setWhiteboardData } = useDesignStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const flowWrapper = useRef<HTMLDivElement>(null);

  // Load state from store or parse Mermaid
  useEffect(() => {
    const savedData = whiteboardData[`${projectId}_${type}`];
    if (savedData) {
      setNodes(savedData.nodes || []);
      setEdges(savedData.edges || []);
    } else if (initialMermaid) {
      const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(initialMermaid);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    }
  }, [initialMermaid, projectId, type, setNodes, setEdges, whiteboardData]);

  // Internal save whenever items change (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      if (currentNodes.length > 0) {
        setWhiteboardData(projectId, type, { nodes: currentNodes, edges: currentEdges });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, getNodes, getEdges, projectId, type, setWhiteboardData]);

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
      toPng(flowWrapper.current, {
        filter: (node) => {
          if (
            node?.classList?.contains('react-flow__controls') ||
            node?.classList?.contains('react-flow__minimap')
          ) {
            return false;
          }
          return true;
        },
        backgroundColor: '#0a0a0a',
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `system-design-${type}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div
      className="bg-background relative flex h-full w-full flex-col overflow-hidden"
      ref={flowWrapper}
    >
      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
        <div className="bg-card/90 border-border flex rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => addNode('Service', 'New API', Terminal)}
            className="hover:bg-primary/10 text-muted-foreground hover:text-primary group flex items-center gap-2 rounded-xl p-3 px-4 transition-all"
          >
            <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-[10px] font-black tracking-widest uppercase">Add Node</span>
          </button>
          <div className="bg-border mx-1 w-px" />
          <button
            onClick={downloadImage}
            className="hover:bg-primary/5 text-muted-foreground hover:text-primary flex items-center gap-2 rounded-xl p-3 px-4 transition-all"
          >
            <ImageIcon size={18} />
            <span className="text-[10px] font-black tracking-widest uppercase">Export PNG</span>
          </button>
        </div>

        <div className="bg-card/90 border-border animate-in fade-in slide-in-from-left-6 flex w-56 flex-col gap-4 rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl duration-700">
          <div className="border-border mb-1 flex items-center gap-2 border-b pb-3">
            <Layers size={14} className="text-primary" />
            <h4 className="text-muted-foreground/80 text-[10px] font-black tracking-[0.2em] uppercase">
              Stack Blocks
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <TemplateButton
              onClick={() => addNode('Database', 'Redis Cache', Zap)}
              icon={Zap}
              label="Redis Cache"
              color="text-red-500"
            />
            <TemplateButton
              onClick={() => addNode('Infra', 'K8s Cluster', Cloud)}
              icon={Cloud}
              label="K8s Cluster"
              color="text-blue-500"
            />
            <TemplateButton
              onClick={() => addNode('Database', 'Postgres', Database)}
              icon={Database}
              label="Postgres DB"
              color="text-amber-500"
            />
            <TemplateButton
              onClick={() => addNode('Server', 'Node.js API', Server)}
              icon={Server}
              label="Node.js API"
              color="text-emerald-500"
            />
            <TemplateButton
              onClick={() => addNode('Security', 'Auth Service', ShieldCheck)}
              icon={ShieldCheck}
              label="Auth Service"
              color="text-indigo-500"
            />
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
      className="hover:bg-muted/50 text-muted-foreground hover:text-foreground group hover:border-border/50 flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-all"
    >
      <div
        className={`bg-card border-border rounded-lg border p-2 shadow-sm transition-all duration-300 group-hover:scale-110 ${color}`}
      >
        <Icon size={14} />
      </div>
      <span className="text-[11px] font-bold tracking-tight">{label}</span>
    </button>
  );
}
