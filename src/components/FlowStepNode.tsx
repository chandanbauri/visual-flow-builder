import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { type CustomNode, useFlowStore } from '../store/useFlowStore';
import { Play, MessageSquare, AlertCircle, Cpu, Database, Share2, GitBranch, LogIn, LogOut, Filter } from 'lucide-react';
import styles from './FlowStepNode.module.css';

export function FlowStepNode({ id, data, selected }: NodeProps<CustomNode>) {
    const errors = useFlowStore((state) => state.errors[id]);
    const hasError = errors && errors.length > 0;

    const getNodeIcon = () => {
        if (data.isStartNode) return <Play size={14} fill="currentColor" />;
        switch (data.nodeType) {
            case 'llm': return <Cpu size={14} />;
            case 'source': return <Database size={14} />;
            case 'knowledge': return <Share2 size={14} />;
            case 'condition': return <GitBranch size={14} />;
            case 'input': return <LogIn size={14} />;
            case 'output': return <LogOut size={14} />;
            case 'filter': return <Filter size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <div className={`
            ${styles.node} 
            ${styles[data.nodeType || 'llm']} 
            ${selected ? styles.selected : ''} 
            ${data.isStartNode ? styles.startNode : ''} 
            ${hasError ? styles.error : ''}
        `}>
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <div className={styles.header}>
                {getNodeIcon()}
                <span className={styles.label}>{data.label}</span>
                {data.isStartNode && <span className={styles.badge}>START</span>}
            </div>

            <div className={styles.body}>
                <p className={styles.description}>{data.description || 'No description'}</p>
                {data.prompt && (
                    <div className={styles.promptPreview}>
                        <span className={styles.promptLabel}>Prompt:</span>
                        <span className={styles.promptText}>{data.prompt}</span>
                    </div>
                )}
            </div>

            {hasError && (
                <div className={styles.errorIndicator}>
                    <AlertCircle size={14} />
                    <div className={styles.errorTooltip}>
                        {errors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

