
import { Hex, Node, Edge, Port, ResourceType, Player, PlayerColor, BuildingType, GameState, DevCardType } from "../types";

// Hexagon Geometry Constants (Pointy Topped)
export const HEX_SIZE = 60; 

// --- Initialization ---

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 1,
    name: "红方",
    color: PlayerColor.RED,
    isAI: false,
    resources: { Wood: 0, Brick: 0, Sheep: 0, Wheat: 0, Ore: 0, Desert: 0 },
    vp: 0,
    devCards: [],
    newDevCards: [],
    roadsLeft: 15,
    settlementsLeft: 5,
    citiesLeft: 4,
    toDiscard: 0,
  },
  {
    id: 2,
    name: "蓝方 (AI)",
    color: PlayerColor.BLUE,
    isAI: true,
    resources: { Wood: 0, Brick: 0, Sheep: 0, Wheat: 0, Ore: 0, Desert: 0 },
    vp: 0,
    devCards: [],
    newDevCards: [],
    roadsLeft: 15,
    settlementsLeft: 5,
    citiesLeft: 4,
    toDiscard: 0,
  }
];

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[currentIndex], array[currentIndex]];
  }
  return array;
}

export const generateDeck = (): DevCardType[] => {
    // Standard deck: 14 Knights, 5 VP, 2 Road, 2 Monopoly, 2 Plenty
    const deck: DevCardType[] = [];
    for (let i = 0; i < 14; i++) deck.push(DevCardType.KNIGHT);
    for (let i = 0; i < 5; i++) deck.push(DevCardType.VICTORY_POINT);
    for (let i = 0; i < 2; i++) deck.push(DevCardType.ROAD_BUILDING);
    for (let i = 0; i < 2; i++) deck.push(DevCardType.MONOPOLY);
    for (let i = 0; i < 2; i++) deck.push(DevCardType.YEAR_OF_PLENTY);
    return shuffle(deck);
};

