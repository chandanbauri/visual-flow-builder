import { useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    BackgroundVariant,
    SelectionMode,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '../store/useFlowStore';
import { FlowStepNode } from './FlowStepNode';
import { LabeledEdge } from './LabeledEdge';
import { Upload, Layout, Cpu, Database, Share2, GitBranch, LogIn, LogOut, Filter } from 'lucide-react';
import styles from './FlowCanvas.module.css';

const nodeTypes = {
    flowStep: FlowStepNode,
};

const edgeTypes = {
    labeled: LabeledEdge,
};

export function FlowCanvas() {
    const { fitView } = useReactFlow();
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        selectNode,
        selectEdge,
        setNodes,
        setEdges,
        autoLayout,
    } = useFlowStore();

    const onNodeClick = useCallback((_: any, node: any) => {
        selectNode(node.id);
    }, [selectNode]);

    const onEdgeClick = useCallback((_: any, edge: any) => {
        selectEdge(edge.id);
    }, [selectEdge]);

    const onPaneClick = useCallback(() => {
        selectNode(null);
        selectEdge(null);
    }, [selectNode, selectEdge]);

    const onAutoLayout = useCallback(() => {
        autoLayout();
        setTimeout(() => fitView({ duration: 800 }), 50);
    }, [autoLayout, fitView]);

    const onImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target?.result as string);
                        if (data.nodes) {
                            const newNodes = data.nodes.map((n: any, i: number) => ({
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

                            const newEdges: any[] = [];
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

                            setNodes(newNodes);
                            setEdges(newEdges);
                            setTimeout(() => fitView({ duration: 800 }), 50);
                        }
                    } catch (err) {
                        alert('Invalid JSON format');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className={styles.wrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                selectionMode={SelectionMode.Partial}
                className={styles.flow}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
                <Controls showInteractive={false} className={styles.controls} />
                <MiniMap
                    nodeStrokeWidth={3}
                    maskColor="rgba(0,0,0,0.5)"
                    className={styles.minimap}
                    position="top-left"
                    nodeColor={(node) => (node.data as any).isStartNode ? '#10b981' : '#2d313d'}
                />

                <Panel position="top-right" className={styles.panel}>
                    <div className={styles.toolLabel}>Add New Step:</div>
                    <div className={styles.buttonGroup}>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'llm')} title="AI Logic">
                            <Cpu size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'source')} title="Database">
                            <Database size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'knowledge')} title="Knowledge">
                            <Share2 size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'condition')} title="Branch">
                            <GitBranch size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'input')} title="Entry">
                            <LogIn size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'output')} title="Exit">
                            <LogOut size={18} />
                        </button>
                        <button className={styles.toolIconBtn} onClick={() => addNode({ x: 100, y: 100 }, 'filter')} title="Filter">
                            <Filter size={18} />
                        </button>
                    </div>

                    <div className={styles.divider} />

                    <button className={styles.secondaryBtn} onClick={onAutoLayout}>
                        <Layout size={18} />
                        Organize Flow
                    </button>
                    <button className={styles.secondaryBtn} onClick={onImport}>
                        <Upload size={18} />
                        Load File
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}
