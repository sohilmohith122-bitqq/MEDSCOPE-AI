"use client";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
export function JourneyGraph({ nodes, edges, onNode }: { nodes: Node[]; edges: Edge[]; onNode?: (id: string) => void }) {
  return (
    <div className="h-96 rounded-xl border bg-white">
      <ReactFlow nodes={nodes} edges={edges} onNodeClick={(_, n) => onNode?.(n.id)} fitView>
        <Background /><Controls />
      </ReactFlow>
    </div>
  );
}