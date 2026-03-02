import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Sparkles, Loader2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';
import Confetti from '@/components/ui/Confetti';

const questions = [
  {
    id: 'skin_feel',
    question: 'How does your skin feel most of the day?',
    options: [
      { value: 'oily', label: 'Shiny and oily', icon: '✨' },
      { value: 'dry', label: 'Tight and dry', icon: '🏜️' },
      { value: 'combination', label: 'Oily T-zone, dry cheeks', icon: '⚖️' },
      { value: 'normal', label: 'Balanced and comfortable', icon: '😊' },
    ]
  },
  {
    id: 'sensitivity',
    question: 'How does your skin react to new products?',
    options: [
      { value: 'sensitive', label: 'Often gets red or irritated', icon: '🔴' },
      { value: 'moderate', label: 'Sometimes reacts', icon: '🟡' },
      { value: 'resilient', label: 'Rarely has issues', icon: '🟢' },
    ]
  },
  {
    id: 'main_concern',
    question: 'What is your main skin concern?',
    options: [
      { value: 'acne', label: 'Acne and breakouts', icon: '😣' },
      { value: 'aging', label: 'Wrinkles and fine lines', icon: '⏰' },
      { value: 'dark_spots', label: 'Dark spots and uneven tone', icon: '🎯' },
      { value: 'dullness', label: 'Dull, tired-looking skin', icon: '😴' },
      { value: 'pores', label: 'Large pores', icon: '🔍' },
    ]
  },
  {
    id: 'water_intake',
    question: 'How many glasses of water do you drink daily?',
    options: [
      { value: 'low', label: 'Less than 4 glasses', icon: '💧' },
      { value: 'moderate', label: '4-6 glasses', icon: '💧💧' },
      { value: 'good', label: '7-8 glasses', icon: '💧💧💧' },
      { value: 'excellent', label: 'More than 8 glasses', icon: '🌊' },
    ]
  },
  {
    id: 'sleep',
    question: 'How many hours do you sleep on average?',
    options: [
      { value: 'poor', label: 'Less than 5 hours', icon: '😫' },
      { value: 'low', label: '5-6 hours', icon: '😪' },
      { value: 'moderate', label: '6-7 hours', icon: '😌' },
      { value: 'good', label: '7-8 hours', icon: '😴' },
      { value: 'excellent', label: 'More than 8 hours', icon: '💤' },
    ]
  },
  {
    id: 'stress',
    question: 'How would you describe your stress level?',
    options: [
      { value: 'high', label: 'Very stressed', icon: '😰' },
      { value: 'moderate', label: 'Somewhat stressed', icon: '😐' },
      { value: 'low', label: 'Rarely stressed', icon: '😌' },
      { value: 'minimal', label: 'Very relaxed', icon: '🧘' },
    ]
  },
  {
    id: 'climate',
    question: 'What climate do you live in?',
    options: [
      { value: 'humid', label: 'Hot and humid', icon: '🌴' },
      { value: 'dry', label: 'Hot and dry', icon: '🏜️' },
      { value: 'cold', label: 'Cold and dry', icon: '❄️' },
      { value: 'temperate', label: 'Moderate/temperate', icon: '🌤️' },
      { value: 'varying', label: 'Varies by season', icon: '🍂' },
    ]
  },
  {
    id: 'diet',
    question: 'How would you describe your diet?',
    options: [
      { value: 'healthy', label: 'Mostly fruits, veggies, whole foods', icon: '🥗' },
      { value: 'moderate', label: 'Mix of healthy and processed', icon: '🍽️' },
      { value: 'unhealthy', label: 'Mostly processed/fast food', icon: '🍔' },
    ]
  },
  {
    id: 'exercise',
    question: 'How often do you exercise?',
    options: [
      { value: 'daily', label: 'Every day', icon: '🏃' },
      { value: 'regular', label: '3-5 times a week', icon: '💪' },
      { value: 'occasional', label: '1-2 times a week', icon: '🚶' },
      { value: 'rarely', label: 'Rarely or never', icon: '🛋️' },
    ]
  },
  {
    id: 'sunscreen',
    question: 'How often do you wear sunscreen?',
    options: [
      { value: 'always', label: 'Every single day', icon: '☀️' },
      { value: 'mostly', label: 'Most days', icon: '🌤️' },
      { value: 'sometimes', label: 'Only when it\'s sunny', icon: '⛅' },
      { value: 'rarely', label: 'Rarely or never', icon: '🌙' },
    ]
  },
];

