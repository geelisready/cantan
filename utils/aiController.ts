
import { GameState, Action, BuildingType, ResourceType, BUILDING_COSTS, DevCardType } from '../types';
import { canAfford, getPlayerTradeRatios } from './gameLogic';

// Helper to get random item from array
const randomChoice = <T>(arr: T[]): T | null => {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
};

// Evaluate the quality of a node (sum of pips of adjacent hexes)
const getNodeScore = (nodeId: string, state: GameState): number => {
    const node = state.board.nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    
    const pips: Record<number, number> = { 2:1, 3:2, 4:3, 5:4, 6:5, 8:5, 9:4, 10:3, 11:2, 12:1 };
    
    return node.hexIds.reduce((score, hexId) => {
        const hex = state.board.hexes.find(h => h.id === hexId);
        if (hex && hex.numberToken && hex.resource !== ResourceType.DESERT) {
            return score + (pips[hex.numberToken] || 0);
        }
        return score;
    }, 0);
};

export const getAiAction = (state: GameState): Action | null => {
    const player = state.players[state.currentPlayerIndex];
    if (!player || !player.isAI) return null;

    // --- SETUP PHASE ---
    if (state.gamePhase === 'SETUP_ROUND_1' || state.gamePhase === 'SETUP_ROUND_2') {
        if (state.setupStep === 'SETTLEMENT') {
            const availableNodes = state.board.nodes.filter(node => {
                if (node.ownerId !== null) return false;
                const neighbors = state.board.edges
                    .filter(e => e.nodeId1 === node.id || e.nodeId2 === node.id)
                    .map(e => e.nodeId1 === node.id ? e.nodeId2 : e.nodeId1);
                
                const isTooClose = neighbors.some(nid => {
                    const n = state.board.nodes.find(nx => nx.id === nid);
                    return n && n.ownerId !== null;
                });
                return !isTooClose;
            });

            const sortedNodes = availableNodes.sort((a, b) => getNodeScore(b.id, state) - getNodeScore(a.id, state));
            const topNodes = sortedNodes.slice(0, 3);
            const choice = randomChoice(topNodes);
            
            if (choice) {
                return { type: 'BUILD_SETTLEMENT', nodeId: choice.id };
            }
        } 
        else if (state.setupStep === 'ROAD') {
            const myNodes = state.board.nodes.filter(n => n.ownerId === player.id);
            const myEdges = state.board.edges.filter(e => e.ownerId === player.id);
            
            const validEdges = state.board.edges.filter(e => {
                if (e.ownerId !== null) return false;
                const connectedToNode = myNodes.some(n => n.id === e.nodeId1 || n.id === e.nodeId2);
                const connectedToRoad = myEdges.some(me => 
                    me.nodeId1 === e.nodeId1 || me.nodeId1 === e.nodeId2 || 
                    me.nodeId2 === e.nodeId1 || me.nodeId2 === e.nodeId2
                );
                return connectedToNode || connectedToRoad;
            });
            
            const choice = randomChoice(validEdges);
            if (choice) {
                return { type: 'BUILD_ROAD', edgeId: choice.id };
            }
        }
        return null;
    }

    // --- ROBBER PHASES ---
    if (state.gamePhase === 'ROBBER_DISCARD') {
        if (player.toDiscard > 0) {
            const available = Object.keys(player.resources).filter(k => k !== 'Desert' && player.resources[k as ResourceType] > 0);
            const toDiscard = randomChoice(available);
            if (toDiscard) {
                return { type: 'DISCARD_RESOURCE', resource: toDiscard as ResourceType };
            }
        }
        return null;
    }

    if (state.gamePhase === 'ROBBER_MOVE') {
        const possibleHexes = state.board.hexes.filter(h => h.id !== state.robberHexId);
        const choice = randomChoice(possibleHexes);
        if (choice) {
            return { type: 'MOVE_ROBBER', hexId: choice.id };
        }
        return null;
    }

    if (state.gamePhase === 'ROBBER_STEAL') {
        const robberHex = state.board.hexes.find(h => h.id === state.robberHexId);
        if (robberHex) {
            const adjacentNodes = state.board.nodes.filter(n => n.hexIds.includes(robberHex.id) && n.ownerId !== null && n.ownerId !== player.id);
            const victimIds = Array.from(new Set(adjacentNodes.map(n => n.ownerId)));
            if (victimIds.length > 0) {
                const victimId = randomChoice(victimIds);
                if (victimId) return { type: 'STEAL_RESOURCE', targetPlayerId: victimId };
            }
        }
        return { type: 'MOVE_ROBBER', hexId: state.robberHexId! }; 
    }

    // --- SPECIAL DEV CARD PHASES (AI AUTO-RESOLVE) ---
    if (state.gamePhase === 'DEV_MONOPOLY') {
        const resources = [ResourceType.ORE, ResourceType.WHEAT, ResourceType.SHEEP, ResourceType.WOOD, ResourceType.BRICK];
        return { type: 'RESOLVE_MONOPOLY', resource: randomChoice(resources) || ResourceType.ORE };
    }

    if (state.gamePhase === 'DEV_YOP') {
        return { type: 'RESOLVE_YOP', resources: [ResourceType.WHEAT, ResourceType.ORE] };
    }

    // --- PLAYING PHASE ---
    if (state.gamePhase === 'PLAYING') {
        
        // 0. Play Dev Cards (Logic: Check usable devCards)
        // Play Knight if blocked (High Priority)
        const myNodes = state.board.nodes.filter(n => n.ownerId === player.id);
        const myHexIds = new Set(myNodes.flatMap(n => n.hexIds));
        const isRobberBlockMe = state.robberHexId && myHexIds.has(state.robberHexId);
        
        if (isRobberBlockMe && player.devCards.includes(DevCardType.KNIGHT)) {
            return { type: 'PLAY_DEV_CARD', cardType: DevCardType.KNIGHT };
        }
        // Play Victory Points (Always)
        if (player.devCards.includes(DevCardType.VICTORY_POINT)) {
             return { type: 'PLAY_DEV_CARD', cardType: DevCardType.VICTORY_POINT };
        }
        // Randomly play other cards
        if (player.devCards.includes(DevCardType.YEAR_OF_PLENTY)) {
             return { type: 'PLAY_DEV_CARD', cardType: DevCardType.YEAR_OF_PLENTY };
        }
        if (player.devCards.includes(DevCardType.MONOPOLY)) {
             return { type: 'PLAY_DEV_CARD', cardType: DevCardType.MONOPOLY };
        }
        if (player.devCards.includes(DevCardType.ROAD_BUILDING)) {
             return { type: 'PLAY_DEV_CARD', cardType: DevCardType.ROAD_BUILDING };
        }

        // 1. Roll Dice
        if (state.dice[0] === 0) {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            return { type: 'ROLL_DICE', roll: [d1, d2] };
        }

        // 2. Build City
        if (canAfford(player, BUILDING_COSTS[BuildingType.CITY])) {
            const mySettlements = state.board.nodes.filter(n => n.ownerId === player.id && n.building === BuildingType.SETTLEMENT);
            const choice = randomChoice(mySettlements);
            if (choice) return { type: 'BUILD_CITY', nodeId: choice.id };
        }

        // 3. Build Settlement
        if (canAfford(player, BUILDING_COSTS[BuildingType.SETTLEMENT])) {
            const validNodes = state.board.nodes.filter(n => {
                if (n.ownerId !== null) return false;
                const connectedRoad = state.board.edges.some(e => 
                    e.ownerId === player.id && (e.nodeId1 === n.id || e.nodeId2 === n.id)
                );
                if (!connectedRoad) return false;

                const neighbors = state.board.edges
                    .filter(e => e.nodeId1 === n.id || e.nodeId2 === n.id)
                    .map(e => e.nodeId1 === n.id ? e.nodeId2 : e.nodeId1);
                
                const isTooClose = neighbors.some(nid => {
                    const nx = state.board.nodes.find(x => x.id === nid);
                    return nx && nx.ownerId !== null;
                });
                return !isTooClose;
            });

            if (validNodes.length > 0) {
                const sorted = validNodes.sort((a, b) => getNodeScore(b.id, state) - getNodeScore(a.id, state));
                const choice = sorted[0]; 
                return { type: 'BUILD_SETTLEMENT', nodeId: choice.id };
            }
        }

        // 4. Buy Dev Card
        if (state.devCardDeck.length > 0 && canAfford(player, BUILDING_COSTS[BuildingType.DEV_CARD])) {
             if (Math.random() < 0.4) {
                 return { type: 'BUY_DEV_CARD' };
             }
        }

        // 5. Build Road
        if (canAfford(player, BUILDING_COSTS[BuildingType.ROAD])) {
             const myEdges = state.board.edges.filter(e => e.ownerId === player.id);
             const myNodes = state.board.nodes.filter(n => n.ownerId === player.id);

             const validEdges = state.board.edges.filter(e => {
                if (e.ownerId !== null) return false;
                const connectedToNode = myNodes.some(n => n.id === e.nodeId1 || n.id === e.nodeId2);
                const connectedToRoad = myEdges.some(me => 
                    me.nodeId1 === e.nodeId1 || me.nodeId1 === e.nodeId2 || 
                    me.nodeId2 === e.nodeId1 || me.nodeId2 === e.nodeId2
                );
                return connectedToNode || connectedToRoad;
             });

             const choice = randomChoice(validEdges);
             // Only build if we have plenty of wood or it's a random decision
             if (choice && (Math.random() > 0.5 || player.resources.Wood > 3)) {
                 return { type: 'BUILD_ROAD', edgeId: choice.id };
             }
        }

        // 6. Attempt Trade with Bank (New Feature)
        // If we have > 5 of something, trade it for something we have 0 of.
        const ratios = getPlayerTradeRatios(player, state.board.nodes);
        const resourceTypes = Object.keys(player.resources) as ResourceType[];
        
        for (const sellRes of resourceTypes) {
            if (sellRes === ResourceType.DESERT) continue;
            const cost = ratios[sellRes];
            if (player.resources[sellRes] >= cost + 1) { // Ensure we have enough
                 // Find something we lack
                 const buyRes = resourceTypes.find(r => r !== ResourceType.DESERT && r !== sellRes && player.resources[r] === 0);
                 if (buyRes) {
                     return { type: 'TRADE_BANK', resourceGiven: sellRes, resourceReceived: buyRes };
                 }
            }
        }

        return { type: 'END_TURN' };
    }

    return null;
};
