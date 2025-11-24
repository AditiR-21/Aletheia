import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emotionConfig: any = {
  happy: {
    emoji: "😊",
    color: "#FFD700",
    quote: "Happiness is not something ready made. It comes from your own actions.",
    music: "Happy - Pharrell Williams",
  },
  sad: {
    emoji: "😢",
    color: "#4A90E2",
    quote: "Tears are words that need to be written.",
    music: "Someone Like You - Adele",
  },
  anxious: {
    emoji: "😰",
    color: "#FF6B6B",
    quote: "You are braver than you believe, stronger than you seem.",
    music: "Breathe Me - Sia",
  },
  angry: {
    emoji: "😠",
    color: "#E74C3C",
    quote: "Holding onto anger is like drinking poison and expecting the other person to die.",
    music: "Let It Go - James Bay",
  },
  calm: {
    emoji: "😌",
    color: "#95E1D3",
    quote: "Peace comes from within. Do not seek it without.",
    music: "Weightless - Marconi Union",
  },
  stressed: {
    emoji: "😖",
    color: "#9B59B6",
    quote: "It's not the load that breaks you down, it's the way you carry it.",
    music: "Calm Down - Rema",
  },
  confused: {
    emoji: "😕",
    color: "#95A5A6",
    quote: "Confusion is a word we have invented for an order which is not understood.",
    music: "The Sound of Silence - Simon & Garfunkel",
  },
  excited: {
    emoji: "🤩",
    color: "#F39C12",
    quote: "Energy and persistence conquer all things.",
    music: "Can't Stop the Feeling - Justin Timberlake",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert emotional wellness AI that analyzes text for emotions. 

Analyze the user's text and respond with ONLY a JSON object (no markdown, no code fences) with this exact structure:
{
  "emotion": "<one of: happy, sad, anxious, angry, calm, stressed, confused, excited>",
  "intensity": <number between 0 and 1>,
  "summary": "<brief 1-2 sentence summary of the emotional state>"
}

Rules:
- Choose the PRIMARY emotion that best matches the text
- intensity should reflect how strongly the emotion is expressed (0.1 = very mild, 1.0 = extremely intense)
- summary should be empathetic and insightful
- Return ONLY valid JSON, no other text`
          },
          { role: "user", content: text }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log("AI Response:", content);

    // Parse the JSON response
    let parsedAnalysis;
    try {
      // Remove markdown code fences if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse emotion analysis");
    }

    // Validate and normalize emotion
    const validEmotions = ["happy", "sad", "anxious", "angry", "calm", "stressed", "confused", "excited"];
    const emotion = validEmotions.includes(parsedAnalysis.emotion?.toLowerCase()) 
      ? parsedAnalysis.emotion.toLowerCase() 
      : "calm";

    const emotionData = emotionConfig[emotion] || emotionConfig.calm;

    // Build final result
    const result = {
      emotion,
      intensity: Math.max(0, Math.min(1, parsedAnalysis.intensity || 0.5)),
      summary: parsedAnalysis.summary || "Your emotional state has been analyzed.",
      emoji: emotionData.emoji,
      quote: emotionData.quote,
      song: emotionData.music,
      color: emotionData.color,
      suggestion: `Take a moment to ${emotion === 'anxious' ? 'breathe deeply and ground yourself' : 
                                     emotion === 'sad' ? 'acknowledge your feelings and be gentle with yourself' :
                                     emotion === 'angry' ? 'step back and find healthy outlets for your emotions' :
                                     emotion === 'stressed' ? 'pause and prioritize self-care' :
                                     emotion === 'confused' ? 'write down your thoughts to gain clarity' :
                                     emotion === 'excited' ? 'channel this energy into something meaningful' :
                                     emotion === 'happy' ? 'savor this moment and share your joy' :
                                     'reflect on your inner peace'}.`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-emotion:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
