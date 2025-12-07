
import { GameState, BUILDING_COSTS } from "../types";

// Configuration with Vite support (import.meta.env) and fallback to process.env
const getEnvVar = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

const API_KEY = getEnvVar('VITE_AI_API_KEY');
// Default to OpenAI URL, but allow override for DeepSeek/Local
const BASE_URL = getEnvVar('VITE_AI_BASE_URL') || 'https://api.openai.com/v1';
const MODEL = getEnvVar('VITE_AI_MODEL') || 'gpt-3.5-turbo';

export const getAiAdvice = async (gameState: GameState): Promise<string> => {
  if (!API_KEY && BASE_URL.includes('openai.com')) {
    return "请配置 VITE_AI_API_KEY 环境变量以使用 AI 顾问。";
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Simplify state for the prompt to reduce token usage
  const simpleState = {
    turn: `当前玩家: ${currentPlayer.name}`,
    resources: currentPlayer.resources,
    victoryPoints: currentPlayer.vp,
    devCards: currentPlayer.devCards.length,
    diceLastRolled: gameState.dice[0] + gameState.dice[1],
    gamePhase: gameState.gamePhase,
    boardSummary: "标准卡坦岛布局",
    buildingCosts: BUILDING_COSTS
  };

  const systemPrompt = `
    你是一位精通桌游《卡坦岛》的专家。
    你的目标是给当前玩家提供一条简短、幽默但极具战略价值的建议（最多2句话）。
    重点分析他们当前的资源缺口，建议建造什么，或者进行什么交易。
    请用中文回答。
  `;

  const userPrompt = `
    当前游戏状态 JSON:
    ${JSON.stringify(simpleState, null, 2)}
  `;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "AI 似乎在打盹（无响应）。";

  } catch (error) {
    console.error("AI Service Error:", error);
    return "卡坦岛的精灵此刻保持沉默。（连接错误，请检查 API 配置）";
  }
};
