import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Brain, BookHeart, MessageCircle, Mic, BarChart3, Sparkles, Heart } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-20 fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-bg mb-6 breathing-animation shadow-2xl">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-6">
            Aletheia
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your Personal AI Emotional Companion
          </p>
          <p className="text-lg text-foreground/80 mb-10 max-w-2xl mx-auto">
            Understand, track, and nurture your emotional wellness with AI-powered insights, 
            therapeutic conversations, and personalized guidance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="gradient-bg text-white hover:opacity-90 transition-all duration-300 text-lg px-8 pulse-glow"
            >
              <Link to="/analyze" className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Start Analyzing
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-primary hover:bg-primary/10 text-lg px-8"
            >
              <Link to="/chat" className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat with Sol
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 gradient-text">
            Your Wellness Toolkit
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="Emotion Analysis"
              description="Use text or voice to analyze your feelings and receive AI-powered emotional insights with personalized recommendations."
              link="/analyze"
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={BookHeart}
              title="Smart Journal"
              description="Document your emotional journey with automatic emotion tagging and easy access to past entries."
              link="/journal"
              gradient="from-blue-500 to-purple-500"
            />
            <FeatureCard
              icon={MessageCircle}
              title="Chat with Sol"
              description="Have therapeutic conversations with Sol, your AI companion who understands and supports you."
              link="/chat"
              gradient="from-purple-500 to-indigo-500"
            />
            <FeatureCard
              icon={Mic}
              title="Voice Therapy"
              description="Experience full-screen voice therapy sessions with real-time conversation and breathing animations."
              link="/voice-therapy"
              gradient="from-pink-500 to-purple-500"
            />
            <FeatureCard
              icon={BarChart3}
              title="Insights Dashboard"
              description="Visualize your emotional patterns with charts, trends, and personalized analytics."
              link="/dashboard"
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon={Sparkles}
              title="About Aletheia"
              description="Learn how Aletheia helps you build emotional resilience and mental wellness."
              link="/about"
              gradient="from-purple-500 to-blue-500"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center glass-card p-12 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start understanding your emotions better today with Aletheia's AI-powered tools.
          </p>
          <Button
            asChild
            size="lg"
            className="gradient-bg text-white hover:opacity-90 text-lg px-8"
          >
            <Link to="/analyze">Get Started</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  link: string;
  gradient: string;
}

const FeatureCard = ({ icon: Icon, title, description, link, gradient }: FeatureCardProps) => (
  <Card className="glass-card border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
    <CardHeader>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button
        asChild
        variant="ghost"
        className="w-full hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <Link to={link}>Explore →</Link>
      </Button>
    </CardContent>
  </Card>
);

export default Home;
