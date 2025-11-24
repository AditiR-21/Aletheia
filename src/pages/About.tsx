import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Heart, Shield, Sparkles, MessageCircle, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto fade-in">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 rounded-2xl gradient-bg mx-auto mb-6 flex items-center justify-center breathing-animation">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">About Aletheia</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your personal AI companion for emotional wellness, combining cutting-edge technology with compassionate care.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="glass-card border-2 mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Aletheia exists to make emotional wellness support accessible, private, and effective for everyone. We believe that understanding and processing your emotions shouldn't require scheduling appointments or navigating insurance. With AI-powered insights and therapeutic conversations, we're here for you 24/7, whenever you need support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Emotional Wellness Matters */}
          <Card className="glass-card border-2 mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Why Emotional Wellness Matters</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    Mental and emotional health are fundamental to living a fulfilling life. Yet many people struggle in silence, unsure how to process complex emotions or lacking access to professional support.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Regular emotional check-ins, journaling, and reflective conversations can significantly improve mood, reduce anxiety, and help you understand yourself better. Aletheia makes these practices simple, engaging, and insightful.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How Sol Helps */}
          <Card className="glass-card border-2 mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">How Sol, Your AI Therapist, Helps</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Sol is powered by advanced AI trained in trauma-informed care, reflective listening, and empathetic communication. Sol doesn't replace professional therapy, but provides a safe, judgment-free space to:
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FeatureItem icon={<Heart />} title="Process Your Emotions" description="Explore feelings in real-time through text or voice conversations" />
                <FeatureItem icon={<Brain />} title="Gain Self-Awareness" description="Understand emotional patterns and triggers through AI analysis" />
                <FeatureItem icon={<TrendingUp />} title="Track Your Progress" description="Visualize your emotional journey with detailed analytics" />
                <FeatureItem icon={<Shield />} title="Feel Safe & Private" description="All conversations are encrypted and never shared" />
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card border-2 text-center p-6">
              <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Emotion Analysis</h3>
              <p className="text-muted-foreground">
                Advanced AI detects emotions, intensity, and provides personalized insights and recommendations.
              </p>
            </Card>

            <Card className="glass-card border-2 text-center p-6">
              <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Therapeutic Chat</h3>
              <p className="text-muted-foreground">
                24/7 access to Sol, your compassionate AI therapist trained in reflective listening and trauma-informed care.
              </p>
            </Card>

            <Card className="glass-card border-2 text-center p-6">
              <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wellness Dashboard</h3>
              <p className="text-muted-foreground">
                Track emotional patterns, view insights, and monitor your mental wellness journey over time.
              </p>
            </Card>
          </div>

          {/* Privacy & Safety */}
          <Card className="glass-card border-2">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Privacy & Safety</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    Your emotional wellness is deeply personal, and we treat it with the utmost care. All conversations are encrypted end-to-end, stored securely, and never shared with third parties.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    <strong>Important:</strong> Aletheia is designed for emotional support and wellness, not crisis intervention. If you're experiencing thoughts of self-harm or suicide, please contact emergency services or a crisis hotline immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">{icon}</div>
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default About;
