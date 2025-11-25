import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, emotionBefore, emotionAfter, recentEmotions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate AI summary if we have emotion data
    let summary = null;
    if (type === 'summary' && emotionBefore) {
      const summaryPrompt = `Based on a user who felt ${emotionBefore} before meditation and ${emotionAfter || 'completed'} after, write a brief, encouraging 2-sentence post-session summary. Be warm and personal.`;
      
      const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a compassionate meditation guide. Keep responses brief and encouraging.' },
            { role: 'user', content: summaryPrompt }
          ],
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await summaryResponse.json();
      summary = summaryData.choices[0].message.content;
    }

    // Generate personalized recommendation
    if (type === 'recommendation') {
      const emotionsList = recentEmotions && recentEmotions.length > 0 
        ? recentEmotions.join(', ') 
        : 'neutral';
      
      const recommendPrompt = `A user has been feeling: ${emotionsList}. Recommend ONE specific meditation type (from: calming, stress relief, sleep, gratitude, or anxiety relief) and explain why in 1-2 sentences. Be warm and supportive.`;
      
      const recResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a compassionate meditation guide recommending meditation types.' },
            { role: 'user', content: recommendPrompt }
          ],
        }),
      });

      if (!recResponse.ok) {
        throw new Error('Failed to generate recommendation');
      }

      const recData = await recResponse.json();
      const recommendation = recData.choices[0].message.content;

      return new Response(JSON.stringify({ recommendation }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in meditation-ai:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});