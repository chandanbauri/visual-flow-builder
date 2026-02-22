import { create } from 'zustand';
import type {
    Connection,
    Edge,
    Node,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    NodeChange,
    EdgeChange,
} from '@xyflow/react';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import dagre from 'dagre';

export type NodeType = 'llm' | 'source' | 'knowledge' | 'condition' | 'input' | 'output' | 'filter';

export interface FlowNodeData extends Record<string, unknown> {
    label: string;
    description: string;
    isStartNode: boolean;
    prompt: string;
    nodeType: NodeType;
}

export type CustomNode = Node<FlowNodeData>;

interface FlowState {
    nodes: CustomNode[];
    edges: Edge[];
    selectedNodeId: string | null;
    selectedEdgeId: string | null;

    onNodesChange: OnNodesChange<CustomNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    setNodes: (nodes: CustomNode[]) => void;
    setEdges: (edges: Edge[]) => void;

    addNode: (position: { x: number; y: number }, type?: NodeType) => void;
    updateNode: (id: string, data: Partial<FlowNodeData>) => void;
    deleteNode: (id: string) => void;

    updateEdge: (id: string, label: string) => void;
    deleteEdge: (id: string) => void;

    selectNode: (id: string | null) => void;
    selectEdge: (id: string | null) => void;

    setStartNode: (id: string) => void;

    errors: Record<string, string[]>;
    validate: () => boolean;
    autoLayout: () => void;
    loadFromJSON: (json: string) => boolean;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 150;

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [
        {
            id: 'start-node',
            type: 'flowStep',
            position: { x: 250, y: 150 },
            data: {
                label: 'Start Node',
                description: 'Initial entry point of the flow.',
                isStartNode: true,
                prompt: 'Welcome! How can I help you today?',
                nodeType: 'llm',
            },
        },
    ],
    edges: [],
    selectedNodeId: null,
    selectedEdgeId: null,
    errors: {},

    onNodesChange: (changes: NodeChange<CustomNode>[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        const newEdge: Edge = {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            label: 'New Transition',
            type: 'labeled',
        };
        set({
            edges: addEdge(newEdge, get().edges),
        });
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    addNode: (position, type = 'llm') => {
        const id = `node_${Math.random().toString(36).substr(2, 9)}`;
        const newNode: CustomNode = {
            id,
            type: 'flowStep',
            position,
            data: {
                label: `${type.toUpperCase()} Step ${get().nodes.length + 1}`,
                description: type === 'llm' ? 'Processes information using a language model.' :
                    type === 'source' ? 'Collects data from a specified source.' :
                        type === 'knowledge' ? 'Retrieves information from knowledge base.' :
                            type === 'condition' ? 'Evaluates logic to branch the flow.' :
                                'Perform specialized operations.',
                isStartNode: false,
                prompt: '',
                nodeType: type,
            },
        };
        set({ nodes: [...get().nodes, newNode] });
    },

    updateNode: (id, data) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        });
    },

    deleteNode: (id) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== id),
            edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
            selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
        });
    },

    updateEdge: (id, label) => {
        set({
            edges: get().edges.map((edge) =>
                edge.id === id ? { ...edge, label } : edge
            ),
        });
    },

    deleteEdge: (id) => {
        set({
            edges: get().edges.filter((edge) => edge.id !== id),
            selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
        });
    },

    selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
    selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

    setStartNode: (id) => {
        const { nodes, edges, autoLayout } = get();

        const newNodes = nodes.map((node) => ({
            ...node,
            data: { ...node.data, isStartNode: node.id === id },
        }));

        const newEdges = edges.map((edge) => {
            if (edge.target === id) {
                return {
                    ...edge,
                    source: edge.target,
                    target: edge.source,
                };
            }
            return edge;
        });

        set({ nodes: newNodes, edges: newEdges });

        setTimeout(() => autoLayout(), 50);
    },

    validate: () => {
        const { nodes, edges } = get();
        const errors: Record<string, string[]> = {};

        const ids = nodes.map(n => n.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.global = errors.global || [];
            errors.global.push(`Duplicate Node IDs found: ${duplicates.join(', ')}`);
        }

        const hasStartNode = nodes.some(n => n.data.isStartNode);
        if (!hasStartNode && nodes.length > 0) {
            errors.global = errors.global || [];
            errors.global.push('No starting node designated.');
        }

        nodes.forEach(node => {
            const nodeErrors: string[] = [];
            if (!node.data.description || node.data.description.trim() === '') {
                nodeErrors.push('Description is required');
            }
            if (nodeErrors.length > 0) {
                errors[node.id] = nodeErrors;
            }
        });

        const connectedNodes = new Set<string>();
        edges.forEach(edge => {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        });

        nodes.forEach(node => {
            if (!connectedNodes.has(node.id) && nodes.length > 1) {
                errors[node.id] = errors[node.id] || [];
                errors[node.id].push('Node is disconnected');
            }
        });

        set({ errors });
        return Object.keys(errors).length === 0;
    },

    autoLayout: () => {
        const { nodes, edges } = get();
        dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

        const startNode = nodes.find(n => n.data.isStartNode);

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        });

        edges.forEach((edge) => {
            if (startNode && edge.target === startNode.id) return;
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const newNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                },
            };
        });

        set({ nodes: newNodes });
    },

    loadFromJSON: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.nodes) return false;

            const newNodes: CustomNode[] = data.nodes.map((n: any, i: number) => ({
                id: n.id,
                type: 'flowStep',
                position: { x: 100 + (i * 250) % 800, y: 100 + Math.floor(i / 3) * 200 },
                data: {
                    label: n.label || n.name || n.id,
                    description: n.description || '',
                    prompt: n.prompt || '',
                    nodeType: n.node_type || n.nodeType || 'llm',
                    isStartNode: data.metadata?.start_node_id ? n.id === data.metadata.start_node_id : i === 0,
                }
            }));

            const newEdges: Edge[] = [];
            data.nodes.forEach((n: any) => {
                if (n.edges) {
                    n.edges.forEach((e: any) => {
                        newEdges.push({
                            id: `e-${n.id}-${e.to_node_id}-${Date.now()}`,
                            source: n.id,
                            target: e.to_node_id,
                            label: e.condition || 'Transition',
                            type: 'labeled',
                        });
                    });
                }
            });

            set({ nodes: newNodes, edges: newEdges });
            get().autoLayout();
            return true;
        } catch (e) {
            return false;
        }
    }
}));
