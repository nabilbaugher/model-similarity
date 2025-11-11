"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DesignInspiration() {
  const colorSchemes = [
    {
      name: "Neural Night",
      description: "Deep, sophisticated dark theme with electric accents",
      primary: "hsl(260, 100%, 65%)",
      secondary: "hsl(200, 100%, 60%)",
      background: "hsl(240, 15%, 8%)",
      accent: "hsl(280, 100%, 75%)",
      muted: "hsl(240, 10%, 15%)",
      vibe: "Modern, Technical, Premium",
      inspiration: "AI labs, neural networks, late-night coding sessions"
    },
    {
      name: "Mint Intelligence",
      description: "Fresh, clean design with mint and sage accents",
      primary: "hsl(160, 60%, 50%)",
      secondary: "hsl(140, 50%, 45%)",
      background: "hsl(0, 0%, 98%)",
      accent: "hsl(170, 70%, 60%)",
      muted: "hsl(150, 20%, 90%)",
      vibe: "Fresh, Approachable, Clear",
      inspiration: "Modern SaaS, productivity tools, clean interfaces"
    },
    {
      name: "Sunset Scholar",
      description: "Warm, inviting palette with coral and amber tones",
      primary: "hsl(20, 90%, 60%)",
      secondary: "hsl(340, 80%, 65%)",
      background: "hsl(30, 30%, 97%)",
      accent: "hsl(10, 100%, 70%)",
      muted: "hsl(30, 20%, 92%)",
      vibe: "Warm, Friendly, Creative",
      inspiration: "Learning platforms, creative tools, human-centered design"
    },
    {
      name: "Ocean Depth",
      description: "Calming blues with deep navy and cyan highlights",
      primary: "hsl(200, 90%, 50%)",
      secondary: "hsl(220, 80%, 60%)",
      background: "hsl(210, 30%, 96%)",
      accent: "hsl(180, 70%, 55%)",
      muted: "hsl(210, 25%, 88%)",
      vibe: "Professional, Trustworthy, Calm",
      inspiration: "Enterprise software, data analytics, scientific tools"
    },
    {
      name: "Forest AI",
      description: "Natural greens with earthy tones and bright highlights",
      primary: "hsl(140, 50%, 45%)",
      secondary: "hsl(120, 40%, 50%)",
      background: "hsl(0, 0%, 99%)",
      accent: "hsl(100, 60%, 60%)",
      muted: "hsl(130, 15%, 92%)",
      vibe: "Natural, Balanced, Growth-focused",
      inspiration: "Sustainability apps, growth metrics, nature-inspired design"
    },
    {
      name: "Neon Noir",
      description: "Cyberpunk-inspired with hot pink and electric blue",
      primary: "hsl(320, 100%, 60%)",
      secondary: "hsl(190, 100%, 55%)",
      background: "hsl(0, 0%, 5%)",
      accent: "hsl(300, 100%, 70%)",
      muted: "hsl(0, 0%, 12%)",
      vibe: "Bold, Edgy, Futuristic",
      inspiration: "Gaming, crypto, cutting-edge tech"
    },
    {
      name: "Lavender Lab",
      description: "Soft purples with warm undertones for a gentle feel",
      primary: "hsl(270, 50%, 60%)",
      secondary: "hsl(250, 45%, 65%)",
      background: "hsl(270, 30%, 97%)",
      accent: "hsl(290, 55%, 70%)",
      muted: "hsl(270, 20%, 90%)",
      vibe: "Gentle, Creative, Thoughtful",
      inspiration: "Creative tools, mindfulness apps, artistic platforms"
    },
    {
      name: "Amber Intelligence",
      description: "Rich golds and ambers with chocolate accents",
      primary: "hsl(40, 80%, 55%)",
      secondary: "hsl(30, 70%, 50%)",
      background: "hsl(45, 40%, 96%)",
      accent: "hsl(50, 90%, 60%)",
      muted: "hsl(40, 25%, 88%)",
      vibe: "Premium, Sophisticated, Timeless",
      inspiration: "Luxury brands, premium services, classic design"
    },
    {
      name: "Ancient Scroll",
      description: "Classic papyrus tones with aged ink accents",
      primary: "hsl(35, 55%, 45%)",
      secondary: "hsl(25, 45%, 35%)",
      background: "hsl(42, 45%, 92%)",
      accent: "hsl(30, 60%, 55%)",
      muted: "hsl(40, 30%, 85%)",
      vibe: "Timeless, Scholarly, Classic",
      inspiration: "Ancient manuscripts, libraries, historical documents"
    },
    {
      name: "Parchment Wisdom",
      description: "Warm cream with sepia and terra cotta highlights",
      primary: "hsl(25, 50%, 50%)",
      secondary: "hsl(15, 45%, 45%)",
      background: "hsl(45, 55%, 95%)",
      accent: "hsl(20, 60%, 60%)",
      muted: "hsl(40, 35%, 88%)",
      vibe: "Warm, Intellectual, Refined",
      inspiration: "Old bookstores, vintage paper, handwritten letters"
    },
    {
      name: "Desert Papyrus",
      description: "Sandy neutrals with deep bronze and clay accents",
      primary: "hsl(30, 45%, 48%)",
      secondary: "hsl(20, 40%, 42%)",
      background: "hsl(40, 40%, 93%)",
      accent: "hsl(35, 55%, 58%)",
      muted: "hsl(38, 28%, 86%)",
      vibe: "Earthy, Ancient, Grounded",
      inspiration: "Egyptian papyrus, desert sands, archaeological sites"
    },
    {
      name: "Scribal Ink",
      description: "Rich sepia with charcoal and aged paper tones",
      primary: "hsl(30, 40%, 35%)",
      secondary: "hsl(25, 35%, 30%)",
      background: "hsl(40, 35%, 90%)",
      accent: "hsl(35, 50%, 48%)",
      muted: "hsl(35, 25%, 82%)",
      vibe: "Dignified, Historical, Serious",
      inspiration: "Medieval manuscripts, calligraphy, monastic libraries"
    },
    {
      name: "Papyrus Light",
      description: "Bright cream with honey gold and soft brown touches",
      primary: "hsl(40, 60%, 58%)",
      secondary: "hsl(35, 50%, 52%)",
      background: "hsl(48, 65%, 97%)",
      accent: "hsl(42, 70%, 65%)",
      muted: "hsl(44, 40%, 90%)",
      vibe: "Airy, Elegant, Luminous",
      inspiration: "Morning light on old paper, illuminated manuscripts"
    },
    {
      name: "Burnt Scroll",
      description: "Darker papyrus with burnt edges and deep amber",
      primary: "hsl(28, 50%, 42%)",
      secondary: "hsl(20, 45%, 38%)",
      background: "hsl(38, 35%, 88%)",
      accent: "hsl(32, 55%, 50%)",
      muted: "hsl(35, 28%, 80%)",
      vibe: "Mysterious, Aged, Weathered",
      inspiration: "Ancient ruins, weathered documents, archaeological finds"
    },
    {
      name: "Scholar's Desk",
      description: "Muted beige with walnut brown and parchment cream",
      primary: "hsl(32, 45%, 46%)",
      secondary: "hsl(25, 40%, 40%)",
      background: "hsl(42, 50%, 94%)",
      accent: "hsl(38, 52%, 54%)",
      muted: "hsl(40, 32%, 87%)",
      vibe: "Studious, Focused, Traditional",
      inspiration: "University libraries, writing desks, leather-bound books"
    },
    {
      name: "Hieroglyphic Stone",
      description: "Cool stone beige with olive undertones and bronze",
      primary: "hsl(38, 30%, 50%)",
      secondary: "hsl(45, 25%, 45%)",
      background: "hsl(42, 20%, 91%)",
      accent: "hsl(35, 38%, 58%)",
      muted: "hsl(40, 18%, 84%)",
      vibe: "Ancient, Monumental, Solid",
      inspiration: "Stone tablets, temple walls, carved inscriptions"
    }
  ];

  const designPatterns = [
    {
      name: "Glassmorphism",
      description: "Frosted glass effects with backdrop blur",
      useCases: ["Cards", "Modals", "Sidebars"],
      complexity: "Medium"
    },
    {
      name: "Neumorphism",
      description: "Soft, extruded shapes with subtle shadows",
      useCases: ["Buttons", "Input fields", "Cards"],
      complexity: "High"
    },
    {
      name: "Brutalism",
      description: "Bold, raw, no-nonsense design with strong contrasts",
      useCases: ["Headers", "CTAs", "Feature sections"],
      complexity: "Low"
    },
    {
      name: "Gradient Mesh",
      description: "Smooth, multi-color gradients for backgrounds",
      useCases: ["Backgrounds", "Hero sections", "Accent areas"],
      complexity: "Medium"
    },
    {
      name: "Data Visualization Focus",
      description: "Chart-first design with emphasis on metrics",
      useCases: ["Dashboard", "Analytics", "Comparison views"],
      complexity: "High"
    }
  ];

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Design Inspiration</h1>
          <p className="text-muted-foreground text-lg">
            Explore color schemes and design patterns for the Model Similarity platform
          </p>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="colors">Color Schemes</TabsTrigger>
            <TabsTrigger value="patterns">Design Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {colorSchemes.map((scheme) => (
                <Card key={scheme.name} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{scheme.name}</CardTitle>
                        <CardDescription className="mt-2">{scheme.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {scheme.vibe.split(", ").map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Color Palette */}
                    <div className="grid grid-cols-5 gap-2 h-24 rounded-lg overflow-hidden">
                      <div
                        className="flex items-end justify-center pb-2 text-xs font-medium text-white"
                        style={{ backgroundColor: scheme.primary }}
                      >
                        Primary
                      </div>
                      <div
                        className="flex items-end justify-center pb-2 text-xs font-medium text-white"
                        style={{ backgroundColor: scheme.secondary }}
                      >
                        Secondary
                      </div>
                      <div
                        className="flex items-end justify-center pb-2 text-xs font-medium border"
                        style={{ backgroundColor: scheme.background, color: scheme.primary }}
                      >
                        BG
                      </div>
                      <div
                        className="flex items-end justify-center pb-2 text-xs font-medium text-white"
                        style={{ backgroundColor: scheme.accent }}
                      >
                        Accent
                      </div>
                      <div
                        className="flex items-end justify-center pb-2 text-xs font-medium"
                        style={{ backgroundColor: scheme.muted, color: scheme.primary }}
                      >
                        Muted
                      </div>
                    </div>

                    {/* Preview Card */}
                    <div
                      className="p-6 rounded-lg border-2"
                      style={{
                        backgroundColor: scheme.background,
                        borderColor: scheme.muted
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium mb-3"
                        style={{
                          backgroundColor: scheme.primary,
                          color: 'white'
                        }}
                      >
                        Button Example
                      </div>
                      <div
                        className="p-4 rounded-md"
                        style={{ backgroundColor: scheme.muted }}
                      >
                        <p className="text-sm" style={{ color: scheme.primary }}>
                          Card content preview with muted background
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground italic">
                      Inspired by: {scheme.inspiration}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designPatterns.map((pattern) => (
                <Card key={pattern.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{pattern.name}</CardTitle>
                      <Badge variant={
                        pattern.complexity === "Low" ? "secondary" :
                        pattern.complexity === "Medium" ? "default" :
                        "destructive"
                      }>
                        {pattern.complexity}
                      </Badge>
                    </div>
                    <CardDescription>{pattern.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Best for:</p>
                      <div className="flex flex-wrap gap-2">
                        {pattern.useCases.map((useCase) => (
                          <Badge key={useCase} variant="outline">{useCase}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Design Principles for AI Model Practice App</CardTitle>
                <CardDescription>Key considerations for our specific use case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Focus & Clarity</h3>
                  <p className="text-sm text-muted-foreground">
                    Users need to concentrate on comparing model outputs. Minimize visual noise and distractions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. Differentiation</h3>
                  <p className="text-sm text-muted-foreground">
                    Make it easy to distinguish between different models and responses. Use clear visual separation.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. Feedback & Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Show immediate feedback on correctness, maintain progress indicators, celebrate learning.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4. Professional & Playful Balance</h3>
                  <p className="text-sm text-muted-foreground">
                    Technical enough to be taken seriously, friendly enough to encourage practice and experimentation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