export default function Quiz() {
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.QuizResult.create(data),
  });

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      analyzeResults({ ...answers, [questions[currentQuestion].id]: value });
    }
  };

  const analyzeResults = async (finalAnswers) => {
    setAnalyzing(true);
    setShowResults(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this skincare quiz, analyze the user's skin profile:

Answers:
- Skin feel: ${finalAnswers.skin_feel}
- Sensitivity: ${finalAnswers.sensitivity}
- Main concern: ${finalAnswers.main_concern}
- Water intake: ${finalAnswers.water_intake}
- Sleep: ${finalAnswers.sleep}
- Stress level: ${finalAnswers.stress}
- Climate: ${finalAnswers.climate}
- Diet: ${finalAnswers.diet}
- Exercise: ${finalAnswers.exercise}
- Sunscreen use: ${finalAnswers.sunscreen}

Provide:
1. Determined skin type
2. Main skin concerns (array)
3. Lifestyle score (0-100)
4. 5 personalized recommendations

Be encouraging and helpful.`,
      response_json_schema: {
        type: "object",
        properties: {
          skin_type: { type: "string" },
          concerns: { type: "array", items: { type: "string" } },
          lifestyle_score: { type: "number" },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    setResults(result);
    setAnalyzing(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    if (user) {
      saveMutation.mutate({
        user_email: user.email,
        skin_type: result.skin_type,
        concerns: result.concerns,
        lifestyle_score: result.lifestyle_score,
        water_intake: finalAnswers.water_intake,
        sleep_quality: finalAnswers.sleep,
        stress_level: finalAnswers.stress,
        climate: finalAnswers.climate,
        diet_quality: finalAnswers.diet,
        exercise_frequency: finalAnswers.exercise,
        recommendations: result.recommendations,
      });
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <Confetti trigger={showConfetti} />
        
        <GlassCard className="text-center">
          {analyzing ? (
            <div className="py-12">
              <Loader2 className="w-12 h-12 text-pink-500 mx-auto animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Answers...</h2>
              <p className="text-gray-500">Creating your personalized skin profile</p>
            </div>
          ) : results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Your Skin Profile</h2>
              
              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-sm text-gray-500">Skin Type</p>
                  <p className="text-xl font-bold capitalize">{results.skin_type}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-sm text-gray-500">Lifestyle Score</p>
                  <p className="text-xl font-bold">{results.lifestyle_score}/100</p>
                </div>
              </div>

              <div className="text-left mb-6">
                <h3 className="font-semibold mb-2">Main Concerns</h3>
                <div className="flex flex-wrap gap-2">
                  {results.concerns?.map((concern, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                    >
                      {concern}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-left mb-6">
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {results.recommendations?.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 rounded-xl"
                    >
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResults(false);
                    setCurrentQuestion(0);
                    setAnswers({});
                    setResults(null);
                  }}
                  className="flex-1"
                >
                  Retake Quiz
                </Button>
                <Button
                  onClick={() => window.location.href = createPageUrl('SkinAnalysis')}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  Get AI Analysis
                </Button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <GlassCard>
            <h2 className="text-xl font-semibold mb-6">{question.question}</h2>
            
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    answers[question.id] === option.value
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {answers[question.id] && currentQuestion < questions.length - 1 && (
          <Button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}