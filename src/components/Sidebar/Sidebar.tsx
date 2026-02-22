import { useFlowStore, type NodeType } from '../../store/useFlowStore';
import { X, Trash2, Settings, Info } from 'lucide-react';
import styles from './Sidebar.module.css';

export function Sidebar() {
    const {
        selectedNodeId,
        selectedEdgeId,
        nodes,
        edges,
        updateNode,
        deleteNode,
        updateEdge,
        deleteEdge,
        setStartNode,
        selectNode,
        selectEdge,
        errors
    } = useFlowStore();

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const selectedEdge = edges.find(e => e.id === selectedEdgeId);

    if (!selectedNode && !selectedEdge) {
        return (
            <aside className={`${styles.sidebar} glass`}>
                <div className={styles.emptyState}>
                    <Settings size={48} className={styles.emptyIcon} />
                    <h3>No Element Selected</h3>
                    <p>Click a node or edge to edit its properties.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className={`${styles.sidebar} glass`}>
            <div className={styles.header}>
                <h2>{selectedNode ? 'Edit Node' : 'Edit Edge'}</h2>
                <button className={styles.closeBtn} onClick={() => { selectNode(null); selectEdge(null); }}>
                    <X size={20} />
                </button>
            </div>

            <div className={styles.content}>
                {selectedNode && (
                    <div className={styles.section}>
                        <div className={styles.formGroup}>
                            <label>Node ID</label>
                            <input
                                type="text"
                                value={selectedNode.id}
                                disabled
                                className={styles.disabledInput}
                            />
                            <span className={styles.inputHint}>ID is unique and cannot be changed manually.</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Step Type</label>
                            <select
                                value={selectedNode.data.nodeType || 'llm'}
                                onChange={(e) => updateNode(selectedNode.id, { nodeType: e.target.value as NodeType })}
                                className={styles.selectInput}
                            >
                                <option value="llm">LLM Process</option>
                                <option value="source">Data Source</option>
                                <option value="knowledge">Knowledge Transfer</option>
                                <option value="condition">Source Condition</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Name / Label</label>
                            <input
                                type="text"
                                value={selectedNode.data.label}
                                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                                placeholder="Enter step name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description {errors[selectedNode.id]?.includes('Description is required') && <span className={styles.errorText}>*</span>}</label>
                            <textarea
                                value={selectedNode.data.description}
                                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                                placeholder="What does this step do?"
                                rows={3}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Prompt / Message</label>
                            <textarea
                                value={selectedNode.data.prompt}
                                onChange={(e) => updateNode(selectedNode.id, { prompt: e.target.value })}
                                placeholder="Message shown to user..."
                                rows={3}
                            />
                        </div>

                        <div className={styles.checkboxGroup}>
                            <div className={`${styles.statusBadge} ${selectedNode.data.isStartNode ? styles.active : ''}`}>
                                {selectedNode.data.isStartNode ? 'Active Entry' : 'Standard Step'}
                            </div>
                            <div className={styles.toggleWrapper}>
                                <input
                                    type="checkbox"
                                    id="isStartNode"
                                    checked={selectedNode.data.isStartNode}
                                    onChange={(e) => e.target.checked && setStartNode(selectedNode.id)}
                                />
                                <label htmlFor="isStartNode">Set as Start Step</label>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.deleteBtn} onClick={() => deleteNode(selectedNode.id)}>
                                <Trash2 size={16} />
                                Delete Node
                            </button>
                        </div>

                        <div className={styles.outgoingSection}>
                            <h3>Outgoing Transitions</h3>
                            {edges.filter(e => e.source === selectedNode.id).map(edge => (
                                <div key={edge.id} className={styles.edgeItem} onClick={() => selectEdge(edge.id)}>
                                    <span className={styles.edgeTarget}>To: {nodes.find(n => n.id === edge.target)?.data.label || edge.target}</span>
                                    <span className={styles.edgeLabel}>"{edge.label}"</span>
                                </div>
                            ))}
                            {edges.filter(e => e.source === selectedNode.id).length === 0 && (
                                <p className={styles.noEdges}>No outgoing edges. Drag from the bottom handle to create one.</p>
                            )}
                        </div>
                    </div>
                )}

                {selectedEdge && (
                    <div className={styles.section}>
                        <div className={styles.formGroup}>
                            <label>Transition Condition</label>
                            <input
                                type="text"
                                value={selectedEdge.label as string}
                                onChange={(e) => updateEdge(selectedEdge.id, e.target.value)}
                                placeholder="e.g. If user says yes"
                            />
                        </div>

                        <div className={styles.infoBox}>
                            <Info size={16} />
                            <span>This label appears on the connector in the canvas.</span>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.deleteBtn} onClick={() => deleteEdge(selectedEdge.id)}>
                                <Trash2 size={16} />
                                Remove Edge
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
