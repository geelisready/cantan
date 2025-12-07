
import React, { useState, useEffect } from 'react';
import { GameState, ResourceType, PlayerColor, BuildingType, RESOURCE_COLORS, Port } from '../types';
import { HEX_SIZE } from '../utils/gameLogic';

interface HexBoardProps {
  gameState: GameState;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onHexClick?: (hexId: string) => void;
}

const PLAYER_COLORS_HEX: Record<PlayerColor, string> = {
  [PlayerColor.RED]: '#ef4444',
  [PlayerColor.BLUE]: '#3b82f6',
  [PlayerColor.WHITE]: '#f3f4f6',
  [PlayerColor.ORANGE]: '#f97316',
};

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
    [ResourceType.WOOD]: <path d="M12 2L4 22h16L12 2z" fill="currentColor"/>,
    [ResourceType.BRICK]: <rect x="4" y="8" width="16" height="8" fill="currentColor"/>,
    [ResourceType.SHEEP]: <circle cx="12" cy="12" r="8" fill="currentColor"/>,
    [ResourceType.WHEAT]: <path d="M12 2v20M6 8l6-6 6 6" stroke="currentColor" strokeWidth="4" />,
    [ResourceType.ORE]: <path d="M4 12l8-8 8 8-8 8z" fill="currentColor"/>,
    [ResourceType.DESERT]: <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>,
    '3:1': <text x="12" y="18" fontSize="16" fontWeight="bold" textAnchor="middle" fill="currentColor">?</text>
};

const SettlementIcon = ({ color, x, y }: { color: string, x: number, y: number }) => (
    <g transform={`translate(${x-10}, ${y-10})`}>
        <path d="M10 2 L20 10 L18 20 L2 20 L0 10 Z" fill={color} stroke="#333" strokeWidth="1.5" />
    </g>
);

const CityIcon = ({ color, x, y }: { color: string, x: number, y: number }) => (
     <g transform={`translate(${x-12}, ${y-12})`}>
        <path d="M4 22 L20 22 L20 10 L12 2 L4 10 Z M12 10 L20 10" fill={color} stroke="#333" strokeWidth="1.5" />
        <rect x="14" y="6" width="6" height="6" fill={color} stroke="#333" strokeWidth="1.5" />
    </g>
);

const RobberIcon = ({ x, y }: { x: number, y: number }) => (
    <g transform={`translate(${x-14}, ${y-18}) scale(1.2)`}>
        <circle cx="12" cy="10" r="6" fill="#1a1a1a" stroke="#fff" strokeWidth="1" />
        <path d="M6 18c0-3 3-4 6-4s6 1 6 4v2H6v-2z" fill="#1a1a1a" stroke="#fff" strokeWidth="1" />
    </g>
);

