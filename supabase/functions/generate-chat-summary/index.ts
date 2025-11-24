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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const conversationText = messages
      .map((m: any) => `${m.role === "user" ? "User" : "Sol"}: ${m.content}`)
      .join("\n\n");

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
            content: "You are an AI therapist analyzing conversation summaries. Extract key emotional insights."
          },
          {
            role: "user",
            content: `Analyze this therapy conversation and provide a structured summary in JSON format:

${conversationText}

Return ONLY valid JSON with this exact structure:
{
  "dominant_emotion": "primary emotion expressed (e.g., anxiety, sadness, joy)",
  "key_topics": ["topic1", "topic2", "topic3"],
  "worries": ["worry1", "worry2"],
  "reflective_suggestions": "A paragraph of reflective insights and suggestions",
  "positive_reinforcement": "Encouraging words about their progress or strengths",
  "recommended_next_steps": ["step1", "step2", "step3"]
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const summaryText = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse summary");
    }
    
    const summary = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
