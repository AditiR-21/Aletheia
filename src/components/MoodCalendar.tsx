import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEmotionData } from "@/lib/emotionConfig";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DayData {
  date: string;
  emotion: string | null;
  intensity: number;
  count: number;
}

export const MoodCalendar = () => {
  const [heatmapData, setHeatmapData] = useState<DayData[]>([]);

  useEffect(() => {
    fetchMoodData();

    // Set up real-time subscription
    const channel = supabase
      .channel('mood-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emotion_analyses'
        },
        () => {
          fetchMoodData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMoodData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch last 30 days of analyses
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analyses } = await supabase
        .from("emotion_analyses")
        .select("emotion, intensity, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!analyses) return;

      // Create map of date -> emotion data
      const dateMap: Record<string, { emotions: string[], intensities: number[] }> = {};
      
      analyses.forEach((analysis) => {
        const dateStr = new Date(analysis.created_at).toISOString().split("T")[0];
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { emotions: [], intensities: [] };
        }
        dateMap[dateStr].emotions.push(analysis.emotion);
        dateMap[dateStr].intensities.push(analysis.intensity || 0);
      });

      // Generate 30-day grid
      const today = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const gridData = last30Days.map((date) => {
        const dateStr = date.toISOString().split("T")[0];
        const dayData = dateMap[dateStr];
        
        if (!dayData || dayData.emotions.length === 0) {
          return {
            date: dateStr,
            emotion: null,
            intensity: 0,
            count: 0,
          };
        }

        // Get most common emotion for the day
        const emotionCounts: Record<string, number> = {};
        dayData.emotions.forEach((emotion) => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        const mostCommonEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
        
        // Calculate average intensity
        const avgIntensity = dayData.intensities.reduce((sum, val) => sum + val, 0) / dayData.intensities.length;

        return {
          date: dateStr,
          emotion: mostCommonEmotion,
          intensity: avgIntensity,
          count: dayData.emotions.length,
        };
      });

      setHeatmapData(gridData);
    } catch (error) {
      console.error("Error fetching mood data:", error);
    }
  };

  const getBlockColor = (day: DayData) => {
    if (day.count === 0 || !day.emotion) {
      return "hsl(var(--muted))";
    }

    const emotionData = getEmotionData(day.emotion);
    const intensityMultiplier = Math.max(0.3, Math.min(1, day.intensity * 1.2));
    
    // Convert hex to HSL-like opacity
    return `${emotionData.color}${Math.floor(intensityMultiplier * 255).toString(16).padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <TooltipProvider>
        <div className="grid grid-cols-10 md:grid-cols-15 gap-2">
          {heatmapData.map((day, i) => {
            const emotionData = day.emotion ? getEmotionData(day.emotion) : null;
            
            return (
              <Tooltip key={i} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className="aspect-square rounded-lg transition-all hover:scale-110 cursor-pointer border border-border/30 flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: getBlockColor(day),
                    }}
                  >
                    {day.count > 0 && emotionData && (
                      <span className="opacity-80">{emotionData.emoji}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-semibold">{formatDate(day.date)}</p>
                    {day.count > 0 && day.emotion ? (
                      <>
                        <p className="capitalize">{day.emotion}</p>
                        <p className="text-muted-foreground">
                          {(day.intensity * 100).toFixed(0)}% intensity
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.count} {day.count === 1 ? 'entry' : 'entries'}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No data</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
        <span>Less Intense</span>
        <div className="flex gap-2 items-center">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "hsl(var(--muted))" }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "hsl(var(--primary) / 0.3)" }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "hsl(var(--primary) / 0.5)" }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "hsl(var(--primary) / 0.7)" }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: "hsl(var(--primary) / 1)" }} />
        </div>
        <span>More Intense</span>
      </div>
    </div>
  );
};
