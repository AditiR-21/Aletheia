const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const meditationPrompts = {
  calm: "Create a calming 5-minute meditation script. Focus on breathing exercises, body relaxation, and peaceful visualization. Use soothing language.",
  stress: "Create a 7-minute stress relief meditation script. Guide the user through releasing tension, calming the nervous system, and finding inner peace.",
  sleep: "Create a 10-minute sleep meditation script. Help the user relax deeply, let go of the day, and drift into peaceful sleep. Use very slow, gentle language.",
  gratitude: "Create a 5-minute gratitude meditation script. Guide the user to reflect on things they're grateful for and cultivate appreciation.",
  anxiety: "Create an 8-minute anxiety relief meditation script. Focus on grounding techniques, breath work, and gentle reassurance to calm anxious thoughts.",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, duration } = await req.json();

    if (!type || !meditationPrompts[type as keyof typeof meditationPrompts]) {
      throw new Error('Invalid meditation type');
    }

    const prompt = meditationPrompts[type as keyof typeof meditationPrompts];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a gentle, compassionate meditation guide. Create meditation scripts that are:
- Slow-paced with natural pauses
- Use calming, peaceful language
- Include breathing instructions
- Focus on relaxation and mindfulness
- Divided into clear segments with line breaks
- Approximately ${duration} minutes when read slowly
- Avoid any markdown or special formatting`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI request failed: ${error}`);
    }

    const data = await response.json();
    const script = data.choices[0].message.content;

    console.log("Generated meditation script:", script.substring(0, 100));

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating meditation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
