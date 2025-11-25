import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Clock, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface MeditationSession {
  id: string;
  meditation_type: string;
  duration_minutes: number;
  completed_at: string;
  emotion_before?: string;
  emotion_after?: string;
  ai_summary?: string;
}

const MeditationHistory = () => {
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('meditation-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meditation_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("meditation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  
  // Weekly data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => 
      s.completed_at.split('T')[0] === dateStr
    );
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    };
  });

  // Meditation type distribution
  const typeData = sessions.reduce((acc, session) => {
    const type = session.meditation_type;
    if (!acc[type]) acc[type] = 0;
    acc[type]++;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const COLORS = ['#a78bfa', '#c084fc', '#e879f9', '#f0abfc', '#fae8ff'];

  if (loading) {
    return <div className="text-center py-8">Loading meditation history...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold gradient-text">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
                <p className="text-3xl font-bold gradient-text">{totalMinutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold gradient-text">
                  {weeklyData.reduce((sum, d) => sum + d.sessions, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="gradient-text">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#a78bfa" />
                <YAxis stroke="#a78bfa" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(167, 139, 250, 0.1)', 
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#a78bfa" 
                  strokeWidth={2}
                  dot={{ fill: '#a78bfa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="gradient-text">Meditation Types</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No sessions yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No meditation sessions yet. Start your first session!
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold capitalize">{session.meditation_type.replace('-', ' ')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {session.duration_minutes} min
                    </span>
                  </div>
                  
                  {(session.emotion_before || session.emotion_after) && (
                    <div className="flex gap-2 text-xs mb-2">
                      {session.emotion_before && (
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                          Before: {session.emotion_before}
                        </span>
                      )}
                      {session.emotion_after && (
                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                          After: {session.emotion_after}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {session.ai_summary && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      "{session.ai_summary}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MeditationHistory;
