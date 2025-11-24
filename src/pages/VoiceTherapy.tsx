import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VoiceTherapy = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const startSession = () => {
    setIsActive(true);
    toast({ title: "Voice therapy started", description: "Speak freely with Sol" });
  };

  const endSession = () => {
    setIsActive(false);
    setIsListening(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-purple-500/20 flex items-center justify-center">
      <div className="text-center">
        <div className={`w-48 h-48 mx-auto mb-8 rounded-full gradient-bg flex items-center justify-center ${isListening ? 'breathing-animation pulse-glow' : 'breathing-animation'} shadow-2xl`}>
          <Mic className="w-24 h-24 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold gradient-text mb-4">Voice Therapy with Sol</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {isActive ? (isListening ? "Listening..." : "Speak now") : "Start your session"}
        </p>

        <div className="flex gap-4 justify-center">
          {!isActive ? (
            <Button onClick={startSession} size="lg" className="gradient-bg text-white hover:opacity-90 text-lg px-8">
              <Mic className="w-5 h-5 mr-2" />
              Start Session
            </Button>
          ) : (
            <Button onClick={endSession} size="lg" variant="destructive" className="text-lg px-8">
              <X className="w-5 h-5 mr-2" />
              End Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTherapy;
