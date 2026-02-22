import {
    BaseEdge,
    EdgeLabelRenderer,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { getBezierPath } from '@xyflow/react';
import styles from './LabeledEdge.module.css';

export function LabeledEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    selected,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                path={edgePath}
                className={`${styles.edge} ${selected ? styles.selected : ''}`}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className={styles.labelContainer}
                >
                    <div className={styles.label}>
                        {label || 'Transition'}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
