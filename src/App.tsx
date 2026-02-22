import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from './components/FlowCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { JSONPreview } from './components/JSONPreview/JSONPreview';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.container}>
      <ReactFlowProvider>
        <Sidebar />
        <main className={styles.main}>
          <FlowCanvas />
        </main>
        <JSONPreview />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
