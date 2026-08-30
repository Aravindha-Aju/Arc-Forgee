'use client';
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

export default function InteractiveGraph({ assetId, assetName, upstream, downstream, riskScore }: any) {
  const { nodes, edges } = useMemo(() => {
    const nodesList: any[] = [];
    const edgesList: any[] = [];

    nodesList.push({ id: 'internet', type: 'default', position: { x: 250, y: 0 }, data: { label: <div style={{padding: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-heading)'}}><div style={{fontSize: '0.7rem', color: '#666'}}>EXTERNAL</div><div style={{fontWeight: 'bold'}}>INTERNET</div></div> }, style: { border: '3px solid #111', background: '#fff', padding: '0.5rem', boxShadow: '4px 4px 0 #111' } });

    upstream.forEach((id: string, i: number) => {
      nodesList.push({ id, type: 'default', position: { x: 100 + i * 150, y: 150 }, data: { label: <div style={{padding: '0.5rem', textAlign: 'center'}}><div style={{fontSize: '0.7rem', color: '#666'}}>DEPENDS_ON</div><div style={{fontWeight: 'bold', fontSize: '0.85rem'}}>{id}</div></div> }, style: { border: '3px solid var(--accent-yellow)', background: '#fffdf0', padding: '0.5rem', boxShadow: '4px 4px 0 #111' } });
      edgesList.push({ id: `e-internet-${id}`, source: 'internet', target: id, animated: true, style: { stroke: '#111', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } });
      edgesList.push({ id: `e-${id}-${assetId}`, source: id, target: assetId, animated: true, style: { stroke: '#111', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    nodesList.push({ id: assetId, type: 'default', position: { x: 250, y: 300 }, data: { label: <div style={{padding: '0.8rem', textAlign: 'center'}}><div style={{fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 'bold'}}>RISK: {riskScore}</div><div style={{fontWeight: 'bold', fontSize: '1rem', marginTop: '0.3rem'}}>{assetName}</div></div> }, style: { border: '4px solid var(--accent-red)', background: '#fff0f0', padding: '0.8rem', boxShadow: '6px 6px 0 var(--accent-red)', minWidth: '180px' } });

    if (upstream.length === 0) {
      edgesList.push({ id: `e-internet-${assetId}`, source: 'internet', target: assetId, animated: true, style: { stroke: '#111', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } });
    }

    downstream.forEach((id: string, i: number) => {
      nodesList.push({ id, type: 'default', position: { x: 100 + i * 150, y: 480 }, data: { label: <div style={{padding: '0.5rem', textAlign: 'center'}}><div style={{fontSize: '0.7rem', color: 'var(--accent-red)'}}>IMPACTED</div><div style={{fontWeight: 'bold', fontSize: '0.85rem'}}>{id}</div></div> }, style: { border: '3px solid var(--accent-red)', background: '#fff0f0', padding: '0.5rem', boxShadow: '4px 4px 0 #111' } });
      edgesList.push({ id: `e-${assetId}-${id}`, source: assetId, target: id, animated: true, style: { stroke: 'var(--accent-red)', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [assetId, assetName, upstream, downstream, riskScore]);

  return (
    <div style={{width: '100%', height: '500px', border: '3px solid #111', background: '#fff', boxShadow: '6px 6px 0 #111', borderRadius: '4px', overflow: 'hidden'}}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView 
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true} 
        nodesConnectable={false} 
        panOnDrag={true}
        zoomOnScroll={true}
        panOnScroll={true}
        preventScrolling={false}
        minZoom={0.2} 
        maxZoom={2}
      >
        <Background color="#ddd" gap={20} />
        <Controls />
        <MiniMap nodeColor={(n: any) => n.id === assetId ? 'var(--accent-red)' : downstream.includes(n.id) ? 'var(--accent-red)' : upstream.includes(n.id) ? 'var(--accent-yellow)' : '#111'} maskColor="rgba(0,0,0,0.1)" />
      </ReactFlow>
    </div>
  );
}
