import React, { useState, useEffect, useReducer, useRef } from 'react';
import { 
  GameState, 
  ResourceType, 
  BuildingType, 
  BUILDING_COSTS, 
  RESOURCE_NAMES_CN,
  Player,
  DevCardType,
  DEV_CARD_NAMES_CN,
  SoundEffectType,
  Action,
  PlayerColor
} from './types';
import { 
  generateBoard, 
  distributeResources, 
  distributeInitialResources,
  canAfford, 
  payCost,
  INITIAL_PLAYERS,
  generateDeck,
  getPlayerTradeRatios
} from './utils/gameLogic';
import HexBoard from './components/HexBoard';
import { getAiAdvice } from './services/geminiService';
import { playSound } from './utils/soundService';
import { getAiAction } from './utils/aiController';

// --- Icons ---
const DiceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><circle cx="9" cy="9" r="1"></circle><circle cx="15" cy="15" r="1"></circle><circle cx="9" cy="15" r="1"></circle><circle cx="15" cy="9" r="1"></circle></svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);

const SkullIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
);

const RobotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const TradeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const CardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="m12 14 4-4"/><path d="m12 14-4-4"/><path d="M12 14V6"/></svg>
);

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);

const CompactResourceItem: React.FC<{ type: ResourceType, count: number }> = ({ type, count }) => {
    const has = count > 0;
    return (
        <div className={`flex flex-col items-center justify-center p-0.5 rounded-md border ${
            has ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-50 border-slate-100'
        } h-full w-full transition-all`}>
            <div className={`text-[8px] sm:text-[10px] uppercase font-bold truncate w-full text-center leading-tight ${has ? 'text-slate-600' : 'text-slate-300'}`}>
                {RESOURCE_NAMES_CN[type]}
            </div>
            <div className={`text-lg sm:text-xl font-black leading-none mt-0.5 ${has ? 'text-slate-800' : 'text-slate-200'}`}>
                {count}
            </div>
        </div>
    );
};