export const generateBoard = () => {
  // Standard Catan Map Layout (Spiral or Row-based)
  // Axial coordinates
  const layout = [
    { q: 0, r: -2, s: 2 }, { q: 1, r: -2, s: 1 }, { q: 2, r: -2, s: 0 },
    { q: -1, r: -1, s: 2 }, { q: 0, r: -1, s: 1 }, { q: 1, r: -1, s: 0 }, { q: 2, r: -1, s: -1 },
    { q: -2, r: 0, s: 2 }, { q: -1, r: 0, s: 1 }, { q: 0, r: 0, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 2, r: 0, s: -2 },
    { q: -2, r: 1, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 }, { q: 1, r: 1, s: -2 },
    { q: -2, r: 2, s: 0 }, { q: -1, r: 2, s: -1 }, { q: 0, r: 2, s: -2 },
  ];

  // Standard Catan Distribution
  // 4 Wood (Forest), 4 Wheat (Fields), 4 Sheep (Pasture), 3 Brick (Hills), 3 Ore (Mountains), 1 Desert
  const rawResources = [
    ResourceType.WOOD, ResourceType.WOOD, ResourceType.WOOD, ResourceType.WOOD,
    ResourceType.WHEAT, ResourceType.WHEAT, ResourceType.WHEAT, ResourceType.WHEAT,
    ResourceType.SHEEP, ResourceType.SHEEP, ResourceType.SHEEP, ResourceType.SHEEP,
    ResourceType.BRICK, ResourceType.BRICK, ResourceType.BRICK,
    ResourceType.ORE, ResourceType.ORE, ResourceType.ORE,
    ResourceType.DESERT
  ];
  const resources = shuffle(rawResources);

  // Number tokens 
  // Desert gets no number. The 7 is the robber.
  const numbers = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
  
  const hexes: Hex[] = [];
  let numberIndex = 0;

  layout.forEach((coords, i) => {
    const res = resources[i];
    let num: number | null = null;
    if (res !== ResourceType.DESERT) {
      num = numbers[numberIndex];
      numberIndex++;
    }
    
    hexes.push({
      id: `hex_${coords.q}_${coords.r}`,
      q: coords.q,
      r: coords.r,
      s: coords.s,
      resource: res,
      numberToken: num
    });
  });

  // Generate Nodes (Vertices)
  const tempNodes: Map<string, Node> = new Map();
  
  hexes.forEach(hex => {
    // Center of Hex (Pointy Topped)
    const cx = HEX_SIZE * Math.sqrt(3) * (hex.q + hex.r / 2);
    const cy = HEX_SIZE * (3/2 * hex.r);
    
    // 6 corners
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i + 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      
      const nx = cx + HEX_SIZE * Math.cos(angle_rad);
      const ny = cy + HEX_SIZE * Math.sin(angle_rad);
      
      // Rounding
      const qx = Math.round(nx * 10) / 10;
      const qy = Math.round(ny * 10) / 10;
      const nodeId = `node_${qx}_${qy}`;
      
      if (!tempNodes.has(nodeId)) {
        tempNodes.set(nodeId, {
          id: nodeId,
          x: qx,
          y: qy,
          ownerId: null,
          building: null,
          hexIds: []
        });
      }
      tempNodes.get(nodeId)!.hexIds.push(hex.id);
    }
  });

  const nodes = Array.from(tempNodes.values());

  // Generate Edges
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      
      if (Math.abs(dist - HEX_SIZE) < 1.0) {
         const id1 = n1.id < n2.id ? n1.id : n2.id;
         const id2 = n1.id < n2.id ? n2.id : n1.id;
         const edgeId = `edge_${id1}_${id2}`;
         
         if (!edgeSet.has(edgeId)) {
             edges.push({
               id: edgeId,
               nodeId1: id1,
               nodeId2: id2,
               x1: n1.x,
               y1: n1.y,
               x2: n2.x,
               y2: n2.y,
               ownerId: null
             });
             edgeSet.add(edgeId);
         }
      }
    }
  }

  // --- Generate Ports ---
  // Configuration: 9 Ports total (Standard Catan).
  // 4 Generic (3:1)
  // 5 Specific (2:1)
  const portsConfig: {q: number, r: number, dir: number, type: ResourceType | '3:1'}[] = [
      { q: 0, r: -2, dir: 4, type: '3:1' },                 // Top Left
      { q: 2, r: -2, dir: 5, type: ResourceType.SHEEP },    // Top Right
      { q: 2, r: -1, dir: 0, type: '3:1' },                 // Upper Right
      { q: 2, r: 0, dir: 0, type: '3:1' },                  // Right 
      { q: 1, r: 1, dir: 1, type: ResourceType.BRICK },     // Lower Right
      { q: 0, r: 2, dir: 1, type: ResourceType.WOOD },      // Bottom Right 
      { q: -2, r: 2, dir: 2, type: '3:1' },                 // Bottom Left
      { q: -2, r: 1, dir: 3, type: ResourceType.WHEAT },    // Left 
      { q: -1, r: -1, dir: 4, type: ResourceType.ORE },     // Top Left 
  ];

  const ports: Port[] = [];
  
  portsConfig.forEach((cfg, idx) => {
      const hex = hexes.find(h => h.q === cfg.q && h.r === cfg.r);
      if (!hex) return;

      const edgeAngle = cfg.dir * 60; 
      const cx = HEX_SIZE * Math.sqrt(3) * (hex.q + hex.r / 2);
      const cy = HEX_SIZE * (3/2 * hex.r);
      
      const ex = cx + (HEX_SIZE * Math.sqrt(3)/2) * Math.cos(edgeAngle * Math.PI/180);
      const ey = cy + (HEX_SIZE * Math.sqrt(3)/2) * Math.sin(edgeAngle * Math.PI/180);
      
      let bestEdge: Edge | null = null;
      let minD = 9999;
      
      edges.forEach(e => {
         const ecx = (e.x1 + e.x2) / 2;
         const ecy = (e.y1 + e.y2) / 2;
         const d = Math.hypot(ecx - ex, ecy - ey);
         if (d < 10) { 
             bestEdge = e;
             minD = d;
         }
      });
      
      if (bestEdge) {
          ports.push({
              id: `port_${idx}`,
              nodeId1: (bestEdge as Edge).nodeId1,
              nodeId2: (bestEdge as Edge).nodeId2,
              resource: cfg.type,
              x: ex,
              y: ey,
              angle: edgeAngle
          });
          
          const n1 = nodes.find(n => n.id === (bestEdge as Edge).nodeId1);
          const n2 = nodes.find(n => n.id === (bestEdge as Edge).nodeId2);
          if (n1) n1.portResource = cfg.type;
          if (n2) n2.portResource = cfg.type;
      }
  });

  return { hexes, nodes, edges, ports };
};

