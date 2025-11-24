-- Create conversation_summaries table
CREATE TABLE public.conversation_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dominant_emotion TEXT NOT NULL,
  key_topics TEXT[] NOT NULL DEFAULT '{}',
  worries TEXT[] NOT NULL DEFAULT '{}',
  reflective_suggestions TEXT NOT NULL,
  positive_reinforcement TEXT NOT NULL,
  recommended_next_steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own summaries"
ON public.conversation_summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries"
ON public.conversation_summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
ON public.conversation_summaries
FOR DELETE
USING (auth.uid() = user_id);