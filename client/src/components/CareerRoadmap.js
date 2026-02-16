import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Controls,
    Background,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import axios from 'axios';
import { FaMapMarkedAlt, FaRocket, FaCheckCircle, FaLock, FaBook, FaTimes, FaTrophy, FaArrowRight } from 'react-icons/fa';

// --- Custom Node Component ---
const MilestoneNode = ({ data }) => {
    return (
        <div className={`milestone-node ${data.status || 'locked'}`}>
            <Handle type="target" position={Position.Top} className="node-handle" />
            <div className="node-content">
                <div className="node-icon">
                    {data.status === 'completed' ? <FaCheckCircle /> :
                        data.status === 'active' ? <FaRocket /> : <FaLock />}
                </div>
                <div className="node-info">
                    <strong>{data.label}</strong>
                    <span>{data.estimatedTime}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="node-handle" />
        </div>
    );
};

// --- Graph Layout Helper ---
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Set node size for layout calculation
    const nodeWidth = 250;
    const nodeHeight = 80;

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const API_URL = 'http://localhost:5000/api';

function CareerRoadmap({ resumeData }) {
    const [currentRole, setCurrentRole] = useState(resumeData?.suggestedRoles?.[0] || '');
    const [targetRole, setTargetRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    // Custom Node Types
    const nodeTypes = useMemo(() => ({ milestoneNode: MilestoneNode }), []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGenerated(false);

        try {
            const response = await axios.post(`${API_URL}/roadmap/generate`, {
                currentRole,
                targetRole,
                currentSkills: resumeData?.skills || []
            });

            if (response.data.success) {
                const { nodes: rawNodes, edges: rawEdges } = response.data.data;

                // Process nodes to default status
                const processedNodes = rawNodes.map((node, index) => ({
                    ...node,
                    type: 'milestoneNode', // Force custom type
                    data: {
                        ...node.data,
                        status: index === 0 ? 'active' : 'locked' // First node active
                    }
                }));

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    processedNodes,
                    rawEdges
                );

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
                setGenerated(true);
            }
        } catch (error) {
            console.error("Failed to generate roadmap", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = (event, node) => {
        setSelectedNode(node);
    };

    const markComplete = () => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: { ...node.data, status: 'completed' }
                    };
                }
                return node;
            })
        );
        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, status: 'completed' } });
        // Trigger confetti or unlock next node logic here ideally
    };

    return (
        <div className="career-roadmap-page page-container">
            <div className="roadmap-header fade-in">
                <h2><FaMapMarkedAlt style={{ color: 'var(--electric)', marginRight: '10px' }} /> Career Roadmap</h2>
                <p> visualize your path from <strong>{currentRole || 'Now'}</strong> to <strong>{targetRole || 'Dream Job'}</strong></p>
            </div>

            {/* Input Section */}
            {!generated && (
                <div className="roadmap-input-section card fade-in">
                    <form onSubmit={handleGenerate} className="roadmap-form">
                        <div className="form-group">
                            <label>Current Role</label>
                            <input
                                type="text"
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value)}
                                placeholder="e.g. Junior Developer"
                                className="roadmap-input"
                            />
                        </div>
                        <div className="arrow-divider">➜</div>
                        <div className="form-group">
                            <label>Target Role (Dream Job)</label>
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                placeholder="e.g. CTO"
                                className="roadmap-input"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                            {loading ? <span className="spinner-small"></span> : <FaRocket />}
                            {loading ? ' Generating Path...' : 'Launch Roadmap'}
                        </button>
                    </form>
                </div>
            )}

            {/* Graph Visualization */}
            {generated && (
                <div className="roadmap-visual-container fade-in" style={{ height: '70vh' }}>
                    <div className="roadmap-actions-bar">
                        <button className="btn btn-outline btn-sm" onClick={() => setGenerated(false)}>
                            New Path
                        </button>
                    </div>

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#333" gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>
            )}

            {/* Node Details Modal */}
            {selectedNode && (
                <div className="node-modal-overlay" onClick={() => setSelectedNode(null)}>
                    <div className="node-modal card" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedNode(null)}><FaTimes /></button>

                        <div className="modal-header">
                            <h3>{selectedNode.data.label}</h3>
                            <span className={`status-badge ${selectedNode.data.status}`}>
                                {selectedNode.data.status}
                            </span>
                        </div>

                        <div className="modal-content">
                            <p className="description">{selectedNode.data.description}</p>

                            <div className="time-estimate">
                                <strong>Estimated Time:</strong> {selectedNode.data.estimatedTime}
                            </div>

                            <div className="resources-section">
                                <h4><FaBook /> Recommended Resources</h4>
                                <ul>
                                    {selectedNode.data.resources?.map((res, i) => (
                                        <li key={i}>
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                                {res.title} <FaArrowRight style={{ fontSize: '0.7em', marginLeft: '5px' }} />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="modal-actions">
                            {selectedNode.data.status !== 'completed' && (
                                <button className="btn btn-primary" onClick={markComplete}>
                                    <FaTrophy style={{ marginRight: '8px' }} /> Mark as Complete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CareerRoadmap;
