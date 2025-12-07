import { GoogleGenAI } from "@google/genai";
import { GameState, Player, ResourceType, BUILDING_COSTS } from "../types";

// Helper to safely get API key
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export const getAiAdvice = async (gameState: GameState): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "要使用 AI 顾问，请配置 API_KEY。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Simplify state for the prompt
  const simpleState = {
    turn: `当前玩家: ${currentPlayer.name}`,
    resources: currentPlayer.resources,
    victoryPoints: currentPlayer.vp,
    diceLastRolled: gameState.dice[0] + gameState.dice[1],
    gamePhase: gameState.gamePhase,
    boardSummary: "标准卡坦岛布局",
    buildingCosts: BUILDING_COSTS
  };

  const prompt = `
    你是一位精通桌游《卡坦岛》的专家。
    请分析以下 JSON 格式的游戏状态。
    
    当前状态:
    ${JSON.stringify(simpleState, null, 2)}

    你的目标是给当前玩家提供一条简短的战略建议（最多2句话）。
    请根据他们当前的资源，重点建议他们应该建造什么或进行什么交易。
    语言风格要风趣但实用。请用中文回答。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "卡坦岛的精灵此刻保持沉默。（AI 错误）";
  }
};