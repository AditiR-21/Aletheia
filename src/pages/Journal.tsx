import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookHeart, Plus, Trash2, MessageCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Journal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(location.state?.content || "");
  const [emotion, setEmotion] = useState(location.state?.emotion || "");
  const [intensity, setIntensity] = useState(location.state?.intensity || 0.5);

  useEffect(() => {
    fetchEntries();
    if (location.state?.content) {
      setShowForm(true);
    }
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading entries",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveEntry = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user?.id,
        title,
        content,
        emotion,
        emotion_intensity: intensity,
      });

      if (error) throw error;

      toast({
        title: "Entry saved!",
        description: "Your journal entry has been created",
      });

      setTitle("");
      setContent("");
      setEmotion("");
      setIntensity(0.5);
      setShowForm(false);
      fetchEntries();
    } catch (error: any) {
      toast({
        title: "Error saving entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Entry deleted" });
      fetchEntries();
    } catch (error: any) {
      toast({
        title: "Error deleting entry",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const discussWithSol = (entry: any) => {
    navigate("/chat", {
      state: {
        journalText: entry.content,
        emotion: entry.emotion,
        contextMessage: `I'd like to discuss my journal entry from ${new Date(entry.created_at).toLocaleDateString()}. The entry says: "${entry.content}" and I was feeling ${entry.emotion}.`,
      },
    });
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: any = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      anxious: "😰",
      calm: "😌",
      excited: "🤩",
      neutral: "😐",
    };
    return emojiMap[emotion?.toLowerCase()] || "💭";
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto fade-in">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center breathing-animation">
                  <BookHeart className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                  My Journal
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Document your emotional journey
              </p>
            </div>
            
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gradient-bg text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>

          {showForm && (
            <Card className="glass-card border-2 mb-8">
              <CardHeader>
                <CardTitle>Create Journal Entry</CardTitle>
                <CardDescription>Write about your thoughts and feelings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Entry title..."
                    className="text-lg"
                  />
                </div>
                
                {emotion && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary">
                    <span className="text-xl">{getEmotionEmoji(emotion)}</span>
                    <span className="font-semibold capitalize">{emotion}</span>
                  </div>
                )}
                
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="min-h-[200px] text-base resize-none"
                />
                
                <div className="flex gap-3">
                  <Button
                    onClick={saveEntry}
                    disabled={isLoading}
                    className="gradient-bg text-white hover:opacity-90"
                  >
                    {isLoading ? "Saving..." : "Save Entry"}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {entries.length === 0 ? (
              <Card className="glass-card border-2 text-center py-12">
                <CardContent>
                  <BookHeart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your emotional wellness journey by creating your first entry
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="gradient-bg text-white hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="glass-card border-2 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {entry.emotion && (
                            <span className="text-2xl">{getEmotionEmoji(entry.emotion)}</span>
                          )}
                          <CardTitle className="text-2xl">{entry.title}</CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground/80 whitespace-pre-wrap">{entry.content}</p>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => discussWithSol(entry)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Discuss with Sol
                      </Button>
                      <Button
                        onClick={() => deleteEntry(entry.id)}
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Journal;
