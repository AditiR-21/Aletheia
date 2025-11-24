export interface EmotionData {
  emoji: string;
  color: string;
  gradient: string;
  quote: string;
  music: string;
}

export const emotionConfig: Record<string, EmotionData> = {
  happy: {
    emoji: "😊",
    color: "#FFD700",
    gradient: "from-yellow-400 to-orange-400",
    quote: "Happiness is not something ready made. It comes from your own actions.",
    music: "Happy - Pharrell Williams",
  },
  sad: {
    emoji: "😢",
    color: "#4A90E2",
    gradient: "from-blue-400 to-blue-600",
    quote: "Tears are words that need to be written.",
    music: "Someone Like You - Adele",
  },
  anxious: {
    emoji: "😰",
    color: "#FF6B6B",
    gradient: "from-red-400 to-orange-500",
    quote: "You are braver than you believe, stronger than you seem.",
    music: "Breathe Me - Sia",
  },
  angry: {
    emoji: "😠",
    color: "#E74C3C",
    gradient: "from-red-500 to-red-700",
    quote: "Holding onto anger is like drinking poison and expecting the other person to die.",
    music: "Let It Go - James Bay",
  },
  calm: {
    emoji: "😌",
    color: "#95E1D3",
    gradient: "from-teal-300 to-cyan-400",
    quote: "Peace comes from within. Do not seek it without.",
    music: "Weightless - Marconi Union",
  },
  stressed: {
    emoji: "😖",
    color: "#9B59B6",
    gradient: "from-purple-500 to-pink-500",
    quote: "It's not the load that breaks you down, it's the way you carry it.",
    music: "Calm Down - Rema",
  },
  confused: {
    emoji: "😕",
    color: "#95A5A6",
    gradient: "from-gray-400 to-gray-600",
    quote: "Confusion is a word we have invented for an order which is not understood.",
    music: "The Sound of Silence - Simon & Garfunkel",
  },
  excited: {
    emoji: "🤩",
    color: "#F39C12",
    gradient: "from-orange-400 to-pink-500",
    quote: "Energy and persistence conquer all things.",
    music: "Can't Stop the Feeling - Justin Timberlake",
  },
};

export const getEmotionData = (emotion: string): EmotionData => {
  const normalized = emotion.toLowerCase().trim();
  return emotionConfig[normalized] || emotionConfig.calm;
};
