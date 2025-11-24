import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mic, Quote, Music, Lightbulb, BookHeart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Analyze = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: "Listening...", description: "Speak your feelings" });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Could not capture voice",
        variant: "destructive",
      });
    };

    recognition.start();
  };

  const analyzeEmotion = async () => {
    if (!text.trim()) {
      toast({
        title: "Please enter some text",
        description: "Share your feelings to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-emotion", {
        body: { text },
      });

      if (error) throw error;

      setAnalysis(data);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("emotion_analyses").insert({
          user_id: user.id,
          text,
          emotion: data.emotion,
          intensity: data.intensity,
          summary: data.summary,
          quote: data.quote,
          song_recommendation: data.song,
          guided_suggestion: data.suggestion,
        });
      }
      
      toast({
        title: "Analysis complete!",
        description: "Your emotional insights are ready",
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createJournalEntry = () => {
    if (!analysis) return;
    navigate("/journal", {
      state: {
        content: text,
        emotion: analysis.emotion,
        intensity: analysis.intensity,
      },
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto fade-in">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4 breathing-animation">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Emotion Analysis
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your feelings through text or voice, and receive AI-powered emotional insights
            </p>
          </div>

          <Card className="glass-card border-2 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">How are you feeling?</CardTitle>
              <CardDescription>Type or speak to analyze your emotions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="I'm feeling..."
                className="min-h-[150px] text-base resize-none"
              />
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={analyzeEmotion}
                  disabled={isAnalyzing || !text.trim()}
                  className="gradient-bg text-white hover:opacity-90 flex-1 sm:flex-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={startVoiceInput}
                  disabled={isListening}
                  variant="outline"
                  className="border-2 border-primary flex-1 sm:flex-none"
                >
                  <Mic className={`w-4 h-4 mr-2 ${isListening ? "animate-pulse text-red-500" : ""}`} />
                  {isListening ? "Listening..." : "Voice Input"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <div className="space-y-6 fade-in">
              <Card className="glass-card border-2 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10 blur-3xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${analysis.color}, transparent)` }}
                />
                <CardHeader className="relative">
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <span className="text-5xl animate-bounce">{analysis.emoji}</span>
                    <div>
                      <div className="capitalize">{analysis.emotion}</div>
                      <p className="text-sm font-normal text-muted-foreground mt-1">
                        Emotional Analysis Complete
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Emotion Detected
                    </h3>
                    <div 
                      className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-lg"
                      style={{ 
                        backgroundColor: `${analysis.color}15`,
                        borderColor: analysis.color,
                        boxShadow: `0 0 20px ${analysis.color}40`
                      }}
                    >
                      <span className="text-3xl">{analysis.emoji}</span>
                      <div>
                        <span className="font-bold capitalize text-lg block">{analysis.emotion}</span>
                        <span className="text-xs opacity-70">
                          Intensity: {Math.round(analysis.intensity * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Intensity Level</h3>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 shadow-lg"
                        style={{ 
                          width: `${analysis.intensity * 100}%`,
                          background: `linear-gradient(90deg, ${analysis.color}, ${analysis.color}cc)`,
                          boxShadow: `0 0 10px ${analysis.color}`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {analysis.intensity < 0.3 ? 'Mild' : analysis.intensity < 0.7 ? 'Moderate' : 'Strong'} emotional intensity
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-2xl p-4 border">
                    <h3 className="font-semibold text-lg mb-2">Summary</h3>
                    <p className="text-foreground/80 leading-relaxed">{analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <InsightCard
                  icon={Quote}
                  title="Inspiring Quote"
                  content={analysis.quote}
                  gradient="from-purple-500 to-pink-500"
                  color={analysis.color}
                />
                <InsightCard
                  icon={Music}
                  title="Song Recommendation"
                  content={analysis.song}
                  gradient="from-blue-500 to-purple-500"
                  color={analysis.color}
                />
                <InsightCard
                  icon={Lightbulb}
                  title="Guided Suggestion"
                  content={analysis.suggestion}
                  gradient="from-indigo-500 to-purple-500"
                  color={analysis.color}
                />
              </div>

              <Card className="glass-card border-2">
                <CardContent className="pt-6">
                  <Button
                    onClick={createJournalEntry}
                    className="w-full gradient-bg text-white hover:opacity-90 text-lg py-6"
                  >
                    <BookHeart className="w-5 h-5 mr-2" />
                    Create Journal Entry
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const InsightCard = ({ icon: Icon, title, content, gradient, color }: any) => (
  <Card className="glass-card border-2 hover:shadow-xl transition-all hover:-translate-y-1 duration-300 relative overflow-hidden group">
    <div 
      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity blur-2xl"
      style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent)` }}
    />
    <CardHeader className="relative">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <CardTitle className="text-lg font-bold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="relative">
      <p className="text-sm text-foreground/90 leading-relaxed">{content}</p>
    </CardContent>
  </Card>
);

export default Analyze;