const CompactBuildItem: React.FC<{ 
    label: string, 
    cost: string, 
    canAfford: boolean, 
    onClick?: () => void,
    disabled?: boolean
}> = ({ label, cost, canAfford, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center p-0.5 rounded-md border h-full w-full transition-all active:scale-95 ${
            canAfford && !disabled
                ? 'bg-white border-blue-300 shadow-sm text-blue-900' 
                : 'bg-slate-50 border-slate-100 text-slate-300'
        }`}
    >
        <span className="text-[9px] sm:text-[10px] font-bold leading-none mb-0.5">{label}</span>
        <div className="text-[7px] sm:text-[8px] opacity-70 tracking-tighter leading-none">{cost}</div>
    </button>
);

const ResourceCard: React.FC<{ type: ResourceType, count: number }> = ({ type, count }) => {
    const colors: Record<ResourceType, string> = {
        [ResourceType.WOOD]: 'bg-green-700',
        [ResourceType.BRICK]: 'bg-red-700',
        [ResourceType.SHEEP]: 'bg-green-300 text-black',
        [ResourceType.WHEAT]: 'bg-yellow-400 text-black',
        [ResourceType.ORE]: 'bg-slate-500',
        [ResourceType.DESERT]: 'bg-amber-200',
    };
    if (type === ResourceType.DESERT) return null;
    return (
        <div className={`flex flex-col items-center justify-center w-12 h-16 rounded-md shadow ${colors[type]} text-white m-1 transition-transform hover:scale-110`}>
            <span className="text-[10px] uppercase font-bold">{RESOURCE_NAMES_CN[type]}</span>
            <span className="text-xl font-bold">{count}</span>
        </div>
    );
}

const App: React.FC = () => {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeGive, setTradeGive] = useState<ResourceType | null>(null);
  const [tradeReceive, setTradeReceive] = useState<ResourceType | null>(null);
  const [showMyCards, setShowMyCards] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreModalPlayerId, setScoreModalPlayerId] = useState<number | null>(null);
  
  // YOP State
  const [yopSelections, setYopSelections] = useState<ResourceType[]>([]);
  
  // AI Loop Timer Ref
  const aiTimerRef = useRef<number | null>(null);

  // Initial State
  const [gameState, dispatch] = useReducer((state: GameState, action: Action): GameState => {
    switch (action.type) {
      case 'INIT_GAME': {
        const board = generateBoard();
        const desertHex = board.hexes.find(h => h.resource === ResourceType.DESERT);
        return {
          players: INITIAL_PLAYERS,
          currentPlayerIndex: 0,
          board,
          devCardDeck: generateDeck(),
          robberHexId: desertHex ? desertHex.id : null,
          dice: [0, 0],
          gamePhase: 'GAME_START', // Start with the preview phase
          setupStep: 'SETTLEMENT',
          log: ['请查看地图，点击开始游戏。'],
          aiAdvice: null,
          isAiThinking: false,
          soundEffect: null // No sound on init, wait for start
        };
      }

      case 'START_GAME': {
          return {
              ...state,
              gamePhase: 'SETUP_ROUND_1',
              log: [...state.log, '游戏开始！准备阶段：正序放置村庄。'],
              soundEffect: 'START'
          };
      }

      case 'TOGGLE_PLAYER_AI': {
          const newPlayers = state.players.map(p => 
              p.id === action.playerId ? { ...p, isAI: !p.isAI } : p
          );
          return { ...state, players: newPlayers };
      }

      case 'ADD_PLAYER': {
          if (state.players.length >= 4) return state;

          const takenColors = new Set(state.players.map(p => p.color));
          const allColors = Object.values(PlayerColor);
          const availableColor = allColors.find(c => !takenColors.has(c)) || PlayerColor.ORANGE;

          const newId = Math.max(...state.players.map(p => p.id)) + 1;
          
          const newPlayer: Player = {
              id: newId,
              name: `电脑 ${newId}`,
              color: availableColor,
              isAI: true,
              resources: { Wood: 0, Brick: 0, Sheep: 0, Wheat: 0, Ore: 0, Desert: 0 },
              vp: 0,
              devCards: [],
              newDevCards: [],
              roadsLeft: 15,
              settlementsLeft: 5,
              citiesLeft: 4,
              toDiscard: 0
          };

          return {
              ...state,
              players: [...state.players, newPlayer],
              log: [...state.log, `添加了玩家: ${newPlayer.name}`]
          };
      }

      case 'REMOVE_PLAYER': {
          if (state.players.length <= 2) return state;

          const playerToRemove = state.players.find(p => p.id === action.playerId);
          if (!playerToRemove) return state;

          let newPlayers = state.players.filter(p => p.id !== action.playerId);
          
          // Cleanup board: Remove buildings/roads owned by this player
          const newNodes = state.board.nodes.map(n => 
              n.ownerId === action.playerId ? { ...n, ownerId: null, building: null } : n
          );
          const newEdges = state.board.edges.map(e => 
              e.ownerId === action.playerId ? { ...e, ownerId: null } : e
          );

          let nextIndex = state.currentPlayerIndex;
          if (nextIndex >= newPlayers.length) {
              nextIndex = 0;
          }

          return {
              ...state,
              players: newPlayers,
              currentPlayerIndex: nextIndex,
              board: {
                  ...state.board,
                  nodes: newNodes,
                  edges: newEdges
              },
              log: [...state.log, `移除了玩家: ${playerToRemove.name}`]
          };
      }
      
      case 'ROLL_DICE': {
        const sum = action.roll[0] + action.roll[1];
        let newLog = [...state.log, `${state.players[state.currentPlayerIndex].name} 掷出了 ${sum} (${action.roll[0]} + ${action.roll[1]})`];
        let newState = { ...state, dice: action.roll, log: newLog };

        if (sum === 7) {
            const playersToDiscard = state.players.map(p => {
                const totalResources = (Object.values(p.resources) as number[]).reduce((a, b) => a + b, 0);
                return { 
                    ...p, 
                    toDiscard: totalResources > 7 ? Math.floor(totalResources / 2) : 0 
                };
            });
            
            const hasDiscards = playersToDiscard.some(p => p.toDiscard > 0);
            
            return {
                ...newState,
                players: playersToDiscard,
                gamePhase: hasDiscards ? 'ROBBER_DISCARD' : 'ROBBER_MOVE',
                log: [...newLog, hasDiscards ? '海盗来了！资源超过7张的玩家需要弃牌。' : '海盗来了！请移动海盗。'],
                soundEffect: 'ROBBER'
            };
        } else {
            const playersWithResources = distributeResources(newState, sum);
            const producingHex = state.board.hexes.some(h => h.numberToken === sum && h.id !== state.robberHexId);
            return { 
                ...newState, 
                players: playersWithResources,
                soundEffect: producingHex ? 'COIN' : 'DICE'
            };
        }
      }

      case 'DISCARD_RESOURCE': {
          const discardPlayerIndex = state.players.findIndex(p => p.toDiscard > 0);
          if (discardPlayerIndex === -1) return state;

          const player = state.players[discardPlayerIndex];
          if (player.resources[action.resource] <= 0) return state;

          const newPlayers = [...state.players];
          const newPlayer = { 
              ...player, 
              resources: { ...player.resources, [action.resource]: player.resources[action.resource] - 1 },
              toDiscard: player.toDiscard - 1
          };
          newPlayers[discardPlayerIndex] = newPlayer;

          let newPhase = state.gamePhase;
          let newLog = state.log;

          if (!newPlayers.some(p => p.toDiscard > 0)) {
              newPhase = 'ROBBER_MOVE';
              newLog = [...newLog, '所有玩家弃牌完毕。请当前玩家移动海盗。'];
          }

          return {
              ...state,
              players: newPlayers,
              gamePhase: newPhase,
              log: newLog
          };
      }

      case 'MOVE_ROBBER': {
          if (state.gamePhase !== 'ROBBER_MOVE') return state;
          if (action.hexId === state.robberHexId) return { ...state, log: [...state.log, '必须将海盗移动到新位置'], soundEffect: 'ERROR' };

          const adjacentNodes = state.board.nodes.filter(n => n.hexIds.includes(action.hexId) && n.ownerId !== null && n.ownerId !== state.players[state.currentPlayerIndex].id);
          const distinctVictims = Array.from(new Set(adjacentNodes.map(n => n.ownerId)));

          let nextPhase: GameState['gamePhase'] = 'PLAYING';
          let logMsg = '海盗移动完毕。';

          if (distinctVictims.length > 0) {
              nextPhase = 'ROBBER_STEAL';
              logMsg = '海盗移动完毕。请选择要抢劫的玩家。';
          }

          return {
              ...state,
              robberHexId: action.hexId,
              gamePhase: nextPhase,
              log: [...state.log, logMsg],
              soundEffect: 'BUILD' 
          };
      }

      case 'STEAL_RESOURCE': {
          if (state.gamePhase !== 'ROBBER_STEAL') return state;
          const targetPlayerIndex = state.players.findIndex(p => p.id === action.targetPlayerId);
          const currentPlayerIndex = state.currentPlayerIndex;
          
          if (targetPlayerIndex === -1) return state;
          
          const target = state.players[targetPlayerIndex];
          const thief = state.players[currentPlayerIndex];

          const availableResources = Object.keys(target.resources).filter(k => k !== 'Desert' && target.resources[k as ResourceType] > 0);
          
          if (availableResources.length === 0) {
               return { ...state, gamePhase: 'PLAYING', log: [...state.log, `${target.name} 没有资源可抢！`] };
          }

          const randomResKey = availableResources[Math.floor(Math.random() * availableResources.length)] as ResourceType;
          
          const newPlayers = [...state.players];
          newPlayers[targetPlayerIndex] = {
              ...target,
              resources: { ...target.resources, [randomResKey]: target.resources[randomResKey] - 1 }
          };
          newPlayers[currentPlayerIndex] = {
              ...thief,
              resources: { ...thief.resources, [randomResKey]: thief.resources[randomResKey] + 1 }
          };

          return {
              ...state,
              players: newPlayers,
              gamePhase: 'PLAYING',
              log: [...state.log, `${thief.name} 抢走了 ${target.name} 的一张 ${RESOURCE_NAMES_CN[randomResKey]}。`],
              soundEffect: 'STEAL'
          };
      }

      case 'BUILD_SETTLEMENT': {
        const player = state.players[state.currentPlayerIndex];
        const nodeIndex = state.board.nodes.findIndex(n => n.id === action.nodeId);
        if (nodeIndex === -1) return state;

        const node = state.board.nodes[nodeIndex];
        if (node.ownerId !== null) return { ...state, soundEffect: 'ERROR' };

        // Check distance
        const neighbors = state.board.edges
            .filter(e => e.nodeId1 === node.id || e.nodeId2 === node.id)
            .map(e => e.nodeId1 === node.id ? e.nodeId2 : e.nodeId1);
        
        const isTooClose = neighbors.some(nid => {
            const n = state.board.nodes.find(nx => nx.id === nid);
            return n && n.ownerId !== null;
        });
        if (isTooClose) return { ...state, log: [...state.log, "距离其他建筑太近"], soundEffect: 'ERROR' };

        let newState: GameState = { ...state };
        let costPaid = false;

        if (state.gamePhase === 'SETUP_ROUND_1' || state.gamePhase === 'SETUP_ROUND_2') {
            if (state.setupStep !== 'SETTLEMENT') {
                return { ...state, log: [...state.log, "请先修建道路"], soundEffect: 'ERROR' };
            }
            newState.setupStep = 'ROAD';
        } else {
            if (state.gamePhase !== 'PLAYING') return state; 
            if (!canAfford(player, BUILDING_COSTS[BuildingType.SETTLEMENT])) {
                return { ...state, log: [...state.log, "资源不足，无法建造村庄"], soundEffect: 'ERROR' };
            }
            const hasRoadConnection = state.board.edges.some(e => 
                (e.nodeId1 === node.id || e.nodeId2 === node.id) && e.ownerId === player.id
            );
            if (!hasRoadConnection) {
                 return { ...state, log: [...state.log, "必须连接到你的道路"], soundEffect: 'ERROR' };
            }
            costPaid = true;
        }

        const newPlayers = [...state.players];
        if (costPaid) {
            newPlayers[state.currentPlayerIndex] = payCost(player, BUILDING_COSTS[BuildingType.SETTLEMENT]);
        }
        newPlayers[state.currentPlayerIndex].vp += 1;
        newPlayers[state.currentPlayerIndex].settlementsLeft -= 1;

        const newNodes = [...state.board.nodes];
        newNodes[nodeIndex] = { ...node, ownerId: player.id, building: BuildingType.SETTLEMENT };

        // Check Win Condition
        if (newPlayers[state.currentPlayerIndex].vp >= 10) {
            newState.gamePhase = 'GAME_OVER';
            newState.log = [...state.log, `🏆 ${player.name} 建造村庄，达到10分获胜！`];
            newState.soundEffect = 'START'; // Victory sound
        } else {
            newState.log = [...state.log, `${player.name} 建造了村庄`];
            newState.soundEffect = 'BUILD';
        }

        newState = {
            ...newState,
            players: newPlayers,
            board: { ...state.board, nodes: newNodes },
        };

        if (state.gamePhase === 'SETUP_ROUND_2') {
            const playersWithInitRes = distributeInitialResources(newState, node.id);
            newState.players = playersWithInitRes;
            newState.log = [...newState.log, `${player.name} 获取了初始资源`];
        }

        return newState;
      }

      case 'BUILD_CITY': {
          if (state.gamePhase !== 'PLAYING') return state;
          const player = state.players[state.currentPlayerIndex];
          const nodeIndex = state.board.nodes.findIndex(n => n.id === action.nodeId);
          if (nodeIndex === -1) return state;
          const node = state.board.nodes[nodeIndex];

          if (node.ownerId !== player.id || node.building !== BuildingType.SETTLEMENT) return state;
          
          if (!canAfford(player, BUILDING_COSTS[BuildingType.CITY])) {
              return { ...state, log: [...state.log, "资源不足，无法升级城市"], soundEffect: 'ERROR' };
          }

          const newPlayers = [...state.players];
          newPlayers[state.currentPlayerIndex] = payCost(player, BUILDING_COSTS[BuildingType.CITY]);
          newPlayers[state.currentPlayerIndex].vp += 1; 
          newPlayers[state.currentPlayerIndex].settlementsLeft += 1;
          newPlayers[state.currentPlayerIndex].citiesLeft -= 1;

          const newNodes = [...state.board.nodes];
          newNodes[nodeIndex] = { ...node, building: BuildingType.CITY };

          let phase: GameState['gamePhase'] = state.gamePhase;
          let logMsg = `${player.name} 升级了城市`;
          let sound: SoundEffectType = 'BUILD';

          // Check Win
          if (newPlayers[state.currentPlayerIndex].vp >= 10) {
              phase = 'GAME_OVER';
              logMsg = `🏆 ${player.name} 升级城市，达到10分获胜！`;
              sound = 'START';
          }

          return {
              ...state,
              players: newPlayers,
              board: { ...state.board, nodes: newNodes },
              log: [...state.log, logMsg],
              gamePhase: phase,
              soundEffect: sound
          };
      }

      case 'BUILD_ROAD': {
        const player = state.players[state.currentPlayerIndex];
        const edgeIndex = state.board.edges.findIndex(e => e.id === action.edgeId);
        if (edgeIndex === -1) return state;
        const edge = state.board.edges[edgeIndex];

        if (edge.ownerId !== null) return { ...state, soundEffect: 'ERROR' };

        let newState = { ...state };
        let costPaid = false;

        const connectedToBuilding = [edge.nodeId1, edge.nodeId2].some(nid => {
            const n = state.board.nodes.find(nx => nx.id === nid);
            return n && n.ownerId === player.id;
        });
        const connectedToRoad = state.board.edges.some(e => 
            e.id !== edge.id && 
            e.ownerId === player.id && 
            (e.nodeId1 === edge.nodeId1 || e.nodeId1 === edge.nodeId2 || e.nodeId2 === edge.nodeId1 || e.nodeId2 === edge.nodeId2)
        );

        if (state.gamePhase === 'SETUP_ROUND_1' || state.gamePhase === 'SETUP_ROUND_2') {
             if (state.setupStep !== 'ROAD') {
                return { ...state, log: [...state.log, "请先放置村庄"], soundEffect: 'ERROR' };
             }
             if (!connectedToBuilding && !connectedToRoad) {
                 return { ...state, log: [...state.log, "道路必须连接到你的村庄"], soundEffect: 'ERROR' };
             }
             newState.setupStep = 'SETTLEMENT'; 
             
             if (state.gamePhase === 'SETUP_ROUND_1') {
                 if (state.currentPlayerIndex < state.players.length - 1) {
                     newState.currentPlayerIndex += 1;
                 } else {
                     newState.gamePhase = 'SETUP_ROUND_2';
                     newState.log = [...newState.log, "第一轮结束。逆序开始第二轮。"];
                 }
             } else if (state.gamePhase === 'SETUP_ROUND_2') {
                 if (state.currentPlayerIndex > 0) {
                     newState.currentPlayerIndex -= 1;
                 } else {
                     newState.gamePhase = 'PLAYING';
                     newState.setupStep = null;
                     newState.log = [...newState.log, "准备阶段结束！游戏正式开始。"];
                 }
             }

        } else {
            if (state.gamePhase !== 'PLAYING') return state;
            if (!canAfford(player, BUILDING_COSTS[BuildingType.ROAD])) return { ...state, log: [...state.log, "资源不足，无法建造道路"], soundEffect: 'ERROR' };
            if (!connectedToBuilding && !connectedToRoad) return { ...state, log: [...state.log, "道路必须连接到你的网络"], soundEffect: 'ERROR' };
            costPaid = true;
        }

        const newPlayers = [...state.players];
        if (costPaid) {
            newPlayers[state.currentPlayerIndex] = payCost(player, BUILDING_COSTS[BuildingType.ROAD]);
        }
        newPlayers[state.currentPlayerIndex].roadsLeft -= 1;

        const newEdges = [...state.board.edges];
        newEdges[edgeIndex] = { ...edge, ownerId: player.id };

        return {
            ...newState,
            players: newPlayers,
            board: { ...state.board, edges: newEdges },
            log: [...newState.log, `${player.name} 建造了道路`],
            soundEffect: 'BUILD'
        };
      }

      case 'BUY_DEV_CARD': {
        const player = state.players[state.currentPlayerIndex];
        if (state.gamePhase !== 'PLAYING') return state;
        if (state.devCardDeck.length === 0) return { ...state, log: [...state.log, "没有更多发展卡了"], soundEffect: 'ERROR' };
        if (!canAfford(player, BUILDING_COSTS[BuildingType.DEV_CARD])) return { ...state, log: [...state.log, "资源不足，无法购买发展卡"], soundEffect: 'ERROR' };

        const newPlayers = [...state.players];
        newPlayers[state.currentPlayerIndex] = payCost(player, BUILDING_COSTS[BuildingType.DEV_CARD]);
        
        const card = state.devCardDeck[0];
        const newDeck = state.devCardDeck.slice(1);
        
        let logMsg = `${player.name} 购买了一张发展卡`;
        let phase: GameState['gamePhase'] = state.gamePhase;
        let sound: SoundEffectType = 'BUILD';

        if (card === DevCardType.VICTORY_POINT) {
             // VP Cards apply immediately
             newPlayers[state.currentPlayerIndex].devCards.push(card);
             newPlayers[state.currentPlayerIndex].vp += 1;
             // Check Win
             if (newPlayers[state.currentPlayerIndex].vp >= 10) {
                 phase = 'GAME_OVER';
                 logMsg = `🏆 ${player.name} 购买发展卡获得胜利点，达到10分获胜！`;
                 sound = 'START';
             }
        } else {
             // Other cards unusable this turn
             newPlayers[state.currentPlayerIndex].newDevCards.push(card);
        }

        return {
            ...state,
            players: newPlayers,
            devCardDeck: newDeck,
            log: [...state.log, logMsg],
            gamePhase: phase,
            soundEffect: sound
        };
      }

      case 'PLAY_DEV_CARD': {
        const player = state.players[state.currentPlayerIndex];
        const cardIndex = player.devCards.indexOf(action.cardType);
        if (cardIndex === -1) return state;

        const newPlayers = [...state.players];
        const newCards = [...player.devCards];
        newCards.splice(cardIndex, 1); // Remove card
        newPlayers[state.currentPlayerIndex] = { ...player, devCards: newCards };

        let newState = { ...state, players: newPlayers, log: [...state.log, `${player.name} 使用了 ${DEV_CARD_NAMES_CN[action.cardType]}`] };

        switch (action.cardType) {
            case DevCardType.KNIGHT:
                return { ...newState, gamePhase: 'ROBBER_MOVE', log: [...newState.log, "骑士卡生效！请移动海盗。"], soundEffect: 'ROBBER' };
            
            case DevCardType.VICTORY_POINT:
                // Already handled in BUY for auto-use, but if played from hand (legacy logic):
                // DO NOT ADD VP AGAIN if player clicks 'use'. 
                // But generally VP cards shouldn't be clickable. 
                // Just in case, we do nothing here as points are already added.
                return { ...newState, players: newPlayers };

            case DevCardType.ROAD_BUILDING:
                // Add resources for 2 roads immediately to keep logic simple
                newPlayers[state.currentPlayerIndex].resources.Wood += 2;
                newPlayers[state.currentPlayerIndex].resources.Brick += 2;
                return { ...newState, players: newPlayers, log: [...newState.log, "获得2木2砖用于建设道路"], soundEffect: 'COIN' };

            case DevCardType.MONOPOLY:
                return { ...newState, gamePhase: 'DEV_MONOPOLY', soundEffect: 'PLAY_CARD' };

            case DevCardType.YEAR_OF_PLENTY:
                return { ...newState, gamePhase: 'DEV_YOP', soundEffect: 'PLAY_CARD' };

            default:
                return newState;
        }
      }

      case 'RESOLVE_MONOPOLY': {
          if (state.gamePhase !== 'DEV_MONOPOLY') return state;
          const currentPlayerId = state.players[state.currentPlayerIndex].id;
          const resource = action.resource;
          
          const newPlayers = state.players.map(p => {
              if (p.id === currentPlayerId) return p; // Skip self for now
              const amount = p.resources[resource];
              return { ...p, resources: { ...p.resources, [resource]: 0 } };
          });

          const totalStolen = state.players.reduce((sum, p) => p.id !== currentPlayerId ? sum + p.resources[resource] : sum, 0);
          
          newPlayers[state.currentPlayerIndex] = {
              ...newPlayers[state.currentPlayerIndex],
              resources: {
                  ...newPlayers[state.currentPlayerIndex].resources,
                  [resource]: newPlayers[state.currentPlayerIndex].resources[resource] + totalStolen
              }
          };

          return {
              ...state,
              players: newPlayers,
              gamePhase: 'PLAYING',
              log: [...state.log, `垄断！掠夺了 ${totalStolen} 个${RESOURCE_NAMES_CN[resource]}`],
              soundEffect: 'STEAL'
          };
      }

      case 'RESOLVE_YOP': {
          if (state.gamePhase !== 'DEV_YOP') return state;
          const newPlayers = [...state.players];
          const p = newPlayers[state.currentPlayerIndex];
          
          action.resources.forEach(r => {
              p.resources[r] += 1;
          });

          return {
              ...state,
              players: newPlayers,
              gamePhase: 'PLAYING',
              log: [...state.log, `丰收之年！获得了 ${RESOURCE_NAMES_CN[action.resources[0]]} 和 ${RESOURCE_NAMES_CN[action.resources[1]]}`],
              soundEffect: 'COIN'
          };
      }

      case 'END_TURN': {
        if (state.gamePhase !== 'PLAYING') return state;
        
        // Move new cards to usable cards for the ending player
        const currentPlayers = [...state.players];
        const endingPlayer = currentPlayers[state.currentPlayerIndex];
        const movedCardsPlayer = { 
            ...endingPlayer, 
            devCards: [...endingPlayer.devCards, ...endingPlayer.newDevCards], 
            newDevCards: [] 
        };
        currentPlayers[state.currentPlayerIndex] = movedCardsPlayer;
        
        const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
        
        return {
            ...state,
            players: currentPlayers,
            currentPlayerIndex: nextIndex,
            log: [...state.log, `回合结束。轮到 ${state.players[nextIndex].name}。`],
            aiAdvice: null,
            dice: [0, 0],
            soundEffect: 'END_TURN'
        };
      }

      case 'SET_AI_ADVICE':
        return { ...state, aiAdvice: action.advice };

      case 'SET_AI_THINKING':
        return { ...state, isAiThinking: action.isThinking };

      case 'TRADE_BANK': {
        const player = state.players[state.currentPlayerIndex];
        const ratios = getPlayerTradeRatios(player, state.board.nodes);
        const cost = ratios[action.resourceGiven];

        if (player.resources[action.resourceGiven] < cost) return { ...state, log: [...state.log, "交易失败：资源不足"], soundEffect: 'ERROR' };

        const newPlayers = [...state.players];
        const p = { ...player, resources: { ...player.resources } };
        p.resources[action.resourceGiven] -= cost;
        p.resources[action.resourceReceived] += 1;
        newPlayers[state.currentPlayerIndex] = p;

        return {
            ...state,
            players: newPlayers,
            log: [...state.log, `交易: ${cost}个${RESOURCE_NAMES_CN[action.resourceGiven]} 换 1个${RESOURCE_NAMES_CN[action.resourceReceived]}`],
            soundEffect: 'TRADE'
        };
      }

      case 'CLEAR_SOUND_EFFECT':
        return { ...state, soundEffect: null };

      default:
        return state;
    }
  }, {
    players: [],
    currentPlayerIndex: 0,
    board: { hexes: [], nodes: [], edges: [], ports: [] },
    robberHexId: null,
    dice: [0, 0],
    devCardDeck: [],
    gamePhase: 'GAME_START', // Start here
    setupStep: 'SETTLEMENT',
    log: [],
    aiAdvice: null,
    isAiThinking: false,
    soundEffect: null
  });

  // Initialization
  useEffect(() => {
    dispatch({ type: 'INIT_GAME' });
  }, []);

  // Sound Effect Listener
  useEffect(() => {
    if (gameState.soundEffect) {
        playSound(gameState.soundEffect);
        dispatch({ type: 'CLEAR_SOUND_EFFECT' });
    }
  }, [gameState.soundEffect]);

  // AI Game Loop
  useEffect(() => {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      if (currentPlayer && currentPlayer.isAI && gameState.gamePhase !== 'GAME_OVER' && gameState.gamePhase !== 'GAME_START') {
          if (aiTimerRef.current) {
              window.clearTimeout(aiTimerRef.current);
          }

          aiTimerRef.current = window.setTimeout(() => {
              const action = getAiAction(gameState);
              if (action) {
                  dispatch(action);
              } else if (gameState.gamePhase === 'PLAYING' && gameState.dice[0] !== 0) {
                   dispatch({ type: 'END_TURN' });
              }
          }, 1500); 
      }

      return () => {
          if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
      }
  }, [gameState.players, gameState.currentPlayerIndex, gameState.gamePhase, gameState.setupStep, gameState.dice, gameState.robberHexId]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) return <div className="flex items-center justify-center h-screen bg-slate-100 font-sans text-slate-500">正在初始化棋盘...</div>;

  const isSetup = gameState.gamePhase.startsWith('SETUP');
  const isRobberPhase = gameState.gamePhase.startsWith('ROBBER');
  const isAiTurn = currentPlayer.isAI;
  const isTurnActive = !isSetup && !isRobberPhase && !isAiTurn && gameState.gamePhase === 'PLAYING';

  const tradeRatios = getPlayerTradeRatios(currentPlayer, gameState.board.nodes);

  const getStatusText = () => {
      if (gameState.gamePhase === 'GAME_OVER') return '游戏结束';
      if (gameState.gamePhase === 'GAME_START') return '地图预览';
      if (gameState.gamePhase === 'ROBBER_DISCARD') return '弃牌阶段';
      if (gameState.gamePhase === 'ROBBER_MOVE') return '移动海盗';
      if (gameState.gamePhase === 'ROBBER_STEAL') return '抢劫中';
      if (isSetup) return gameState.setupStep === 'SETTLEMENT' ? '放置村庄' : '放置道路';
      if (isAiTurn) return 'AI 思考中...';
      return '你的回合';
  };

  const handleRollDice = () => {
    if (gameState.dice[0] !== 0) return; 
    playSound('CLICK');
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    dispatch({ type: 'ROLL_DICE', roll: [d1, d2] });
  };

  const handleEndTurn = () => {
     playSound('CLICK');
     dispatch({ type: 'END_TURN' });
  };

  const handleAskAI = async () => {
    playSound('CLICK');
    dispatch({ type: 'SET_AI_THINKING', isThinking: true });
    const advice = await getAiAdvice(gameState);
    dispatch({ type: 'SET_AI_ADVICE', advice });
    dispatch({ type: 'SET_AI_THINKING', isThinking: false });
  };

  const handleHexClick = (hexId: string) => {
      if (isAiTurn) return;
      if (gameState.gamePhase === 'ROBBER_MOVE') {
          dispatch({ type: 'MOVE_ROBBER', hexId });
      }
  };

  const handleNodeClick = (nodeId: string) => {
      if (isAiTurn) return; 
      if (gameState.gamePhase !== 'PLAYING' && !isSetup) return;

      const node = gameState.board.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (isSetup) {
          dispatch({ type: 'BUILD_SETTLEMENT', nodeId });
      } else {
          if (node.ownerId === currentPlayer.id && node.building === BuildingType.SETTLEMENT) {
              dispatch({ type: 'BUILD_CITY', nodeId });
          } else if (node.ownerId === null) {
              dispatch({ type: 'BUILD_SETTLEMENT', nodeId });
          }
      }
  };

  const handleExecuteTrade = () => {
      playSound('CLICK');
      if (tradeGive && tradeReceive && tradeGive !== tradeReceive) {
          dispatch({ type: 'TRADE_BANK', resourceGiven: tradeGive, resourceReceived: tradeReceive });
          setTradeOpen(false);
          setTradeGive(null);
          setTradeReceive(null);
      }
  };

  // Score Modal Logic
  const getScoreDetails = (playerId: number) => {
      const p = gameState.players.find(pl => pl.id === playerId);
      if (!p) return { settlements: 0, cities: 0, vpCards: 0, total: 0 };
      
      const settlementCount = 5 - p.settlementsLeft;
      const cityCount = 4 - p.citiesLeft;
      // Actual VP minus points from buildings = points from cards
      const vpCardsCount = p.vp - (settlementCount * 1 + cityCount * 2);

      return {
          settlements: settlementCount,
          cities: cityCount,
          vpCards: vpCardsCount,
          total: p.vp
      };
  };

  // Modals conditions
  const discardPlayer = gameState.players.find(p => p.toDiscard > 0);
  const showDiscardModal = gameState.gamePhase === 'ROBBER_DISCARD' && discardPlayer && !discardPlayer.isAI;

  const robberHex = gameState.robberHexId ? gameState.board.hexes.find(h => h.id === gameState.robberHexId) : null;
  const adjacentVictims = robberHex && gameState.gamePhase === 'ROBBER_STEAL' 
      ? Array.from(new Set(
          gameState.board.nodes
            .filter(n => n.hexIds.includes(robberHex.id) && n.ownerId !== null && n.ownerId !== currentPlayer.id)
            .map(n => n.ownerId!)
        )).map(id => gameState.players.find(p => p.id === id)!)
      : [];
  
  const showStealModal = gameState.gamePhase === 'ROBBER_STEAL' && !currentPlayer.isAI;
  const showMonopolyModal = gameState.gamePhase === 'DEV_MONOPOLY' && !currentPlayer.isAI;
  const showYopModal = gameState.gamePhase === 'DEV_YOP' && !currentPlayer.isAI;

  const canAffordRoad = canAfford(currentPlayer, BUILDING_COSTS[BuildingType.ROAD]);
  const canAffordSettlement = canAfford(currentPlayer, BUILDING_COSTS[BuildingType.SETTLEMENT]);
  const canAffordCity = canAfford(currentPlayer, BUILDING_COSTS[BuildingType.CITY]);
  const canAffordDev = canAfford(currentPlayer, BUILDING_COSTS[BuildingType.DEV_CARD]);

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden relative">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-40 p-2 bg-white/90 rounded-full shadow-lg text-slate-700"
        onClick={() => setSidebarOpen(true)}
      >
        <MenuIcon />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
      )}

      {/* Sidebar - Responsive Drawer */}
      <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg 
          transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* ... (Sidebar Header matches previous) ... */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI 卡坦岛</h1>
            <p className="text-sm text-slate-500">React & Gemini 驱动</p>
          </div>
          <button className="md:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
          </button>
        </div>

        {/* Desktop only status - mobile moved to bottom panel */}
        <div className="p-4 bg-orange-50 border-b border-orange-100 hidden md:block">
           <div className="flex justify-between items-start">
               <div>
                   <div className="text-xs uppercase tracking-wider text-orange-800 font-bold mb-1">当前回合</div>
                   <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-${currentPlayer.color === 'white' ? 'slate-200' : currentPlayer.color + '-500'}`}></div>
                      <span className="text-xl font-bold">{currentPlayer.name}</span>
                      {currentPlayer.isAI && <RobotIcon />}
                   </div>
                   {/* Dynamic Status Text */}
                   <div className={`mt-1 text-sm font-bold animate-pulse ${isRobberPhase ? 'text-red-600' : 'text-orange-600'}`}>
                       {getStatusText()}
                   </div>
               </div>
               <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase">阶段</div>
                  <div className="text-sm font-bold text-slate-700">
                      {gameState.gamePhase === 'PLAYING' ? '游戏进行中' : (isRobberPhase ? '海盗时刻' : (gameState.gamePhase === 'GAME_START' ? '地图预览' : '游戏准备'))}
                  </div>
               </div>
           </div>
           
           {(gameState.dice[0] as number) > 0 ? (
               <div className="mt-2 text-2xl font-mono font-bold text-slate-800 flex items-center gap-2">
                  <DiceIcon /> {gameState.dice[0] + gameState.dice[1]} <span className="text-sm text-slate-400 font-normal">({gameState.dice[0]}+{gameState.dice[1]})</span>
               </div>
           ) : (
               <div className="mt-2 text-sm text-slate-400 italic">
                   {isSetup ? '准备阶段无法掷骰子' : '等待掷骰子...'}
               </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {gameState.players.map(p => (
                <div key={p.id} className={`p-3 rounded-lg border ${p.id === currentPlayer.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200'} transition-all group`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold flex items-center gap-1 ${p.id === currentPlayer.id ? 'text-blue-900' : 'text-slate-700'}`}>
                            {p.name}
                            {p.isAI ? <RobotIcon /> : <UserIcon />}
                        </span>
                        
                        <div className="flex gap-1">
                            <button 
                                onClick={() => dispatch({ type: 'TOGGLE_PLAYER_AI', playerId: p.id })}
                                className="text-[10px] px-2 py-0.5 rounded border hover:bg-slate-100 text-slate-500"
                                title={p.isAI ? "切换为人类" : "切换为电脑"}
                            >
                                {p.isAI ? "电脑" : "玩家"}
                            </button>
                             {gameState.players.length > 2 && (
                                <button
                                    onClick={() => dispatch({ type: 'REMOVE_PLAYER', playerId: p.id })}
                                    className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="移除玩家"
                                >
                                    <TrashIcon />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2 px-1">
                        <div className="flex gap-1">
                            {p.toDiscard > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">弃 {p.toDiscard}</span>}
                            <button 
                                onClick={() => { setScoreModalPlayerId(p.id); setShowScoreModal(true); playSound('CLICK'); }}
                                className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold hover:bg-slate-300 transition-colors"
                            >
                                🏆 {p.vp} 分
                            </button>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-200" title="发展卡">{p.devCards.length + p.newDevCards.length} 卡</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center">
                        {Object.entries(p.resources).map(([res, count]) => (
                             res !== 'Desert' && <div key={res} title={RESOURCE_NAMES_CN[res as ResourceType]} className={`text-[10px] rounded px-1 ${(count as number) > 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-300'}`}>{RESOURCE_NAMES_CN[res as ResourceType].substring(0,1)}:{count as number}</div>
                        ))}
                    </div>

                    {/* Show Dev Cards for Current Human Player (Desktop View) */}
                    {p.id === currentPlayer.id && !p.isAI && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                             <button onClick={() => setShowMyCards(!showMyCards)} className="text-xs text-purple-600 font-bold flex items-center gap-1 w-full justify-between">
                                 <span>我的发展卡 ({p.devCards.length + p.newDevCards.length})</span>
                                 <span>{showMyCards ? '▲' : '▼'}</span>
                             </button>
                             {showMyCards && (
                                 <div className="mt-2 space-y-1">
                                     {p.devCards.length === 0 && p.newDevCards.length === 0 && <div className="text-xs text-slate-400 italic">暂无卡片</div>}
                                     {p.devCards.map((card, idx) => (
                                         <div key={`old-${idx}`} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100 shadow-sm">
                                             <span className="text-xs font-bold text-purple-800">{DEV_CARD_NAMES_CN[card]}</span>
                                             {card === DevCardType.VICTORY_POINT ? (
                                                  <span className="text-[10px] text-purple-600 font-bold px-2 py-1 bg-purple-100 rounded">自动生效</span>
                                             ) : (
                                                <button 
                                                    onClick={() => dispatch({ type: 'PLAY_DEV_CARD', cardType: card })}
                                                    disabled={gameState.gamePhase !== 'PLAYING'}
                                                    className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    使用
                                                </button>
                                             )}
                                         </div>
                                     ))}
                                     {p.newDevCards.map((card, idx) => (
                                         <div key={`new-${idx}`} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 shadow-sm opacity-70" title="本回合新购入，下回合可用">
                                             <span className="text-xs font-bold text-slate-500">{DEV_CARD_NAMES_CN[card]}</span>
                                             <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded">
                                                 新购
                                             </span>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            ))}
            
            {gameState.players.length < 4 && (
                <button 
                    onClick={() => dispatch({ type: 'ADD_PLAYER' })}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all font-bold"
                >
                    <PlusIcon /> 添加 AI 玩家
                </button>
            )}
        </div>

        <div className="h-48 border-t border-slate-200 bg-slate-50 p-2 overflow-y-auto text-xs font-mono text-slate-600">
            {gameState.log.slice().reverse().map((entry, i) => (
                <div key={i} className="mb-1 border-b border-slate-100 pb-1">{entry}</div>
            ))}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-full w-full bg-[#4682B4] overflow-hidden relative">
         
         {/* Map Area - Mobile: Top fixed area (75%). Desktop: Fill */}
         <div className="
            fixed top-0 left-0 right-0 bottom-[25vh] md:relative md:inset-0 md:w-full md:h-full
            bg-gradient-to-br from-[#006994] to-[#004866]
         ">
             <HexBoard 
                gameState={gameState} 
                onNodeClick={handleNodeClick}
                onEdgeClick={(id) => { if (!isAiTurn) dispatch({ type: 'BUILD_ROAD', edgeId: id }) }}
                onHexClick={handleHexClick}
             />
         </div>

         {/* GAME OVER OVERLAY */}
         {gameState.gamePhase === 'GAME_OVER' && (
             <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                 <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col gap-6 items-center max-w-md text-center animate-bounce-in border-4 border-yellow-400">
                     <CrownIcon />
                     <div>
                        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">游戏结束!</h1>
                        <p className="text-xl font-bold text-slate-600">
                            胜利者: <span className="text-blue-600">{gameState.players.find(p => p.vp >= 10)?.name}</span>
                        </p>
                     </div>
                     <div className="text-sm text-slate-500">
                         总分: {gameState.players.find(p => p.vp >= 10)?.vp} 分
                     </div>
                     <button 
                        onClick={() => { playSound('CLICK'); dispatch({type: 'INIT_GAME'}); }}
                        className="w-full py-4 bg-yellow-500 text-white rounded-xl font-bold text-xl shadow-lg hover:bg-yellow-600 transition-all hover:scale-105"
                    >
                        重新开始游戏
                     </button>
                 </div>
             </div>
         )}

         {/* GAME START OVERLAY */}
         {gameState.gamePhase === 'GAME_START' && (
             <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col gap-6 items-center max-w-sm text-center animate-in zoom-in-95 duration-300">
                     <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                     </div>
                     <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">卡坦岛 AI 对战</h1>
                        <p className="text-slate-600">请检查地图资源分布，满意后开始游戏。</p>
                     </div>
                     <div className="flex flex-col gap-3 w-full">
                         <button 
                            onClick={() => { playSound('CLICK'); dispatch({type: 'START_GAME'}); }}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                        >
                            开始游戏
                         </button>
                         <button 
                            onClick={() => { playSound('CLICK'); dispatch({type: 'INIT_GAME'}); }}
                            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                        >
                            重新生成地图
                         </button>
                     </div>
                 </div>
             </div>
         )}

         {/* ... (Existing Modals remain the same) ... */}

         {/* Score Modal */}
         {showScoreModal && scoreModalPlayerId && (
             <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                 <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs animate-in zoom-in-95">
                     <div className="flex justify-between items-center mb-4 pb-2 border-b">
                         <h3 className="font-bold text-lg text-slate-800">
                             {gameState.players.find(p => p.id === scoreModalPlayerId)?.name} 的分数
                         </h3>
                         <button onClick={() => setShowScoreModal(false)} className="text-slate-400 text-xl font-bold">&times;</button>
                     </div>
                     
                     <div className="space-y-3">
                         {(() => {
                             const details = getScoreDetails(scoreModalPlayerId);
                             const isSelf = scoreModalPlayerId === currentPlayer.id;
                             return (
                                 <>
                                     <div className="flex justify-between items-center text-sm">
                                         <span className="text-slate-600">🏠 村庄 (1分/个)</span>
                                         <span className="font-bold">{details.settlements} 分</span>
                                     </div>
                                     <div className="flex justify-between items-center text-sm">
                                         <span className="text-slate-600">🏙️ 城市 (2分/个)</span>
                                         <span className="font-bold">{details.cities * 2} 分</span>
                                     </div>
                                     <div className="flex justify-between items-center text-sm">
                                         <span className="text-slate-600">🃏 发展卡 (1分/张)</span>
                                         <span className="font-bold">
                                             {isSelf || gameState.gamePhase === 'GAME_OVER' ? details.vpCards : '?'} 分
                                         </span>
                                     </div>
                                     <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-lg text-blue-600">
                                         <span>总分</span>
                                         <span>{details.total}</span>
                                     </div>
                                 </>
                             );
                         })()}
                     </div>
                 </div>
             </div>
         )}
         
         {/* My Cards Modal (Mobile) */}
         {showMyCards && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg text-purple-900">我的发展卡</h3>
                         <button onClick={() => setShowMyCards(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                     </div>
                     <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                         {currentPlayer.devCards.length === 0 && currentPlayer.newDevCards.length === 0 && (
                             <div className="text-center py-8 text-slate-400 italic">你还没有发展卡</div>
                         )}
                         {/* Playable Cards */}
                         {currentPlayer.devCards.map((card, idx) => (
                             <div key={`play-${idx}`} className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-200">
                                 <div className="flex items-center gap-2">
                                     <span className="font-bold text-purple-800">{DEV_CARD_NAMES_CN[card]}</span>
                                 </div>
                                 {card === DevCardType.VICTORY_POINT ? (
                                      <span className="text-[10px] text-purple-600 font-bold px-3 py-1.5 bg-purple-100 rounded">自动生效</span>
                                 ) : (
                                     <button 
                                        onClick={() => { 
                                            playSound('CLICK');
                                            dispatch({ type: 'PLAY_DEV_CARD', cardType: card });
                                            setShowMyCards(false); 
                                        }}
                                        disabled={gameState.gamePhase !== 'PLAYING' || isAiTurn}
                                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 disabled:opacity-50 font-bold"
                                     >
                                         使用
                                     </button>
                                 )}
                             </div>
                         ))}
                         {/* New Cards */}
                         {currentPlayer.newDevCards.map((card, idx) => (
                             <div key={`wait-${idx}`} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm opacity-70" title="本回合新购入，下回合可用">
                                 <div className="flex items-center gap-2">
                                     <span className="font-bold text-slate-600">{DEV_CARD_NAMES_CN[card]}</span>
                                 </div>
                                 <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded font-bold">
                                     下回合可用
                                 </span>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Discard Modal */}
         {showDiscardModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg text-center animate-bounce-in">
                     <h2 className="text-2xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
                        <SkullIcon /> 海盗袭击！
                     </h2>
                     <p className="text-lg text-slate-700 mb-6">
                         <span className="font-bold text-slate-900">{discardPlayer.name}</span>，你的物资太多引来了海盗。
                         <br/>请丢弃 <span className="font-bold text-red-500 text-xl">{discardPlayer.toDiscard}</span> 张资源卡。
                     </p>
                     
                     <div className="grid grid-cols-3 gap-3">
                         {Object.entries(discardPlayer.resources).map(([res, count]) => (
                             res !== 'Desert' && (count as number) > 0 && (
                                 <button 
                                    key={res}
                                    onClick={() => dispatch({ type: 'DISCARD_RESOURCE', resource: res as ResourceType })}
                                    className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 rounded-xl transition-all"
                                 >
                                     <span className="text-sm font-bold text-slate-600">{RESOURCE_NAMES_CN[res as ResourceType]}</span>
                                     <span className="text-2xl font-black text-slate-800">{count as number}</span>
                                 </button>
                             )
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Move Robber Hint */}
         {gameState.gamePhase === 'ROBBER_MOVE' && !isAiTurn && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-bounce z-40 whitespace-nowrap pointer-events-none">
                  点击地图移动海盗
              </div>
         )}

         {/* Steal Modal */}
         {showStealModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                     <h2 className="text-2xl font-bold text-slate-800 mb-4">选择打劫对象</h2>
                     <div className="space-y-3">
                         {adjacentVictims.map(victim => (
                             <button
                                key={victim.id}
                                onClick={() => dispatch({ type: 'STEAL_RESOURCE', targetPlayerId: victim.id })}
                                className="w-full p-4 text-left rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex justify-between items-center"
                             >
                                 <span className="font-bold text-lg">{victim.name}</span>
                                 <span className="text-slate-500 text-sm">{(Object.values(victim.resources) as number[]).reduce((a, b) => a + b, 0) - (victim.resources[ResourceType.DESERT] || 0)} 张资源</span>
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Monopoly Modal */}
         {showMonopolyModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                     <h2 className="text-2xl font-bold text-purple-800 mb-4">垄断卡：选择一种资源</h2>
                     <p className="text-sm text-slate-600 mb-4">抢走所有其他玩家手中的该类资源。</p>
                     <div className="grid grid-cols-3 gap-3">
                         {Object.keys(RESOURCE_NAMES_CN).map(k => (
                             k !== ResourceType.DESERT && (
                                 <button
                                    key={k}
                                    onClick={() => dispatch({ type: 'RESOLVE_MONOPOLY', resource: k as ResourceType })}
                                    className="p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 font-bold text-slate-700"
                                 >
                                     {RESOURCE_NAMES_CN[k as ResourceType]}
                                 </button>
                             )
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Year of Plenty Modal */}
         {showYopModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                     <h2 className="text-2xl font-bold text-emerald-800 mb-4">丰收之年：选择2个资源</h2>
                     <div className="flex justify-center gap-2 mb-4 h-12">
                         {yopSelections.map((res, i) => (
                             <span key={i} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold flex items-center">
                                 {RESOURCE_NAMES_CN[res]}
                             </span>
                         ))}
                     </div>
                     <div className="grid grid-cols-3 gap-3">
                         {Object.keys(RESOURCE_NAMES_CN).map(k => (
                             k !== ResourceType.DESERT && (
                                 <button
                                    key={k}
                                    onClick={() => {
                                        const newSel = [...yopSelections, k as ResourceType];
                                        setYopSelections(newSel);
                                        if (newSel.length === 2) {
                                            dispatch({ type: 'RESOLVE_YOP', resources: newSel as [ResourceType, ResourceType] });
                                            setYopSelections([]);
                                        }
                                    }}
                                    className="p-3 border rounded-lg hover:bg-emerald-50 hover:border-emerald-300 font-bold text-slate-700"
                                 >
                                     {RESOURCE_NAMES_CN[k as ResourceType]}
                                 </button>
                             )
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Controls Area - Mobile: Bottom 25vh fixed. Desktop: Floating Overlay */}
         <div className={`
            z-30
            /* Mobile Styles: Fixed bottom block, no scrolling */
            fixed bottom-0 left-0 right-0 h-[25vh]
            bg-slate-50 border-t border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.15)]
            flex flex-col
            
            /* Desktop Styles: Floating Card */
            md:absolute md:bottom-6 md:left-1/2 md:right-auto md:top-auto md:w-auto md:h-auto md:-translate-x-1/2 
            md:bg-white/95 md:rounded-2xl md:p-4 md:flex-row md:gap-6 md:items-end md:shadow-2xl md:border-t-0
         `}>
            
            {/* Mobile Only: Status Bar (Player, Dice, Phase) - Row 1 - Compact */}
            <div className="flex md:hidden justify-between items-center bg-orange-50 px-2 py-0.5 border-b border-orange-100 h-8 shrink-0">
                <div className="flex items-center gap-2">
                   <div className={`w-2.5 h-2.5 rounded-full bg-${currentPlayer.color === 'white' ? 'slate-200' : currentPlayer.color + '-500'}`}></div>
                   <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-700 leading-none">{currentPlayer.name}</span>
                        {currentPlayer.isAI && <RobotIcon />}
                   </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* VP - Clickable for details */}
                    <button 
                        onClick={() => { setScoreModalPlayerId(currentPlayer.id); setShowScoreModal(true); playSound('CLICK'); }}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-blue-600"
                    >
                        <TrophyIcon /> {currentPlayer.vp}/10
                    </button>
                    {/* Cards */}
                    <button onClick={() => { playSound('CLICK'); setShowMyCards(true); }} className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:bg-purple-100 px-1 rounded">
                        <CardIcon /> {currentPlayer.devCards.length + currentPlayer.newDevCards.length}
                    </button>
                    {/* Dice */}
                   {(gameState.dice[0] as number) > 0 ? (
                        <div className="text-sm font-mono font-black text-slate-800 flex items-center gap-1">
                           <DiceIcon /> {gameState.dice[0] + gameState.dice[1]}
                        </div>
                   ) : (
                       <span className="text-[10px] text-slate-400">...</span>
                   )}
                </div>
                
                <div className="text-right">
                    <div className={`text-[9px] font-bold ${isRobberPhase ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                        {getStatusText()}
                    </div>
                </div>
            </div>

            {/* Content Container - Grid Layout */}
            <div className="flex-1 min-h-0 p-1 md:p-0 grid grid-rows-[1fr_auto] gap-1 md:flex md:gap-6 md:items-end">
                
                {/* 1. Resources Area - Row 2 */}
                <div className="md:border-r md:border-slate-200 md:pr-4 flex flex-col justify-center min-h-0">
                    <div className="hidden md:block text-xs text-slate-400 font-bold uppercase mb-1">当前资源</div>
                    
                    {/* Mobile: Grid 5 cols, Desktop: Flex row */}
                    <div className="grid grid-cols-5 gap-1 h-full md:flex md:h-auto">
                        {Object.entries(currentPlayer.resources).map(([res, count]) => (
                            res !== 'Desert' && (
                                <React.Fragment key={res}>
                                    {/* Mobile View */}
                                    <div className="md:hidden h-full min-h-0">
                                        <CompactResourceItem type={res as ResourceType} count={count as number} />
                                    </div>
                                    {/* Desktop View */}
                                    <div className="hidden md:block">
                                        <ResourceCard type={res as ResourceType} count={count as number} />
                                    </div>
                                </React.Fragment>
                            )
                        ))}
                    </div>
                </div>

                {/* Bottom Row Container (Build + Buttons) - Row 3 - Compact Height */}
                <div className="grid grid-cols-[1.6fr_1fr] gap-1 md:flex md:gap-6 md:items-end h-12 md:h-auto">
                    
                    {/* 2. Build Area */}
                    <div className="md:border-r md:border-slate-200 md:pr-4">
                        <div className="hidden md:block text-xs text-slate-400 font-bold uppercase mb-1">建造与购买</div>
                        
                        {/* Mobile: Grid 4 cols, Desktop: Flex row */}
                        <div className="grid grid-cols-4 gap-1 h-full md:flex md:gap-2 md:h-auto">
                            <CompactBuildItem 
                                label="道路" cost="🌲🧱" canAfford={canAffordRoad} 
                                disabled={!isTurnActive}
                                onClick={() => { if(isTurnActive && canAffordRoad) playSound('CLICK'); }} 
                            />
                            <CompactBuildItem 
                                label="村庄" cost="🌲🧱🐏🌾" canAfford={canAffordSettlement} 
                                disabled={!isTurnActive}
                                onClick={() => { if(isTurnActive && canAffordSettlement) playSound('CLICK'); }} 
                            />
                            <CompactBuildItem 
                                label="城市" cost="🌾🌾🪨🪨🪨" canAfford={canAffordCity} 
                                disabled={!isTurnActive}
                                onClick={() => { if(isTurnActive && canAffordCity) playSound('CLICK'); }} 
                            />
                            <CompactBuildItem 
                                label="发展卡" cost="🐏🌾🪨" canAfford={canAffordDev} 
                                onClick={() => { playSound('CLICK'); dispatch({ type: 'BUY_DEV_CARD' }); }}
                                disabled={!isTurnActive}
                            />
                        </div>
                    </div>

                    {/* 3. Game Controls Area */}
                    <div className="grid grid-cols-2 gap-1 md:flex md:flex-col md:gap-2">
                         {/* Split roll/trade buttons */}
                         <div className="grid grid-rows-2 gap-1 md:hidden h-full">
                            <button 
                                onClick={handleRollDice} 
                                disabled={!isTurnActive || gameState.dice[0] > 0}
                                className="bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all text-[10px] flex items-center justify-center gap-1"
                            >
                                {gameState.dice[0] > 0 ? '已投' : '掷骰'}
                            </button>
                             <button 
                                onClick={() => { playSound('CLICK'); setTradeOpen(!tradeOpen); }}
                                disabled={!isTurnActive}
                                className="bg-emerald-600 text-white rounded font-bold shadow hover:bg-emerald-700 disabled:bg-slate-300 flex items-center justify-center"
                            >
                               <TradeIcon />
                            </button>
                         </div>

                        {/* End Turn Big Button */}
                        <button 
                            onClick={handleEndTurn}
                            disabled={!isTurnActive || gameState.dice[0] === 0}
                            className="bg-red-500 text-white rounded font-bold shadow hover:bg-red-600 disabled:bg-slate-300 disabled:shadow-none transition-all text-[10px] md:hidden"
                        >
                            结束
                        </button>

                        {/* Desktop Buttons (Hidden on mobile) */}
                        <div className="hidden md:flex flex-col gap-2">
                             <button 
                                onClick={handleRollDice} 
                                disabled={!isTurnActive || gameState.dice[0] > 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all whitespace-nowrap"
                            >
                                {gameState.dice[0] > 0 ? `已投: ${gameState.dice[0] + gameState.dice[1]}` : '掷骰子'}
                            </button>
                            
                            <button 
                                onClick={handleEndTurn}
                                disabled={!isTurnActive || gameState.dice[0] === 0}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold shadow hover:bg-red-600 disabled:opacity-50 disabled:shadow-none transition-all whitespace-nowrap"
                            >
                                结束回合
                            </button>

                            <button 
                                onClick={() => { playSound('CLICK'); setTradeOpen(!tradeOpen); }}
                                disabled={!isTurnActive}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center"
                            >
                               <TradeIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
         </div>

         {/* Trade Modal - Centered Fixed */}
         {tradeOpen && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-4 rounded-xl shadow-2xl w-full max-w-md border border-slate-100 max-h-[90vh] overflow-y-auto">
                     <div className="flex justify-between items-center mb-4 border-b pb-2">
                         <h3 className="font-bold text-lg text-slate-800">交易中心</h3>
                         <button onClick={() => setTradeOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                     </div>
                     
                     <div className="flex gap-3">
                         {/* Left: Pay */}
                         <div className="flex-1">
                             <h4 className="text-xs font-bold text-red-600 uppercase mb-2 text-center tracking-wider bg-red-50 py-1 rounded">
                                 支付
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                {Object.keys(tradeRatios).map(resKey => {
                                    const r = resKey as ResourceType;
                                    if (r === ResourceType.DESERT) return null;
                                    const ratio = tradeRatios[r];
                                    const count = currentPlayer.resources[r];
                                    const isSelected = tradeGive === r;
                                    const canAfford = count >= ratio;

                                    return (
                                        <button 
                                            key={r}
                                            onClick={() => canAfford ? setTradeGive(r) : null}
                                            disabled={!canAfford}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all aspect-[4/3] ${
                                                isSelected 
                                                    ? 'border-red-500 bg-red-50 ring-2 ring-red-100 z-10' 
                                                    : canAfford 
                                                        ? 'border-slate-200 hover:border-red-300 hover:bg-slate-50' 
                                                        : 'border-slate-100 opacity-40 grayscale cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-slate-700 mb-1">{RESOURCE_NAMES_CN[r]}</div>
                                            <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-mono mb-1">
                                                持有: {count}
                                            </div>
                                            <div className={`text-[10px] font-bold px-1.5 rounded border ${
                                                canAfford ? 'text-red-600 border-red-200 bg-white' : 'text-slate-400 border-slate-200'
                                            }`}>
                                                {ratio}:1
                                            </div>
                                        </button>
                                    );
                                })}
                             </div>
                         </div>

                         {/* Divider */}
                         <div className="w-px bg-slate-200 my-2"></div>

                         {/* Right: Receive */}
                         <div className="flex-1">
                             <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 text-center tracking-wider bg-emerald-50 py-1 rounded">
                                 获取
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                 {Object.keys(RESOURCE_NAMES_CN).map(resKey => {
                                     const r = resKey as ResourceType;
                                     if (r === ResourceType.DESERT) return null;
                                     const isSelected = tradeReceive === r;
                                     const isGive = r === tradeGive;

                                     return (
                                         <button
                                            key={r}
                                            onClick={() => setTradeReceive(r)}
                                            disabled={isGive}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all aspect-[4/3] ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100 z-10'
                                                    : isGive 
                                                        ? 'opacity-20 cursor-not-allowed border-slate-100'
                                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                            }`}
                                         >
                                             <div className="text-xs font-bold text-slate-700 mb-1">{RESOURCE_NAMES_CN[r]}</div>
                                             {/* Visual Placeholder for Receive */}
                                             <div className="text-emerald-500 mb-1">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                                             </div>
                                             <div className="text-[10px] text-emerald-600 font-bold">
                                                 +1
                                             </div>
                                         </button>
                                     );
                                 })}
                             </div>
                         </div>
                     </div>

                     {/* Footer */}
                     <div className="mt-6 pt-3 border-t flex justify-between items-center">
                         <div className="text-xs text-slate-500 font-medium">
                            {tradeGive && tradeReceive ? (
                                <span className="flex items-center gap-1">
                                    <span className="text-red-600 font-bold">-{tradeRatios[tradeGive]} {RESOURCE_NAMES_CN[tradeGive]}</span>
                                    <span className="text-slate-300">→</span>
                                    <span className="text-emerald-600 font-bold">+1 {RESOURCE_NAMES_CN[tradeReceive]}</span>
                                </span>
                            ) : (
                                <span>请选择资源...</span>
                            )}
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => setTradeOpen(false)} className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">
                                取消
                            </button>
                            <button 
                                onClick={handleExecuteTrade}
                                disabled={!tradeGive || !tradeReceive}
                                className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                确认交易
                            </button>
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* AI Advisor - Fixed Position Top Right */}
         <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col items-end gap-2 z-40 pointer-events-none">
             <div className="pointer-events-auto">
             {gameState.aiAdvice && (
                 <div className="bg-white p-4 rounded-xl shadow-xl max-w-[280px] md:max-w-xs mb-2 border-l-4 border-purple-500 animate-in fade-in slide-in-from-right-10">
                     <p className="text-sm text-slate-700 italic">"{gameState.aiAdvice}"</p>
                     <button onClick={() => dispatch({ type: 'SET_AI_ADVICE', advice: '' })} className="text-[10px] text-slate-400 mt-2 hover:text-red-500">关闭消息</button>
                 </div>
             )}
             
             {!isAiTurn && (
             <button 
                onClick={handleAskAI}
                disabled={gameState.isAiThinking}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-105 disabled:opacity-70"
            >
                {gameState.isAiThinking ? (
                    <span className="animate-pulse text-xs md:text-sm">...</span>
                ) : (
                    <>
                        <BrainIcon />
                        <span className="font-bold hidden md:inline">AI 顾问</span>
                    </>
                )}
             </button>
             )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default App;