import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const VoiceTherapy = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
      };

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log("User said:", transcript);
        setTranscript(transcript);
        
        if (!isProcessingRef.current) {
          await handleUserSpeech(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: "Error",
            description: "Speech recognition error. Please try again.",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        // Restart if session is still active
        if (isActive && !isProcessingRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              recognitionRef.current.start();
            }
          }, 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [isActive]);

  const handleUserSpeech = async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsListening(false);
    
    // Stop recognition temporarily
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Add user message
    const userMessage: Message = { role: "user", content: userText };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save user message to database
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "user",
        content: userText
      });

      // Get conversation history
      const { data: history } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const conversationHistory = history?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      // Get AI response
      const { data: response, error } = await supabase.functions.invoke("chat-with-sol", {
        body: { messages: conversationHistory }
      });

      if (error) throw error;

      const solResponse = response.response;
      const assistantMessage: Message = { role: "assistant", content: solResponse };
      setMessages(prev => [...prev, assistantMessage]);

      // Save Sol's response to database
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: solResponse
      });

      // Speak Sol's response
      await speakText(solResponse);

    } catch (error: any) {
      console.error("Error processing speech:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your message",
        variant: "destructive"
      });
    } finally {
      isProcessingRef.current = false;
      setTranscript("");
      
      // Restart recognition after Sol finishes speaking
      setTimeout(() => {
        if (recognitionRef.current && isActive && !isSpeaking) {
          recognitionRef.current.start();
        }
      }, 1000);
    }
  };

  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        console.log("Sol started speaking");
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log("Sol finished speaking");
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        resolve();
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  const startSession = () => {
    setIsActive(true);
    toast({ 
      title: "Voice therapy started", 
      description: "Speak freely with Sol. I'm listening..." 
    });
    
    // Start speech recognition
    if (recognitionRef.current) {
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 500);
    }
  };

  const endSession = () => {
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    isProcessingRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
    
    toast({
      title: "Session ended",
      description: "Take care of yourself. I'm here whenever you need me."
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-purple-500/20 overflow-hidden">
      <div className="container mx-auto h-full flex flex-col items-center justify-center px-4 py-8">
        
        {/* Sol Avatar */}
        <div className={`w-48 h-48 mb-8 rounded-full gradient-bg flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isSpeaking ? 'pulse-glow scale-110' : isListening ? 'breathing-animation' : 'breathing-animation opacity-80'
        }`}>
          {isSpeaking ? (
            <Volume2 className="w-24 h-24 text-white animate-pulse" />
          ) : (
            <Mic className="w-24 h-24 text-white" />
          )}
        </div>
        
        {/* Status Text */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold gradient-text mb-2">Voice Therapy with Sol</h1>
          <p className="text-xl text-muted-foreground">
            {!isActive ? "Start your session" : 
             isSpeaking ? "Sol is speaking..." :
             isListening ? "Listening... Speak now" :
             "Processing..."}
          </p>
          {transcript && (
            <p className="text-sm text-primary/70 mt-2 italic">"{transcript}"</p>
          )}
        </div>

        {/* Conversation History */}
        {messages.length > 0 && (
          <Card className="glass-card max-w-2xl w-full max-h-64 overflow-y-auto mb-6">
            <CardContent className="p-4 space-y-3">
              {messages.slice(-4).map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-primary/10 ml-8"
                      : "bg-accent/10 mr-8"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === "user" ? "You" : "Sol"}
                  </p>
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex gap-4">
          {!isActive ? (
            <Button 
              onClick={startSession} 
              size="lg" 
              className="gradient-bg text-white hover:opacity-90 text-lg px-8"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Session
            </Button>
          ) : (
            <Button 
              onClick={endSession} 
              size="lg" 
              variant="destructive" 
              className="text-lg px-8"
            >
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