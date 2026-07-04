import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Download } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useStoredNotes, type StoredNote } from '@/lib/notesStore';
import { Link } from 'react-router-dom';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  color: string;
  size: number;
  tags: string[];
  preview: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// Stable color per tag
const TAG_PALETTE = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7', '#14b8a6'];
function colorForTag(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

function extractTags(n: StoredNote): string[] {
  if (Array.isArray(n.tags) && n.tags.length) return n.tags.map(String);
  // fallback: parse #hashtags from content
  const text = `${n.title ?? ''} ${n.content ?? ''}`;
  const found = text.match(/#[\w-]+/g) ?? [];
  return [...new Set(found.map((t) => t.slice(1).toLowerCase()))];
}

function buildGraph(notes: StoredNote[]): { nodes: GraphNode[]; links: GraphLink[]; tags: string[] } {
  const nodes: GraphNode[] = notes.map((n) => {
    const tags = extractTags(n);
    return {
      id: n.id,
      label: n.title || (n.content ?? '').slice(0, 40) || 'Untitled',
      color: colorForTag(tags[0] ?? 'untagged'),
      size: 8 + Math.min(12, ((n.content ?? '').length / 200)),
      tags,
      preview: (n.content ?? '').slice(0, 180),
    };
  });

  // Links: any two notes sharing a tag are connected
  const links: GraphLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].tags.filter((t) => nodes[j].tags.includes(t));
      if (shared.length > 0) links.push({ source: nodes[i].id, target: nodes[j].id });
    }
  }

  const tags = [...new Set(nodes.flatMap((n) => n.tags))];
  return { nodes, links, tags };
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const notes = useStoredNotes();
  const { nodes: graphNodes, links: graphLinks, tags: allTags } = useMemo(
    () => buildGraph(notes),
    [notes],
  );

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    svg.selectAll('*').remove();

    if (graphNodes.length === 0) return;

    const container = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => container.attr('transform', event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);

    const defs = svg.append('defs');
    graphNodes.forEach((node) => {
      const grad = defs.append('radialGradient')
        .attr('id', `grad-${node.id}`)
        .attr('cx', '30%').attr('cy', '30%').attr('r', '70%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', node.color).attr('stop-opacity', 1);
      grad.append('stop').attr('offset', '100%').attr('stop-color', node.color).attr('stop-opacity', 0.5);
    });

    const filteredNodes = activeFilter
      ? graphNodes.filter((n) => n.tags.includes(activeFilter))
      : graphNodes;
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphLinks.filter(
      (l) =>
        filteredIds.has(typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) &&
        filteredIds.has(typeof l.target === 'string' ? l.target : (l.target as GraphNode).id),
    );

    const sim = d3
      .forceSimulation<GraphNode>(filteredNodes.map((n) => ({ ...n })))
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks.map((l) => ({ ...l }))).id((d) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide((d: GraphNode) => d.size + 20));
    simRef.current = sim;

    const link = container.append('g')
      .selectAll('line')
      .data(sim.force<d3.ForceLink<GraphNode, GraphLink>>('link')!.links())
      .join('line')
      .attr('stroke', '#7c3aed55')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(sim.nodes())
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => setSelectedNode(d))
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null; d.fy = null;
          }),
      );

    nodeGroup.append('circle')
      .attr('r', (d) => d.size + 8)
      .attr('fill', (d) => d.color + '11');

    nodeGroup.append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => `url(#grad-${d.id})`)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5);

    nodeGroup.append('text')
      .text((d) => d.label.split(' ').slice(0, 3).join(' '))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.size + 16)
      .attr('font-family', '"EB Garamond", Georgia, serif')
      .attr('font-style', 'italic')
      .attr('font-size', '11px')
      .attr('fill', '#94a3b8')
      .attr('pointer-events', 'none')
      .style('display', showLabels ? 'block' : 'none');

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      nodeGroup.attr('transform', (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, [graphNodes, graphLinks, activeFilter, showLabels]);

  const zoomBy = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy as any, factor);
  };
  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.transform as any, d3.zoomIdentity);
  };

  const connectedNotes = selectedNode
    ? graphLinks
        .filter((l) => {
          const s = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const t = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          return s === selectedNode.id || t === selectedNode.id;
        })
        .map((l) => {
          const s = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const t = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          const otherId = s === selectedNode.id ? t : s;
          return graphNodes.find((n) => n.id === otherId);
        })
        .filter(Boolean) as GraphNode[]
    : [];

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-56px)] flex">
        <div className="flex-1 relative">
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ background: 'radial-gradient(ellipse at 40% 50%, hsl(263 69% 58% / 0.04) 0%, transparent 60%)' }}
          />

          {/* Header overlay */}
          <div className="absolute top-6 left-6">
            <h1 className="font-serif italic text-2xl text-foreground">Knowledge Graph</h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {graphNodes.length} {graphNodes.length === 1 ? 'node' : 'nodes'} · {graphLinks.length} {graphLinks.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>

          {/* Empty state */}
          {graphNodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 pointer-events-none">
              <div className="text-5xl">✦</div>
              <h2 className="font-serif italic text-xl text-foreground">Your graph is empty</h2>
              <p className="font-mono text-xs text-muted-foreground max-w-sm">
                Create notes with #tags. Notes sharing tags will form connections here automatically.
              </p>
              <Link
                to="/editor/new"
                className="pointer-events-auto mt-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
              >
                + New Note
              </Link>
            </div>
          )}

          {/* Controls */}
          <div
            className="absolute top-6 right-6 flex flex-col gap-2 rounded-xl p-2"
            style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
          >
            <button onClick={() => zoomBy(1.3)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
              <ZoomIn size={16} />
            </button>
            <button onClick={() => zoomBy(0.75)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
              <ZoomOut size={16} />
            </button>
            <div className="h-px" style={{ background: 'hsl(240 20% 14%)' }} />
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="p-2 rounded-lg hover:bg-white/5"
              style={{ color: showLabels ? '#a78bfa' : '#475569' }}
            >
              {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button onClick={resetZoom} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
              <RotateCcw size={16} />
            </button>
            <div className="h-px" style={{ background: 'hsl(240 20% 14%)' }} />
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
              <Download size={16} />
            </button>
          </div>

          {/* Tag filters (only when tags exist) */}
          {allTags.length > 0 && (
            <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 max-w-[70%]">
              <button
                onClick={() => setActiveFilter(null)}
                className="px-3 py-1.5 rounded-full font-mono text-xs transition-all"
                style={{
                  background: !activeFilter ? 'hsl(263 69% 58% / 0.2)' : 'hsl(240 50% 7%)',
                  color: !activeFilter ? '#a78bfa' : '#475569',
                  border: `1px solid ${!activeFilter ? 'hsl(263 69% 58% / 0.4)' : 'hsl(240 20% 14%)'}`,
                }}
              >
                All
              </button>
              {allTags.slice(0, 10).map((tag) => {
                const c = colorForTag(tag);
                const active = activeFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveFilter(active ? null : tag)}
                    className="px-3 py-1.5 rounded-full font-mono text-xs transition-all"
                    style={{
                      background: active ? c + '22' : 'hsl(240 50% 7%)',
                      color: active ? c : '#475569',
                      border: `1px solid ${active ? c + '55' : 'hsl(240 20% 14%)'}`,
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Node preview panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-80 flex-shrink-0 border-l overflow-y-auto"
              style={{ background: '#07070f', borderColor: 'hsl(240 20% 14%)' }}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Note Preview</h3>
                  <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div
                  className="w-8 h-8 rounded-full"
                  style={{ background: selectedNode.color, boxShadow: `0 0 20px ${selectedNode.color}44` }}
                />

                <h2 className="font-serif italic text-xl text-foreground leading-tight">{selectedNode.label}</h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedNode.preview || 'No preview available.'}
                </p>

                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.tags.map((tag) => {
                      const c = colorForTag(tag);
                      return (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full font-mono text-xs"
                          style={{ background: c + '22', color: c }}
                        >
                          #{tag}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: 'hsl(240 20% 14%)' }}>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Connected Notes ({connectedNotes.length})
                  </p>
                  {connectedNotes.length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground">No connections yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {connectedNotes.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => setSelectedNode(n)}
                          className="w-full flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-white/5 text-left"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                          <span className="font-mono text-xs text-muted-foreground truncate">{n.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to={`/editor/${selectedNode.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-mono text-sm font-semibold btn-shimmer"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
                >
                  Open Editor →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