export const distributeResources = (gameState: GameState, roll: number): Player[] => {
  if (roll === 7) return gameState.players;

  const newPlayers = [...gameState.players];
  const producingHexes = gameState.board.hexes.filter(h => h.numberToken === roll);

  producingHexes.forEach(hex => {
    // Robber blocks production
    if (hex.id === gameState.robberHexId) return;

    const hexNodes = gameState.board.nodes.filter(n => n.hexIds.includes(hex.id));
    
    hexNodes.forEach(node => {
      if (node.ownerId) {
        const playerIndex = newPlayers.findIndex(p => p.id === node.ownerId);
        if (playerIndex > -1 && hex.resource !== ResourceType.DESERT) {
          const amount = node.building === BuildingType.CITY ? 2 : 1;
          newPlayers[playerIndex] = {
            ...newPlayers[playerIndex],
            resources: {
              ...newPlayers[playerIndex].resources,
              [hex.resource]: newPlayers[playerIndex].resources[hex.resource] + amount
            }
          };
        }
      }
    });
  });

  return newPlayers;
};

export const distributeInitialResources = (gameState: GameState, nodeId: string): Player[] => {
    const newPlayers = [...gameState.players];
    const node = gameState.board.nodes.find(n => n.id === nodeId);
    
    if (!node || !node.ownerId) return newPlayers;

    const playerIndex = newPlayers.findIndex(p => p.id === node.ownerId);
    if (playerIndex === -1) return newPlayers;

    const adjacentHexes = gameState.board.hexes.filter(h => node.hexIds.includes(h.id));

    adjacentHexes.forEach(hex => {
        if (hex.resource !== ResourceType.DESERT) {
            newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                resources: {
                    ...newPlayers[playerIndex].resources,
                    [hex.resource]: newPlayers[playerIndex].resources[hex.resource] + 1
                }
            };
        }
    });

    return newPlayers;
};

export const canAfford = (player: Player, cost: Partial<Record<ResourceType, number>>): boolean => {
  for (const [res, amount] of Object.entries(cost)) {
    if (player.resources[res as ResourceType] < amount) return false;
  }
  return true;
};

export const payCost = (player: Player, cost: Partial<Record<ResourceType, number>>): Player => {
  const newRes = { ...player.resources };
  for (const [res, amount] of Object.entries(cost)) {
    newRes[res as ResourceType] -= amount;
  }
  return { ...player, resources: newRes };
};

export const getPlayerTradeRatios = (player: Player, boardNodes: Node[]): Record<ResourceType, number> => {
    // Default 4:1
    const ratios = {
        [ResourceType.WOOD]: 4,
        [ResourceType.BRICK]: 4,
        [ResourceType.SHEEP]: 4,
        [ResourceType.WHEAT]: 4,
        [ResourceType.ORE]: 4,
        [ResourceType.DESERT]: 99, // Cannot trade desert
    };

    const playerNodes = boardNodes.filter(n => n.ownerId === player.id);
    
    // Check for 3:1 ports first (Applies to all resources)
    const hasGenericPort = playerNodes.some(n => n.portResource === '3:1');
    if (hasGenericPort) {
        (Object.keys(ratios) as ResourceType[]).forEach(r => {
            if (r !== ResourceType.DESERT) ratios[r] = 3;
        });
    }

    // Check for specific 2:1 ports (Overrides 3:1)
    playerNodes.forEach(n => {
        if (n.portResource && n.portResource !== '3:1' && n.portResource !== ResourceType.DESERT) {
            ratios[n.portResource] = 2;
        }
    });

    return ratios;
};
