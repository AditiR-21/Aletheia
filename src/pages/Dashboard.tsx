import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, Heart, Brain, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { MoodCalendar } from "@/components/MoodCalendar";

interface Summary {
  id: string;
  dominant_emotion: string;
  key_topics: string[];
  worries: string[];
  reflective_suggestions: string;
  positive_reinforcement: string;
  recommended_next_steps: string[];
  created_at: string;
}

interface JournalEntry {
  id: string;
  title: string;
  emotion: string;
  created_at: string;
}

interface Analysis {
  emotion: string;
  intensity: number;
  created_at: string;
}

const Dashboard = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const [summariesRes, journalsRes, analysesRes] = await Promise.all([
        supabase.from("conversation_summaries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("journal_entries").select("id, title, emotion, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("emotion_analyses").select("emotion, intensity, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      ]);

      if (summariesRes.data) setSummaries(summariesRes.data);
      if (journalsRes.data) setJournals(journalsRes.data);
      if (analysesRes.data) setAnalyses(analysesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate emotion distribution for pie chart
  const emotionCounts = analyses.reduce((acc: any, curr) => {
    const emotion = curr.emotion || "Unknown";
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(emotionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(280, 70%, 60%)", "hsl(260, 65%, 65%)", "hsl(240, 60%, 70%)"];

  // Calculate weekly trend - last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const weeklyData = last7Days.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const count = analyses.filter((a) => {
      const analysisDate = new Date(a.created_at).toISOString().split("T")[0];
      return analysisDate === dateStr;
    }).length;
    
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      count,
    };
  });

  // Most common emotion
  const mostCommonEmotion = Object.entries(emotionCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto fade-in">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center breathing-animation">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">Emotional Wellness Dashboard</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={Heart} title="Total Analyses" value={analyses.length.toString()} />
            <StatCard icon={Brain} title="Most Common Emotion" value={mostCommonEmotion} />
            <StatCard icon={Smile} title="This Week" value={weeklyData.reduce((sum, d) => sum + d.count, 0).toString() + " entries"} />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Weekly Trend */}
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Weekly Emotional Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emotion Distribution */}
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent" />
                  Emotion Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 30-Day Mood Calendar */}
          <Card className="glass-card border-2 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                30-Day Mood Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoodCalendar />
            </CardContent>
          </Card>

          {/* Recent Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Journal Entries */}
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle>Recent Journal Entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {journals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No journal entries yet</p>
                ) : (
                  journals.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{entry.title}</h4>
                        {entry.emotion && <span className="text-sm px-2 py-1 rounded-full bg-primary/20 text-primary">{entry.emotion}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Latest Conversation Summary */}
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle>Latest Conversation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {summaries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No conversation summaries yet</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Dominant Emotion</h4>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">{summaries[0].dominant_emotion}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Key Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {summaries[0].key_topics.map((topic, i) => (
                          <span key={i} className="text-sm px-2 py-1 rounded-full bg-accent/20 text-accent">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Positive Reinforcement</h4>
                      <p className="text-sm text-muted-foreground">{summaries[0].positive_reinforcement}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value }: any) => (
  <Card className="glass-card border-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold gradient-text">{value}</p>
    </CardContent>
  </Card>
);

export default Dashboard;
