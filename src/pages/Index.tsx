import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import spaceHero from "@/assets/space-hero.jpg";

interface CelestialInfo {
  name: string;
  type: string;
  distance: string;
  orbit: string;
  moons: string;
  size: string;
  composition: string;
  special: string;
  notes: string;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [celestialInfo, setCelestialInfo] = useState<CelestialInfo | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("identify-celestial", {
        body: { query: searchQuery, type: "text" },
      });

      if (error) throw error;

      setCelestialInfo(data);
      setUploadedImage(null);
      toast({
        title: "Object identified!",
        description: `Found information about ${data.name}`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to identify the celestial object. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setUploadedImage(base64Image);

        const { data, error } = await supabase.functions.invoke("identify-celestial", {
          body: { image: base64Image, type: "image" },
        });

        if (error) throw error;

        setCelestialInfo(data);
        toast({
          title: "Image analyzed!",
          description: `Identified as ${data.name}`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${spaceHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container mx-auto relative z-10">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-6xl font-bold gradient-text animate-fade-in">
              Stellar Explorer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered guide to the cosmos. Discover exoplanets, comets, and celestial wonders.
            </p>
          </div>

          {/* Search Section */}
          <Card className="max-w-3xl mx-auto p-8 backdrop-blur-sm bg-card/80 border-border/50 glow-primary">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter celestial object name (e.g., Kepler-452b, Halley's Comet)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 bg-input border-border"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  variant="cosmic"
                  size="lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or upload an image</span>
                </div>
              </div>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  asChild
                >
                  <span>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </span>
                </Button>
              </label>
            </div>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      {celestialInfo && (
        <section className="py-12 px-4 animate-fade-in">
          <div className="container mx-auto max-w-4xl">
            {uploadedImage && (
              <Card className="mb-8 p-4 bg-card/80 backdrop-blur-sm">
                <img
                  src={uploadedImage}
                  alt="Uploaded celestial object"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </Card>
            )}

            <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold gradient-text">{celestialInfo.name}</h2>
              </div>

              <div className="grid gap-6">
                <InfoSection title="Type" content={celestialInfo.type} />
                <InfoSection title="Distance" content={celestialInfo.distance} />
                <InfoSection title="Orbit" content={celestialInfo.orbit} />
                <InfoSection title="Moons/Rings" content={celestialInfo.moons} />
                <InfoSection title="Size & Composition" content={celestialInfo.size} />
                <InfoSection title="Composition" content={celestialInfo.composition} />
                <InfoSection title="Special Features" content={celestialInfo.special} />
                <InfoSection title="Notes" content={celestialInfo.notes} />
              </div>
            </Card>
          </div>
        </section>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xl text-foreground">Exploring the cosmos...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoSection = ({ title, content }: { title: string; content: string }) => (
  <div className="border-l-2 border-primary/50 pl-4">
    <h3 className="text-lg font-semibold text-secondary mb-2">{title}</h3>
    <p className="text-foreground/90 leading-relaxed">{content}</p>
  </div>
);

export default Index;
