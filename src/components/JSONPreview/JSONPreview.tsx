import { useEffect, useState, useMemo } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import { Download, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';
import styles from './JSONPreview.module.css';

export function JSONPreview() {
    const { nodes, edges, validate, errors } = useFlowStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const flowJson = useMemo(() => {
        const formattedNodes = nodes.map(node => ({
            id: node.id,
            label: node.data.label,
            node_type: node.data.nodeType,
            description: node.data.description,
            prompt: node.data.prompt,
            edges: edges
                .filter(e => e.source === node.id)
                .map(e => ({
                    to_node_id: e.target,
                    condition: e.label as string,
                }))
        }));

        return JSON.stringify({
            nodes: formattedNodes,
            metadata: {
                start_node_id: nodes.find(n => n.data.isStartNode)?.id || null,
                total_nodes: nodes.length,
                total_edges: edges.length,
                is_valid: Object.keys(errors).length === 0
            }
        }, null, 2);
    }, [nodes, edges, errors]);

    useEffect(() => {
        validate();
    }, [nodes, edges, validate]);

    useEffect(() => {
        Prism.highlightAll();
    }, [flowJson, isExpanded]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(flowJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([flowJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flow-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasGlobalErrors = errors.global && errors.global.length > 0;
    const nodeErrorCount = Object.keys(errors).filter(k => k !== 'global').length;

    return (
        <div className={`${styles.container} ${isExpanded ? styles.expanded : ''} glass`}>
            <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.status}>
                    {Object.keys(errors).length === 0 ? (
                        <span className={styles.validStatus}>Schema Valid</span>
                    ) : (
                        <span className={styles.invalidStatus}><AlertCircle size={14} /> {nodeErrorCount + (hasGlobalErrors ? 1 : 0)} Issues found</span>
                    )}
                </div>
                <div className={styles.title}>JSON Preview</div>
                <button className={styles.expandBtn}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
            </div>

            {isExpanded && (
                <div className={styles.content}>
                    {hasGlobalErrors && (
                        <div className={styles.errorBanner}>
                            {errors.global.map((err, i) => <div key={i}>{err}</div>)}
                        </div>
                    )}

                    <div className={styles.toolbar}>
                        <button onClick={copyToClipboard} className={styles.toolBtn}>
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button onClick={downloadJson} className={styles.toolBtn}>
                            <Download size={14} />
                            Download
                        </button>
                    </div>

                    <pre className="language-json">
                        <code className="language-json">
                            {flowJson}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    );
}
