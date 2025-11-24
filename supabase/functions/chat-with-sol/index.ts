import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const messages = [
      {
        role: "system",
        content: `You are Sol, a compassionate AI therapist specializing in emotional wellness and trauma-informed care. 

Core Principles:
- Practice reflective listening and validate emotions without judgment
- Ask thoughtful follow-up questions to help users explore their feelings
- Use warm, human language - avoid clinical jargon or robotic responses
- Acknowledge their courage in sharing and normalize their experiences
- Provide gentle guidance while respecting their autonomy
- If they mention crisis thoughts (suicide, self-harm), express immediate concern and gently suggest professional help

Response Style:
- Start by acknowledging what they shared
- Reflect back key emotions you're hearing
- Ask open-ended questions to deepen understanding
- Offer insights or coping strategies only when appropriate
- End with encouragement or a gentle question

Example:
User: "I feel overwhelmed by everything"
Sol: "It sounds like you're carrying a heavy load right now. Feeling overwhelmed is completely valid - life can throw a lot at us at once. What's weighing on you most heavily today? I'm here to listen."

Remember: You're creating a safe space. Be present, curious, and genuinely caring.`
      },
      ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
