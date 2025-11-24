import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, Trash2, Mic, Loader2, Phone, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    fetchMessages();
    
    if (location.state?.contextMessage) {
      handleSendMessage(location.state.contextMessage);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    
    if (!textToSend.trim()) return;

    setIsLoading(true);
    const userMessage = textToSend;
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Save user message
      const { data: savedMessage, error: saveError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user?.id,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setMessages((prev) => [...prev, savedMessage as Message]);

      // Get AI response
      const { data, error } = await supabase.functions.invoke("chat-with-sol", {
        body: { message: userMessage, history: messages },
      });

      if (error) throw error;

      // Save assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: user?.id,
          role: "assistant",
          content: data.response,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages((prev) => [...prev, assistantMessage as Message]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
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

  const startVoiceMode = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
      return;
    }

    setIsVoiceMode(true);
    synthRef.current = window.speechSynthesis;
    startContinuousListening();
    toast({ title: "Voice mode activated", description: "Start speaking..." });
  };

  const startContinuousListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      
      // Send the transcribed message
      await handleSendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (isVoiceMode) {
        setTimeout(() => startContinuousListening(), 1000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isVoiceMode && !isVoiceSpeaking) {
        setTimeout(() => startContinuousListening(), 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceMode = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsVoiceMode(false);
    setIsListening(false);
    setIsVoiceSpeaking(false);
    
    // Generate summary
    if (messages.length > 0) {
      await generateSummary();
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;

    setIsVoiceSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsVoiceSpeaking(false);
      if (isVoiceMode && recognitionRef.current) {
        setTimeout(() => startContinuousListening(), 500);
      }
    };

    synthRef.current.speak(utterance);
  };

  const generateSummary = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-chat-summary", {
        body: { messages },
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      // Save summary to database
      const { error: saveError } = await supabase
        .from("conversation_summaries")
        .insert({
          user_id: user?.id,
          dominant_emotion: data.dominant_emotion,
          key_topics: data.key_topics,
          worries: data.worries,
          reflective_suggestions: data.reflective_suggestions,
          positive_reinforcement: data.positive_reinforcement,
          recommended_next_steps: data.recommended_next_steps,
        });

      if (saveError) throw saveError;

      setShowSummaryDialog(true);
      toast({ title: "Conversation summary generated" });
    } catch (error: any) {
      console.error("Error generating summary:", error);
    }
  };

  const clearChat = async () => {
    try {
      const { error } = await supabase.from("chat_messages").delete().neq("id", "");
      if (error) throw error;

      setMessages([]);
      toast({ title: "Chat cleared" });
    } catch (error: any) {
      toast({
        title: "Error clearing chat",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Speak AI responses in voice mode
  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && !isVoiceSpeaking) {
        speakText(lastMessage.content);
      }
    }
  }, [messages, isVoiceMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-6 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center breathing-animation">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  Chat with Sol
                </h1>
                <p className="text-sm text-muted-foreground">Your AI Therapeutic Companion</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isVoiceMode ? (
                <Button
                  onClick={startVoiceMode}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Voice Mode
                </Button>
              ) : (
                <Button
                  onClick={stopVoiceMode}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  End Voice
                </Button>
              )}
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {isVoiceMode && (
            <Card className="glass-card border-2 p-6 mb-6">
              <div className="text-center">
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center ${isListening ? 'breathing-animation pulse-glow' : 'breathing-animation'}`}>
                  <Mic className="w-16 h-16 text-white" />
                </div>
                <p className="text-lg font-semibold mb-2">
                  {isListening ? "Listening..." : isVoiceSpeaking ? "Sol is speaking..." : "Voice mode active"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isListening ? "Speak now, I'm listening" : isVoiceSpeaking ? "Processing your message" : "Waiting for your voice"}
                </p>
              </div>
            </Card>
          )}

          <Card className="flex-1 flex flex-col glass-card border-2 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center breathing-animation">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start a conversation with Sol</h3>
                  <p className="text-muted-foreground">
                    Share your thoughts, feelings, or ask for guidance
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-primary via-accent to-primary text-white"
                        : "bg-muted/80 backdrop-blur-sm text-foreground border border-border"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1 opacity-70">
                      {message.role === "user" ? "You" : "Sol"}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start fade-in">
                  <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border">
                    <p className="text-sm font-medium mb-1 opacity-70">Sol</p>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Sol is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="resize-none"
                  rows={2}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="gradient-bg text-white hover:opacity-90"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={startVoiceInput}
                    disabled={isListening}
                    variant="outline"
                    className="border-2 border-primary"
                    size="icon"
                  >
                    <Mic className={`w-4 h-4 ${isListening ? "animate-pulse text-red-500" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
            </Card>
        </div>
      </main>

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Session Summary</DialogTitle>
            <DialogDescription>
              Your conversation has been analyzed for insights
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={() => {
                setShowSummaryDialog(false);
                navigate("/dashboard");
              }}
              className="w-full gradient-bg text-white"
            >
              View in Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
