/*
 * Copyright (c) 2025 VaporScan. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CrawlPage } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LinkGraphProps {
  pages: Map<string, CrawlPage>;
  targetUrl: string;
  maxNodes?: number;
}

interface PageNodeData {
  label: string;
  url: string;
  status: number;
  incomingCount: number;
  outgoingCount: number;
  isOrphaned: boolean;
  isBroken: boolean;
  incomingLinks: string[];
  outgoingLinks: string[];
  dimmed?: boolean;
}

const getNodeColor = (status: number, isOrphaned: boolean): string => {
  if (isOrphaned) return '#f59e0b'; // Orange for orphaned
  if (status >= 400) return '#ef4444'; // Red for errors
  if (status >= 300) return '#eab308'; // Yellow for redirects
  return '#22c55e'; // Green for success
};

const PageNode = ({ data }: { data: PageNodeData }) => {
  const bgColor = getNodeColor(data.status, data.isOrphaned);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className="px-3 py-2 rounded-lg shadow-lg border-2 min-w-[120px] max-w-[200px] transition-opacity duration-200"
            style={{
              backgroundColor: bgColor,
              borderColor: data.isBroken ? '#ef4444' : bgColor,
              opacity: data.dimmed ? 0.2 : 1,
            }}
          >
            <div className="text-xs font-semibold text-white truncate" title={data.url}>
              {data.label}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-white/80">
              <span>In: {data.incomingCount}</span>
              <span>Out: {data.outgoingCount}</span>
            </div>
            <div className="text-[10px] mt-1 text-white/90 font-medium">Status: {data.status}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="w-80 p-0 z-[10000]"
          side="right"
          sideOffset={15}
          collisionPadding={20}
        >
          <div className="flex flex-col h-full max-h-[400px]">
            <div className="p-3 border-b bg-muted/50">
              <h4 className="font-semibold text-xs break-all leading-tight">{data.url}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Status: {data.status}</p>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-rows-2 h-full">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-xs">Referenced By</h5>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                      {data.incomingLinks.length}
                    </span>
                  </div>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {data.incomingLinks.map((link) => (
                        <div
                          key={link}
                          className="text-[10px] text-muted-foreground truncate hover:text-foreground transition-colors"
                        >
                          {link}
                        </div>
                      ))}
                      {data.incomingLinks.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          No incoming links
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-xs">References to</h5>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                      {data.outgoingLinks.length}
                    </span>
                  </div>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {data.outgoingLinks.map((link) => (
                        <div
                          key={link}
                          className="text-[10px] text-muted-foreground truncate hover:text-foreground transition-colors"
                        >
                          {link}
                        </div>
                      ))}
                      {data.outgoingLinks.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          No outgoing links
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const nodeTypes: NodeTypes = {
  pageNode: PageNode,
};

export const LinkGraph = ({ pages, targetUrl, maxNodes = 100 }: LinkGraphProps) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'orphaned' | 'broken'>('all');

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Build incoming link map
  const incomingLinkMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    pages.forEach((page) => {
      page.internalLinks.forEach((link) => {
        if (!map.has(link)) {
          map.set(link, new Set());
        }
        map.get(link)!.add(page.url);
      });
    });

    return map;
  }, [pages]);

  // Generate nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<PageNodeData>[] = [];
    const edges: Edge[] = [];
    const processedUrls = new Set<string>();

    // Get URL path for label
    const getLabel = (url: string): string => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname === '/' ? '/' : parsedUrl.pathname.slice(0, 30);
      } catch {
        return url.slice(0, 30);
      }
    };

    // Filter pages based on selection
    let filteredPages = Array.from(pages.entries());

    if (selectedFilter === 'orphaned') {
      filteredPages = filteredPages.filter(([url]) => {
        const incomingCount = incomingLinkMap.get(url)?.size || 0;
        return incomingCount === 0;
      });
    } else if (selectedFilter === 'broken') {
      filteredPages = filteredPages.filter(([, page]) => page.status >= 400);
    }

    // Limit nodes for performance
    const limitedPages = showAll ? filteredPages : filteredPages.slice(0, maxNodes);

    // Create nodes in a grid layout
    const cols = Math.ceil(Math.sqrt(limitedPages.length));

    limitedPages.forEach(([url, page], index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const incomingCount = incomingLinkMap.get(url)?.size || 0;
      const isOrphaned = incomingCount === 0 && url !== targetUrl;

      nodes.push({
        id: url,
        type: 'pageNode',
        position: { x: col * 250, y: row * 120 },
        data: {
          label: getLabel(url),
          url,
          status: page.status,
          incomingCount,
          outgoingCount: page.internalLinks.length,
          isOrphaned,
          isBroken: page.status >= 400,
          incomingLinks: Array.from(incomingLinkMap.get(url) || []),
          outgoingLinks: page.internalLinks,
          dimmed: false,
        },
      });

      processedUrls.add(url);
    });

    // Create edges for internal links
    limitedPages.forEach(([url, page]) => {
      page.internalLinks.forEach((link) => {
        if (processedUrls.has(link)) {
          edges.push({
            id: `${url}-${link}`,
            source: url,
            target: link,
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 1 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#64748b',
              width: 15,
              height: 15,
            },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [pages, incomingLinkMap, targetUrl, showAll, maxNodes, selectedFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges when initial data changes due to filters
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle hover effects
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (!hoveredNodeId) {
          return { ...node, data: { ...node.data, dimmed: false } };
        }

        const isHovered = node.id === hoveredNodeId;

        // Check connectivity using the stable pages data instead of edges state to avoid loops
        const hoveredPage = pages.get(hoveredNodeId);
        const nodePage = pages.get(node.id);

        let isNeighbor = false;

        if (hoveredPage && nodePage) {
          // Is Hovered -> Node?
          if (hoveredPage.internalLinks.includes(node.id)) isNeighbor = true;
          // Is Node -> Hovered?
          if (nodePage.internalLinks.includes(hoveredNodeId)) isNeighbor = true;
        }

        return {
          ...node,
          data: {
            ...node.data,
            dimmed: !isHovered && !isNeighbor,
          },
        };
      })
    );

    setEdges((eds) =>
      eds.map((edge) => {
        if (!hoveredNodeId) {
          return {
            ...edge,
            style: { stroke: '#64748b', strokeWidth: 1, opacity: 1 },
            animated: false,
            zIndex: 0,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#64748b',
            },
          };
        }

        const isConnected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;

        if (isConnected) {
          const isOutgoing = edge.source === hoveredNodeId;
          const color = isOutgoing ? '#3b82f6' : '#a855f7'; // Blue for outgoing, Purple for incoming

          return {
            ...edge,
            style: {
              stroke: color,
              strokeWidth: 2,
              opacity: 1,
            },
            animated: true,
            zIndex: 10,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: color,
            },
          };
        }

        return {
          ...edge,
          style: { stroke: '#64748b', strokeWidth: 1, opacity: 0.1 },
          animated: false,
          zIndex: 0,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
            opacity: 0.1,
          },
        };
      })
    );
  }, [hoveredNodeId, setNodes, setEdges, pages]);

  // Reset view when filters change
  const handleFilterChange = useCallback((filter: 'all' | 'orphaned' | 'broken') => {
    setSelectedFilter(filter);
  }, []);

  if (pages.size === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border border-border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No pages to visualize</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
          >
            All Pages ({pages.size})
          </Button>
          <Button
            variant={selectedFilter === 'orphaned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('orphaned')}
          >
            Orphaned
          </Button>
          <Button
            variant={selectedFilter === 'broken' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('broken')}
          >
            Broken
          </Button>
        </div>

        {!showAll && pages.size > maxNodes && (
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show All ({pages.size} pages)
          </Button>
        )}
      </div>

      <div className="h-[600px] border border-border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as PageNodeData;
              return getNodeColor(data.status, data.isOrphaned);
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Success (2xx)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Redirect (3xx)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Orphaned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Error (4xx/5xx)</span>
        </div>
      </div>
    </div>
  );
};

export default LinkGraph;
