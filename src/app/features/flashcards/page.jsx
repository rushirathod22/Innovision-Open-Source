"use client";

import { useState, useEffect, useContext, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import xpContext from "@/contexts/xp";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Layers,
  Lightbulb,
  Brain,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Zap,
  Loader2,
  HelpCircle,
  Flame,
  Volume2,
  VolumeX,
  Shuffle,
  Download,
  Clock,
  Share2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  PageBackground,
  GridPattern,
  PageHeader,
  ScrollReveal,
} from "@/components/ui/PageWrapper";

const PRESET_TOPICS = [
  { name: "Data Structures", icon: "🌳", desc: "BST, Hashmaps, Stacks, Queues", color: "from-blue-500/20 to-cyan-500/20" },
  { name: "JavaScript", icon: "⚡", desc: "Closures, Event Loop, Scope, Promises", color: "from-yellow-500/20 to-amber-500/20" },
  { name: "Web Development", icon: "🌐", desc: "SSR, CORS, HTTP/2, CSS Specificity", color: "from-indigo-500/20 to-purple-500/20" },
  { name: "System Design", icon: "🏗️", desc: "Load Balancers, Caching, CAP Theorem", color: "from-emerald-500/20 to-teal-500/20" },
];

export default function FlashcardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { awardXP } = useContext(xpContext);

  // Deck generation state
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Study session state
  const [deck, setDeck] = useState([]);
  const [currentDeckName, setCurrentDeckName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionXPAdded, setSessionXPAdded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Session timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  // Fetch enrolled courses for "Generate from My Course" option
  useEffect(() => {
    if (user) {
      setLoadingCourses(true);
      fetch("/api/roadmap/all")
        .then((res) => res.json())
        .then((data) => {
          if (data?.docs) {
            setCourses(data.docs.filter((d) => d.process === "completed"));
          }
        })
        .catch((err) => console.error("Error fetching courses for flashcards:", err))
        .finally(() => setLoadingCourses(false));
    }
  }, [user]);

  // Load a preset deck on first mount
  useEffect(() => {
    loadDeck("JavaScript");
  }, []);

  const loadDeck = async (topic) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count: 6, difficulty }),
      });
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        setDeck(data.cards);
        setCurrentDeckName(topic);
        resetSession();
        toast.success(`Deck "${topic}" loaded with ${data.cards.length} cards!`);
      } else {
        toast.error("Failed to generate deck. Please try another topic.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating flashcard deck.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCustom = (e) => {
    e?.preventDefault();
    if (!topicInput.trim()) {
      toast.error("Please enter a topic to generate flashcards.");
      return;
    }
    loadDeck(topicInput.trim());
  };

  const handleGenerateFromCourse = async (course) => {
    setIsGenerating(true);
    try {
      const topicName = course.title || course.topic || "Enrolled Course";
      const sampleContent = course.chapters
        ? course.chapters.map((ch) => `${ch.title}: ${ch.desc || ""}`).join("\n")
        : topicName;

      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicName, content: sampleContent, count: 6, difficulty }),
      });
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        setDeck(data.cards);
        setCurrentDeckName(topicName);
        resetSession();
        toast.success(`Generated deck from "${topicName}"!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcards from course.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setKnownCards(new Set());
    setReviewCards(new Set());
    setStreak(0);
    setMaxStreak(0);
    setIsCompleted(false);
    setSessionXPAdded(false);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    stopAudio();
  };

  const shuffleDeck = () => {
    if (deck.length <= 1) return;
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    resetSession();
    toast.info("Deck shuffled! 🔀");
  };

  // Text-To-Speech Reader
  const speakText = (text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Card response handlers
  const handleMarkResponse = (knewIt) => {
    const card = deck[currentIndex];
    if (!card) return;
    stopAudio();

    if (knewIt) {
      setKnownCards((prev) => new Set(prev).add(card.id));
      setReviewCards((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
      setStreak((s) => {
        const newStreak = s + 1;
        setMaxStreak((m) => Math.max(m, newStreak));
        return newStreak;
      });
    } else {
      setReviewCards((prev) => new Set(prev).add(card.id));
      setKnownCards((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
      setStreak(0);
    }

    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession(knewIt ? knownCards.size + 1 : knownCards.size);
    }
  };

  const finishSession = (finalKnownCount) => {
    setIsCompleted(true);
    setIsTimerRunning(false);
    stopAudio();

    // Multi-color celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"],
    });

    if (!sessionXPAdded && awardXP) {
      awardXP("flashcards", 15);
      setSessionXPAdded(true);
      toast.success("🎉 Mastery session completed! +15 XP Awarded!");
    }
  };

  const handleReviewMissed = () => {
    const missed = deck.filter((c) => reviewCards.has(c.id));
    if (missed.length > 0) {
      setDeck(missed);
      resetSession();
      toast.info(`Reviewing ${missed.length} cards that need practice.`);
    }
  };

  const downloadStudySheet = () => {
    const markdown = `# Flashcard Study Sheet: ${currentDeckName}\n\n` +
      deck.map((c, i) => `### Card ${i + 1}: ${c.question}\n**Answer:** ${c.answer}\n*Hint:* ${c.hint || "None"}\n\n---`).join("\n\n");
    
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDeckName.toLowerCase().replace(/\s+/g, "-")}-flashcards.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Study sheet downloaded as Markdown!");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleMarkResponse(true);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleMarkResponse(false);
      } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowHint((h) => !h);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, deck, isFlipped]);

  const currentCard = deck[currentIndex];
  const progressPercent = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;
  const masteryPercent = deck.length > 0 ? Math.round((knownCards.size / deck.length) * 100) : 0;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 pb-20">
      <PageBackground />
      <GridPattern opacity={0.03} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10 space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/features"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span>Features Hub</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Active Recall Engine</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 fill-amber-500" />
              <span>+15 XP on Mastery</span>
            </div>
            {isTimerRunning && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border border-border text-xs font-mono font-medium text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero Title with Glow */}
        <ScrollReveal>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 text-xs font-medium text-purple-400">
              <Brain className="w-4 h-4 text-purple-400" />
              Spaced Repetition & Memory Retention
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
              AI Flashcard Studio
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Accelerate your learning curve with interactive 3D study cards. Flip, recite, and cement concepts into your long-term memory.
            </p>
          </div>
        </ScrollReveal>

        {/* Generator Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Custom Topic Generator */}
          <Card className="lg:col-span-2 border-border/60 bg-card/60 backdrop-blur-xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Brain className="w-4 h-4" />
                  </div>
                  Generate Custom Deck
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-normal">
                  Gemini 2.5 Flash
                </Badge>
              </div>
              <CardDescription>
                Input any concept, exam topic, or technical skill to auto-generate a targeted deck.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleGenerateCustom} className="flex flex-col sm:flex-row gap-2.5">
                <Input
                  placeholder="e.g., Docker Containerization, Rust Ownership, French Tenses..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="flex-1 bg-background/50 border-border/70 focus:border-primary"
                  disabled={isGenerating}
                />
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background/80 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  disabled={isGenerating}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <Button type="submit" disabled={isGenerating} className="gap-2 shrink-0 shadow-md shadow-primary/20">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
              </form>

              {/* Preset Chips */}
              <div>
                <span className="text-xs text-muted-foreground block mb-2 font-medium">Quick-Study Presets:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_TOPICS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => loadDeck(preset.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        currentDeckName === preset.name
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                          : "border-border/50 bg-card/40 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className="text-lg mb-1">{preset.icon}</div>
                      <div className="font-semibold text-xs truncate text-foreground">{preset.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Courses Generator */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                Your Course Material
              </CardTitle>
              <CardDescription>
                Turn your saved courses into spaced-repetition decks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  Loading your curriculum...
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {courses.slice(0, 4).map((c) => (
                    <button
                      key={c.id || c.title}
                      onClick={() => handleGenerateFromCourse(c)}
                      disabled={isGenerating}
                      className="w-full text-left p-2.5 rounded-xl border border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-xs flex items-center justify-between group"
                    >
                      <span className="font-medium truncate max-w-[160px] text-foreground">{c.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-semibold group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        Study
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-6 text-center leading-relaxed">
                  No completed courses detected. Create courses in the AI Course Studio to convert them into flashcards!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Study Deck Section */}
        {deck.length > 0 ? (
          <div className="space-y-6">
            {/* HUD Status Bar */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{currentDeckName}</span>
                      {streak >= 2 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold animate-bounce">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          {streak} Streak!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Card {currentIndex + 1} of {deck.length} · {masteryPercent}% Mastery
                    </div>
                  </div>
                </div>

                {/* Shuffler & Export */}
                <div className="flex items-center gap-1.5 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={shuffleDeck}
                    title="Shuffle Cards"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadStudySheet}
                    title="Export as Markdown"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Score Pills */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{knownCards.size} Mastered</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                  <RotateCcw className="w-4 h-4" />
                  <span>{reviewCards.size} Review</span>
                </div>
              </div>
            </div>

            {/* Glowing Segmented Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground px-1 font-medium">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 rounded-full bg-muted/50" />
            </div>

            {/* 3D Study Card Area */}
            {!isCompleted && currentCard ? (
              <div className="flex flex-col items-center pt-2">
                {/* Physical Stack Simulation Wrapper */}
                <div className="relative w-full max-w-2xl select-none">
                  {/* Background Card Layer 2 (Bottom) */}
                  <div className="absolute inset-0 bg-muted/40 border border-border/30 rounded-3xl transform translate-y-3 scale-[0.94] opacity-50 blur-[1px] pointer-events-none transition-all duration-300" />
                  {/* Background Card Layer 1 (Middle) */}
                  <div className="absolute inset-0 bg-card/40 border border-border/50 rounded-3xl transform translate-y-1.5 scale-[0.97] opacity-80 pointer-events-none transition-all duration-300" />

                  {/* Reactive Ambient Glow */}
                  <div
                    className={`absolute -inset-1 rounded-3xl blur-2xl opacity-30 transition-all duration-700 pointer-events-none ${
                      isFlipped
                        ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"
                        : "bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600"
                    }`}
                  />

                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ perspective: "1400px" }}
                    className="relative w-full h-[360px] sm:h-[400px] cursor-pointer"
                  >
                    <div
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      className="relative w-full h-full"
                    >
                      {/* FRONT FACE (Question) */}
                      <div
                        style={{ backfaceVisibility: "hidden" }}
                        className="absolute inset-0 rounded-3xl border border-border/90 bg-gradient-to-br from-card via-card/95 to-card/75 p-7 sm:p-9 flex flex-col justify-between shadow-2xl backdrop-blur-2xl"
                      >
                        {/* Front Header */}
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold">
                            {currentCard.category || currentDeckName}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentCard.question);
                              }}
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Listen to question"
                            >
                              <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-primary animate-pulse" : ""}`} />
                            </button>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Eye className="w-3.5 h-3.5" />
                              Click or Space to Flip
                            </span>
                          </div>
                        </div>

                        {/* Front Question Body */}
                        <div className="text-center my-auto px-4 sm:px-8">
                          <span className="text-xs font-bold uppercase tracking-widest text-primary/70 block mb-3">
                            Question
                          </span>
                          <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-relaxed">
                            {currentCard.question}
                          </p>
                        </div>

                        {/* Front Hint Drawer */}
                        <div className="pt-3 border-t border-border/40">
                          {currentCard.hint && (
                            <div>
                              {showHint ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3 rounded-xl flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200"
                                >
                                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                  <span className="font-medium leading-relaxed">{currentCard.hint}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHint(true);
                                  }}
                                  className="text-xs text-muted-foreground hover:text-amber-500 flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium py-1"
                                >
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                  Need a hint? (Press H)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BACK FACE (Answer) */}
                      <div
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                        className="absolute inset-0 rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-card via-indigo-950/30 to-purple-950/30 p-7 sm:p-9 flex flex-col justify-between shadow-2xl backdrop-blur-2xl"
                      >
                        {/* Back Header */}
                        <div className="flex items-center justify-between">
                          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs px-3 py-1 font-semibold">
                            Answer Explanation
                          </Badge>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(currentCard.answer);
                              }}
                              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Listen to answer"
                            >
                              <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-indigo-400 animate-pulse" : ""}`} />
                            </button>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <EyeOff className="w-3.5 h-3.5" />
                              Click or Space to Flip Back
                            </span>
                          </div>
                        </div>

                        {/* Back Answer Body */}
                        <div className="my-auto px-4 sm:px-8 text-center sm:text-left">
                          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2 text-center">
                            Key Takeaway
                          </span>
                          <p className="text-base sm:text-lg font-medium text-foreground/95 leading-relaxed">
                            {currentCard.answer}
                          </p>
                        </div>

                        {/* Back Footer */}
                        <div className="pt-3 border-t border-border/40 text-center text-xs text-muted-foreground font-medium">
                          Did you remember this correctly? Choose your rating below:
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tactile Action Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full max-w-md justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleMarkResponse(false)}
                    className="w-full sm:w-1/2 border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-2.5 h-12 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Study Again (←)
                  </Button>
                  <Button
                    onClick={() => handleMarkResponse(true)}
                    className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white gap-2.5 h-12 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/25 transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    I Knew This! (→)
                  </Button>
                </div>

                {/* Keyboard Shortcuts Hint Bar */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-5 select-none">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-muted rounded-md border text-[11px] font-mono shadow-xs">Space</kbd> Flip
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-muted rounded-md border text-[11px] font-mono shadow-xs">←</kbd> Review
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-muted rounded-md border text-[11px] font-mono shadow-xs">→</kbd> Got It
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-muted rounded-md border text-[11px] font-mono shadow-xs">H</kbd> Hint
                  </span>
                </div>
              </div>
            ) : (
              /* Session Completed Celebration Screen */
              <Card className="max-w-xl mx-auto border-emerald-500/30 bg-card/85 backdrop-blur-2xl shadow-2xl p-8 text-center space-y-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
                  <Trophy className="w-10 h-10 text-white" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Session Completed
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    Deck Mastered!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Excellent active recall session for <strong>{currentDeckName}</strong>.
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Cards Mastered</span>
                    <span className="text-2xl font-black text-emerald-500">{knownCards.size}</span>
                    <span className="text-xs text-muted-foreground"> / {deck.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
                    <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Mastery Score</span>
                    <span className="text-2xl font-black text-primary">{masteryPercent}%</span>
                    <span className="text-[11px] text-muted-foreground block">
                      {masteryPercent >= 80 ? "🎉 High" : "💪 Practice"}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                    <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Time Taken</span>
                    <span className="text-2xl font-black text-purple-500">{formatTime(secondsElapsed)}</span>
                    <span className="text-[11px] text-muted-foreground block">Active Time</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {reviewCards.size > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleReviewMissed}
                      className="flex-1 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-2 h-11 rounded-xl font-bold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Review Missed ({reviewCards.size})
                    </Button>
                  )}
                  <Button onClick={resetSession} className="flex-1 gap-2 h-11 rounded-xl font-bold">
                    <RotateCcw className="w-4 h-4" />
                    Restart Deck
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={downloadStudySheet}
                    className="flex-1 gap-2 h-11 rounded-xl font-bold"
                  >
                    <Download className="w-4 h-4" />
                    Save Notes
                  </Button>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
            <p>No deck loaded. Select a quick preset or type a topic above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
