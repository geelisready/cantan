
export enum ResourceType {
  WOOD = 'Wood',
  BRICK = 'Brick',
  SHEEP = 'Sheep',
  WHEAT = 'Wheat',
  ORE = 'Ore',
  DESERT = 'Desert',
}

export enum BuildingType {
  ROAD = 'Road',
  SETTLEMENT = 'Settlement',
  CITY = 'City',
  DEV_CARD = 'DevCard',
}

export enum DevCardType {
  KNIGHT = 'Knight', // 骑士
  VICTORY_POINT = 'VictoryPoint', // 胜利点
  ROAD_BUILDING = 'RoadBuilding', // 道路建设
  MONOPOLY = 'Monopoly', // 垄断
  YEAR_OF_PLENTY = 'YearOfPlenty', // 丰收之年
}

export enum PlayerColor {
  RED = 'red',
  BLUE = 'blue',
  WHITE = 'white',
  ORANGE = 'orange',
}

export type SoundEffectType = 'START' | 'DICE' | 'COIN' | 'BUILD' | 'ROBBER' | 'STEAL' | 'TRADE' | 'END_TURN' | 'PLAY_CARD' | 'ERROR' | 'CLICK';

export interface Player {
  id: number;
  name: string;
  color: PlayerColor;
  isAI: boolean; // New field
  resources: Record<ResourceType, number>;
  devCards: DevCardType[]; // Owned cards (usable)
  newDevCards: DevCardType[]; // Owned cards (bought this turn, unusable)
  vp: number;
  roadsLeft: number;
  settlementsLeft: number;
  citiesLeft: number;
  toDiscard: number;
}

export interface Hex {
  id: string;
  q: number;
  r: number;
  s: number;
  resource: ResourceType;
  numberToken: number | null;
}

export interface Node {
  id: string;
  x: number;
  y: number;
  ownerId: number | null;
  building: BuildingType | null;
  hexIds: string[];
  portResource?: ResourceType | '3:1';
}

export interface Edge {
  id: string;
  nodeId1: string;
  nodeId2: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ownerId: number | null;
}

export interface Port {
    id: string;
    nodeId1: string;
    nodeId2: string;
    resource: ResourceType | '3:1';
    x: number;
    y: number;
    angle: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: {
    hexes: Hex[];
    nodes: Node[];
    edges: Edge[];
    ports: Port[];
  };
  devCardDeck: DevCardType[];
  robberHexId: string | null;
  dice: [number, number];
  gamePhase: 'GAME_START' | 'SETUP_ROUND_1' | 'SETUP_ROUND_2' | 'PLAYING' | 'ROBBER_DISCARD' | 'ROBBER_MOVE' | 'ROBBER_STEAL' | 'GAME_OVER' | 'DEV_MONOPOLY' | 'DEV_YOP';
  setupStep: 'SETTLEMENT' | 'ROAD' | null;
  log: string[];
  aiAdvice: string | null;
  isAiThinking: boolean;
  soundEffect: SoundEffectType | null;
}

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '#228B22',
  [ResourceType.BRICK]: '#B22222',
  [ResourceType.SHEEP]: '#90EE90',
  [ResourceType.WHEAT]: '#DAA520',
  [ResourceType.ORE]: '#708090',
  [ResourceType.DESERT]: '#F4A460',
};

export const RESOURCE_NAMES_CN: Record<ResourceType, string> = {
  [ResourceType.WOOD]: '木材',
  [ResourceType.BRICK]: '砖块',
  [ResourceType.SHEEP]: '羊毛',
  [ResourceType.WHEAT]: '小麦',
  [ResourceType.ORE]: '矿石',
  [ResourceType.DESERT]: '沙漠',
};

export const DEV_CARD_NAMES_CN: Record<DevCardType, string> = {
    [DevCardType.KNIGHT]: '骑士',
    [DevCardType.VICTORY_POINT]: '胜利点',
    [DevCardType.ROAD_BUILDING]: '道路建设',
    [DevCardType.MONOPOLY]: '垄断',
    [DevCardType.YEAR_OF_PLENTY]: '丰收之年',
};

export const BUILDING_COSTS: Record<BuildingType, Partial<Record<ResourceType, number>>> = {
  [BuildingType.ROAD]: { [ResourceType.WOOD]: 1, [ResourceType.BRICK]: 1 },
  [BuildingType.SETTLEMENT]: { [ResourceType.WOOD]: 1, [ResourceType.BRICK]: 1, [ResourceType.WHEAT]: 1, [ResourceType.SHEEP]: 1 },
  [BuildingType.CITY]: { [ResourceType.WHEAT]: 2, [ResourceType.ORE]: 3 },
  [BuildingType.DEV_CARD]: { [ResourceType.SHEEP]: 1, [ResourceType.WHEAT]: 1, [ResourceType.ORE]: 1 },
};

// --- Reducer Actions ---
export type Action = 
  | { type: 'INIT_GAME' }
  | { type: 'START_GAME' }
  | { type: 'TOGGLE_PLAYER_AI'; playerId: number }
  | { type: 'ADD_PLAYER' }
  | { type: 'REMOVE_PLAYER'; playerId: number }
  | { type: 'ROLL_DICE'; roll: [number, number] }
  | { type: 'BUILD_ROAD'; edgeId: string }
  | { type: 'BUILD_SETTLEMENT'; nodeId: string }
  | { type: 'BUILD_CITY'; nodeId: string }
  | { type: 'BUY_DEV_CARD' }
  | { type: 'PLAY_DEV_CARD'; cardType: DevCardType }
  | { type: 'RESOLVE_MONOPOLY'; resource: ResourceType }
  | { type: 'RESOLVE_YOP'; resources: [ResourceType, ResourceType] }
  | { type: 'END_TURN' }
  | { type: 'SET_AI_ADVICE'; advice: string }
  | { type: 'SET_AI_THINKING'; isThinking: boolean }
  | { type: 'TRADE_BANK'; resourceGiven: ResourceType; resourceReceived: ResourceType }
  | { type: 'DISCARD_RESOURCE'; resource: ResourceType }
  | { type: 'MOVE_ROBBER'; hexId: string }
  | { type: 'STEAL_RESOURCE'; targetPlayerId: number }
  | { type: 'CLEAR_SOUND_EFFECT' };
