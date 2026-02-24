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
import { FaMapMarkedAlt, FaRocket, FaCheckCircle, FaLock, FaBook, FaTimes, FaTrophy, FaArrowRight, FaClock, FaLink, FaYoutube } from 'react-icons/fa';

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
            <div className="tailor-hero fade-in">
                <div className="tailor-hero-content">
                    <div className="tailor-hero-icon"><FaMapMarkedAlt /></div>
                    <div>
                        <h2>Career Roadmap</h2>
                        <p>Get an AI-generated, step-by-step career path from your current role to your dream job — complete with milestones, time estimates, and curated learning resources.</p>
                    </div>
                </div>
                <div className="roadmap-features">
                    <div className="roadmap-feature-item">
                        <FaRocket className="roadmap-feature-icon" />
                        <span>Interactive visual roadmap</span>
                    </div>
                    <div className="roadmap-feature-item">
                        <FaClock className="roadmap-feature-icon" />
                        <span>Time estimates per milestone</span>
                    </div>
                    <div className="roadmap-feature-item">
                        <FaBook className="roadmap-feature-icon" />
                        <span>Curated resources & guides</span>
                    </div>
                    <div className="roadmap-feature-item">
                        <FaTrophy className="roadmap-feature-icon" />
                        <span>Track your progress</span>
                    </div>
                </div>
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

            {/* Detailed Roadmap Section */}
            {generated && (
                <div className="roadmap-details-section fade-in" style={{ marginTop: '4rem', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: '20px',
                        top: '60px',
                        bottom: '20px',
                        width: '2px',
                        background: 'linear-gradient(to bottom, var(--electric), var(--obsidian-deep))',
                        zIndex: 0
                    }}></div>

                    <h3 style={{
                        borderBottom: '2px solid var(--electric)',
                        paddingBottom: '0.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <FaMapMarkedAlt /> Your Journey Step-by-Step
                    </h3>

                    <div className="roadmap-steps" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {nodes.map((node, index) => (
                            <div key={node.id}
                                className={`roadmap-step-container stagger-${Math.min(index + 1, 5)}`}
                                style={{
                                    display: 'flex',
                                    gap: '1.5rem',
                                    position: 'relative',
                                    animation: 'slideInRight 0.5s ease-out forwards',
                                    animationDelay: `${index * 0.1}s`,
                                    opacity: 0 // Start invisible for animation
                                }}
                            >
                                {/* Timeline Node Indicator */}
                                <div style={{
                                    minWidth: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: node.data.status === 'completed' ? 'var(--status-success)' : node.data.status === 'active' ? 'var(--electric)' : 'var(--obsidian-elevated)',
                                    border: `2px solid ${node.data.status === 'active' ? 'var(--electric-bright)' : 'var(--obsidian-border)'}`,
                                    boxShadow: node.data.status === 'active' ? '0 0 15px var(--electric-glow)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1,
                                    color: node.data.status === 'active' || node.data.status === 'completed' ? 'var(--obsidian-deep)' : 'var(--text-muted)',
                                    fontWeight: 'bold'
                                }}>
                                    {node.data.status === 'completed' ? <FaCheckCircle /> : index + 1}
                                </div>

                                {/* Content Card */}
                                <div className={`roadmap-step-card card ${node.data.status}`}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(24, 24, 31, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid var(--obsidian-border)',
                                        borderLeft: `4px solid ${node.data.status === 'completed' ? 'var(--status-success)' : node.data.status === 'active' ? 'var(--electric)' : 'var(--obsidian-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.borderColor = 'var(--electric)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'var(--obsidian-border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div className="step-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--obsidian-border-subtle)', paddingBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: node.data.status === 'active' ? 'var(--electric)' : 'var(--text-primary)' }}>
                                            {node.data.label}
                                        </h4>
                                        <span className="step-duration" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', background: 'var(--obsidian-deep)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                                            <FaClock style={{ marginRight: '6px', color: 'var(--warm)' }} /> {node.data.estimatedTime}
                                        </span>
                                    </div>

                                    <div className="step-body">
                                        <p style={{ marginBottom: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{node.data.description}</p>

                                        {node.data.resources && node.data.resources.length > 0 && (
                                            <div className="step-resources" style={{ background: 'var(--obsidian-deep)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                                <strong style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9em', color: 'var(--electric-bright)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <FaBook style={{ marginRight: '8px' }} /> Recommended Resources
                                                </strong>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                                                    {node.data.resources.map((res, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    color: 'var(--text-primary)',
                                                                    textDecoration: 'none',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '6px 8px',
                                                                    borderRadius: '4px',
                                                                    transition: 'background 0.2s',
                                                                    flex: 1
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--obsidian-elevated)'; e.currentTarget.style.color = 'var(--electric)'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                            >
                                                                <FaLink style={{ marginRight: '8px', fontSize: '0.8em', opacity: 0.7, flexShrink: 0 }} /> {res.title}
                                                            </a>
                                                            {res.platform && (
                                                                <span style={{
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 700,
                                                                    padding: '2px 8px',
                                                                    borderRadius: '20px',
                                                                    whiteSpace: 'nowrap',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    color: res.platform === 'Coursera' ? '#0056d2' : res.platform === 'Udemy' ? '#a435f0' : res.platform === 'freeCodeCamp' ? '#0a0a23' : '#83d0f2',
                                                                    background: res.platform === 'Coursera' ? 'rgba(0, 86, 210, 0.12)' : res.platform === 'Udemy' ? 'rgba(164, 53, 240, 0.12)' : res.platform === 'freeCodeCamp' ? 'rgba(10, 10, 35, 0.15)' : 'rgba(131, 208, 242, 0.12)',
                                                                    border: `1px solid ${res.platform === 'Coursera' ? 'rgba(0, 86, 210, 0.25)' : res.platform === 'Udemy' ? 'rgba(164, 53, 240, 0.25)' : res.platform === 'freeCodeCamp' ? 'rgba(10, 10, 35, 0.25)' : 'rgba(131, 208, 242, 0.25)'}`
                                                                }}>{res.platform}</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Separate Videos Section */}
                                        {node.data.videos && node.data.videos.length > 0 && (
                                            <div className="step-resources" style={{ background: 'var(--obsidian-deep)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '0.8rem' }}>
                                                <strong style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9em', color: '#ff4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <FaYoutube style={{ marginRight: '8px' }} /> Video Tutorials
                                                </strong>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                                                    {node.data.videos.map((vid, i) => (
                                                        <li key={i}>
                                                            <a href={vid.url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    color: 'var(--text-primary)',
                                                                    textDecoration: 'none',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '6px',
                                                                    borderRadius: '4px',
                                                                    transition: 'background 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 68, 68, 0.08)'; e.target.style.color = '#ff4444'; }}
                                                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-primary)'; }}
                                                            >
                                                                <FaYoutube style={{ marginRight: '8px', fontSize: '0.9em', color: '#ff4444', flexShrink: 0 }} /> {vid.title}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* Node Details Modal */}
            {
                selectedNode && (
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
                                            <li key={i} style={{ marginBottom: '6px' }}>
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                                    {res.title} <FaArrowRight style={{ fontSize: '0.7em', marginLeft: '5px' }} />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Separate Videos Section in Modal */}
                                {selectedNode.data.videos && selectedNode.data.videos.length > 0 && (
                                    <div className="resources-section" style={{ marginTop: '1rem' }}>
                                        <h4 style={{ color: '#ff4444' }}><FaYoutube /> Video Tutorials</h4>
                                        <ul>
                                            {selectedNode.data.videos.map((vid, i) => (
                                                <li key={i} style={{ marginBottom: '6px' }}>
                                                    <a href={vid.url} target="_blank" rel="noopener noreferrer" className="resource-link" style={{ color: 'var(--text-primary)' }}>
                                                        {vid.title} <FaArrowRight style={{ fontSize: '0.7em', marginLeft: '5px' }} />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                )
            }
        </div >
    );
}

export default CareerRoadmap;
