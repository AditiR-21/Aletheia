import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Play, Pause, Volume2, BarChart3, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MeditationHistory from "@/components/MeditationHistory";

const meditationTypes = [
  { id: "calm", label: "Calming Meditation", duration: 5, emoji: "🧘" },
  { id: "stress", label: "Stress Relief", duration: 7, emoji: "😌" },
  { id: "sleep", label: "Sleep Meditation", duration: 10, emoji: "😴" },
  { id: "gratitude", label: "Gratitude Practice", duration: 5, emoji: "🙏" },
  { id: "anxiety", label: "Anxiety Relief", duration: 8, emoji: "💜" },
];

const Meditation = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meditationScript, setMeditationScript] = useState("");
  const [currentSegment, setCurrentSegment] = useState(0);
  const [volume, setVolume] = useState([0.5]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [emotionBefore, setEmotionBefore] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize background music
    musicRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/03/10/audio_2c4d3f3cd2.mp3");
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;

    // Fetch personalized recommendation
    fetchRecommendation();

    return () => {
      stopMeditation();
    };
  }, []);

  const fetchRecommendation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent emotion analyses (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: analyses } = await supabase
        .from("emotion_analyses")
        .select("emotion")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      const recentEmotions = analyses?.map(a => a.emotion) || [];

      const { data } = await supabase.functions.invoke("meditation-ai", {
        body: { type: "recommendation", recentEmotions }
      });

      if (data?.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch (error) {
      console.error("Error fetching recommendation:", error);
    }
  };

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume[0] * 0.3;
    }
  }, [volume]);

  const startMeditation = async (type: string) => {
    setLoading(true);
    setSelectedType(type);
    setSessionStartTime(new Date());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Detect emotion before session (from recent analyses)
      const { data: recentAnalysis } = await supabase
        .from("emotion_analyses")
        .select("emotion, intensity")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentAnalysis) {
        setEmotionBefore(recentAnalysis.emotion);
      }

      const { data, error } = await supabase.functions.invoke("generate-meditation", {
        body: { type, duration: meditationTypes.find(t => t.id === type)?.duration || 5 },
      });

      if (error) throw error;

      setMeditationScript(data.script);
      const segments = data.script.split("\n\n").filter((s: string) => s.trim());
      
      // Start background music
      if (musicRef.current) {
        musicRef.current.play();
      }

      // Start voice narration
      speakSegment(segments, 0);
      setIsPlaying(true);

      toast({
        title: "Meditation Started",
        description: "Find a comfortable position and breathe deeply",
      });
    } catch (error: any) {
      console.error("Error starting meditation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start meditation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const speakSegment = (segments: string[], index: number) => {
    if (index >= segments.length) {
      completeMeditation();
      return;
    }

    setCurrentSegment(index);

    const utterance = new SpeechSynthesisUtterance(segments[index]);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = volume[0];
    utterance.lang = "en-US";

    utterance.onend = () => {
      setTimeout(() => speakSegment(segments, index + 1), 2000);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseMeditation = () => {
    window.speechSynthesis.pause();
    if (musicRef.current) {
      musicRef.current.pause();
    }
    setIsPlaying(false);
  };

  const resumeMeditation = () => {
    window.speechSynthesis.resume();
    if (musicRef.current) {
      musicRef.current.play();
    }
    setIsPlaying(true);
  };

  const completeMeditation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionStartTime || !selectedType) return;

      const duration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
      
      // Generate AI summary
      let aiSummary = null;
      if (emotionBefore) {
        const { data } = await supabase.functions.invoke("meditation-ai", {
          body: { 
            type: "summary", 
            emotionBefore,
            emotionAfter: "peaceful"
          }
        });
        aiSummary = data?.summary;
      }

      // Save session to database
      await supabase.from("meditation_sessions").insert({
        user_id: user.id,
        meditation_type: selectedType,
        duration_minutes: duration,
        emotion_before: emotionBefore,
        emotion_after: "peaceful",
        ai_summary: aiSummary,
        completed_at: new Date().toISOString()
      });

      toast({
        title: "Meditation Complete",
        description: aiSummary || "You did wonderful. Take your time returning to the present.",
      });
    } catch (error) {
      console.error("Error completing meditation:", error);
    } finally {
      stopMeditation();
    }
  };

  const stopMeditation = () => {
    window.speechSynthesis.cancel();
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setSelectedType(null);
    setCurrentSegment(0);
    setMeditationScript("");
    setSessionStartTime(null);
    setEmotionBefore(null);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center breathing-animation">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">Guided Meditation</h1>
              <p className="text-muted-foreground mt-2">Find peace through mindful breathing and relaxation</p>
            </div>
          </div>

          {/* AI Recommendation */}
          {recommendation && !selectedType && (
            <Card className="glass-card border-2 border-primary/30 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <Lightbulb className="w-5 h-5" />
                  Recommended for You Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{recommendation}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="practice" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="practice" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-6">

          {!selectedType ? (
            <div className="grid md:grid-cols-2 gap-6">
              {meditationTypes.map((type) => (
                <Card
                  key={type.id}
                  className="glass-card border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => startMeditation(type.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {type.emoji}
                    </div>
                    <h3 className="text-2xl font-semibold mb-2 gradient-text">{type.label}</h3>
                    <p className="text-muted-foreground mb-4">{type.duration} minutes</p>
                    <Button
                      disabled={loading}
                      className="w-full gradient-bg hover:opacity-90 transition-opacity"
                    >
                      {loading ? "Starting..." : "Begin Session"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-2">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto rounded-full gradient-bg breathing-animation flex items-center justify-center mb-6">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold gradient-text mb-2">
                    {meditationTypes.find(t => t.id === selectedType)?.label}
                  </h2>
                  <p className="text-muted-foreground">
                    {isPlaying ? "Breathe deeply and follow the guidance" : "Paused"}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 justify-center">
                    {!isPlaying ? (
                      <Button
                        onClick={resumeMeditation}
                        size="lg"
                        className="gradient-bg hover:opacity-90 transition-opacity"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseMeditation}
                        size="lg"
                        variant="secondary"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={stopMeditation} size="lg" variant="outline">
                      End Session
                    </Button>
                  </div>

                  <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">Volume</span>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {meditationScript && (
                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 max-h-64 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {meditationScript}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
            </TabsContent>

            <TabsContent value="history">
              <MeditationHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Meditation;