const HexBoard: React.FC<HexBoardProps> = ({ gameState, onNodeClick, onEdgeClick, onHexClick }) => {
  const offsetX = 400;
  const offsetY = 350;
  
  // Responsive ViewBox State
  const [viewBox, setViewBox] = useState("0 0 800 700");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile: Zoom in (Crop edges)
        // Original Center: 400, 350
        // Board Content rough box: x[200-600], y[150-550]
        // We want a tighter fit to make it appear larger (~1.5x zoom)
        // Width 550, Height 600
        // x = 400 - 550/2 = 125
        // y = 350 - 600/2 = 50 (Resulting range y: 50 to 650)
        // This leaves margin at the bottom for ports without touching UI
        setViewBox("125 50 550 600");
      } else {
        // Desktop: Full view
        setViewBox("0 0 800 700");
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointy Topped Hex Corners: 30, 90, 150...
  const hexPoints = (cx: number, cy: number) => {
    let points = "";
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i + 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        const x = cx + HEX_SIZE * Math.cos(angle_rad);
        const y = cy + HEX_SIZE * Math.sin(angle_rad);
        points += `${x},${y} `;
    }
    return points;
  };

  // Pointy Topped Center Calculation
  const getHexPixel = (q: number, r: number) => {
    const x = HEX_SIZE * Math.sqrt(3) * (q + r/2);
    const y = HEX_SIZE * 3/2 * r;
    return { x: x + offsetX, y: y + offsetY };
  };

  return (
    <div className="w-full h-full overflow-hidden flex justify-center items-center relative select-none bg-[#006994]">
      {/* CSS-based Ocean Background - Fast & Reliable */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#006994] to-[#004866]">
          {/* Wave pattern overlay */}
          <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 20%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 10%)',
              backgroundSize: '100px 100px, 120px 120px'
          }}></div>
           <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
              backgroundSize: '24px 24px'
          }}></div>
      </div>

      <svg 
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full drop-shadow-2xl z-10 max-w-[800px] max-h-[700px] md:max-w-full md:max-h-full transition-all duration-500"
      >
        
        {/* Draw Ports */}
        {gameState.board.ports.map(port => {
            const px = port.x + offsetX;
            const py = port.y + offsetY;
            
            const dirX = Math.cos(port.angle * Math.PI / 180);
            const dirY = Math.sin(port.angle * Math.PI / 180);
            
            const iconX = px + dirX * 35;
            const iconY = py + dirY * 35;

            const n1 = gameState.board.nodes.find(n => n.id === port.nodeId1);
            const n2 = gameState.board.nodes.find(n => n.id === port.nodeId2);
            if(!n1 || !n2) return null;

            return (
                <g key={port.id}>
                    <line x1={n1.x + offsetX} y1={n1.y + offsetY} x2={iconX} y2={iconY} stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
                    <line x1={n2.x + offsetX} y1={n2.y + offsetY} x2={iconX} y2={iconY} stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
                    
                    <circle cx={iconX} cy={iconY} r="14" fill="#FFE4B5" stroke="#8B4513" strokeWidth="2" />
                    
                    <g transform={`translate(${iconX - 12}, ${iconY - 12}) scale(1)`} className="text-slate-800">
                         {RESOURCE_ICONS[port.resource] || <text>?</text>}
                    </g>
                    
                    <text x={iconX} y={iconY + 25} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" className="drop-shadow-md">
                        {port.resource === '3:1' ? '3:1' : '2:1'}
                    </text>
                </g>
            );
        })}

        {/* Draw Hexes */}
        {gameState.board.hexes.map(hex => {
          const { x, y } = getHexPixel(hex.q, hex.r);
          const color = RESOURCE_COLORS[hex.resource];
          const isRobber = gameState.robberHexId === hex.id;
          const isMovePhase = gameState.gamePhase === 'ROBBER_MOVE';
          
          return (
            <g 
                key={hex.id} 
                onClick={() => isMovePhase && onHexClick && onHexClick(hex.id)}
                className={`transition-all ${isMovePhase ? 'cursor-pointer hover:brightness-110' : ''}`}
            >
              <polygon
                points={hexPoints(x, y)}
                fill={color}
                stroke="#fff4cc"
                strokeWidth="3"
                className={`${isRobber ? 'brightness-75' : ''}`}
              />
              {/* Inner highlight */}
              <polygon
                points={hexPoints(x, y)}
                fill="black"
                fillOpacity="0.05"
                pointerEvents="none"
              />

              {/* Resource Icon in Hex Center */}
              <g 
                transform={`translate(${x-16}, ${y-22}) scale(1.3)`} 
                className="pointer-events-none opacity-20"
                fill="#2c3e50" 
              >
                  {RESOURCE_ICONS[hex.resource]}
              </g>
              
              {/* Number Token */}
              {hex.numberToken && !isRobber && (
                <g pointerEvents="none">
                  <circle cx={x} cy={y + 10} r={16} fill="#FFE4B5" stroke="#dcb680" strokeWidth="1" />
                  <text 
                    x={x} 
                    y={y + 10} 
                    dy="5" 
                    textAnchor="middle" 
                    className={`text-sm font-bold ${hex.numberToken === 6 || hex.numberToken === 8 ? 'fill-red-600' : 'fill-black'}`}
                  >
                    {hex.numberToken}
                  </text>
                  <text x={x} y={y + 22} dy="2" textAnchor="middle" fontSize="14" fill={hex.numberToken === 6 || hex.numberToken === 8 ? 'red' : 'black'}>
                     {Array.from({length: 6 - Math.abs(hex.numberToken - 7)}).map(() => '.').join('')}
                  </text>
                </g>
              )}

              {/* Robber Icon */}
              {isRobber && (
                  <RobberIcon x={x} y={y + 10} />
              )}
            </g>
          );
        })}

        {/* Draw Edges (Roads) */}
        {gameState.board.edges.map(edge => {
          const ownerColor = edge.ownerId 
            ? PLAYER_COLORS_HEX[gameState.players.find(p => p.id === edge.ownerId)?.color || PlayerColor.WHITE] 
            : null;

          return (
            <g key={edge.id} onClick={() => onEdgeClick(edge.id)} className="group cursor-pointer">
                {/* Hit Area: Wide invisible line */}
                <line
                    x1={edge.x1 + offsetX}
                    y1={edge.y1 + offsetY}
                    x2={edge.x2 + offsetX}
                    y2={edge.y2 + offsetY}
                    stroke="transparent"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                
                {/* Visual Road: Visible only if owned or hovered (ghost) */}
                <line
                    x1={edge.x1 + offsetX}
                    y1={edge.y1 + offsetY}
                    x2={edge.x2 + offsetX}
                    y2={edge.y2 + offsetY}
                    stroke={ownerColor || 'white'}
                    strokeWidth="6"
                    strokeOpacity={ownerColor ? 1 : 0}
                    strokeLinecap="round"
                    className={`transition-all ${!ownerColor ? 'group-hover:stroke-opacity-50' : ''}`}
                />
            </g>
          );
        })}

        {/* Draw Nodes (Settlements/Cities) */}
        {gameState.board.nodes.map(node => {
           const x = node.x + offsetX;
           const y = node.y + offsetY;
           
           const owner = gameState.players.find(p => p.id === node.ownerId);
           const color = owner ? PLAYER_COLORS_HEX[owner.color] : 'transparent';
           
           return (
             <g key={node.id} onClick={() => onNodeClick(node.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
               {/* Hit area */}
               <circle cx={x} cy={y} r={12} fill="transparent" className="hover:fill-white/30" />
               
               {node.building === BuildingType.SETTLEMENT && (
                 <SettlementIcon x={x} y={y} color={color} />
               )}
               {node.building === BuildingType.CITY && (
                 <CityIcon x={x} y={y} color={color} />
               )}
               
               {/* Ghost Hint for empty spots */}
               {!node.building && (
                  <circle cx={x} cy={y} r={4} fill="transparent" className="hover:fill-white/50" />
               )}
             </g>
           );
        })}
      </svg>
    </div>
  );
};

export default HexBoard;
