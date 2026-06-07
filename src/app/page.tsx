'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dumbbell,
  Droplets,
  Moon,
  Flame,
  Sparkles,
  Brain,
  AlertTriangle,
  Trophy,
  CheckCircle,
  Plus,
  RotateCw,
  Send,
  User,
  LogOut,
  ChevronRight,
  Check,
  Activity,
  ShieldAlert,
  Zap,
  Compass,
  Key,
  TrendingUp,
  MoonIcon,
  SunIcon,
  Lock,
  Target,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Award
} from 'lucide-react';
import { auth, db, UserProfile, HabitLog, WeeklyReport, AdaptivePlan, UserState } from '@/lib/mockFirebase';
import {
  generateFitnessBlueprint,
  generateWeeklyReport,
  getAICoachReply,
  getGeminiApiKey,
  saveGeminiApiKey,
  removeGeminiApiKey
} from '@/lib/gemini';

export default function FitAICoach() {
  // Navigation & Authentication state
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'adaptive' | 'report'>('dashboard');

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Application Settings / Key Configuration
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Core User State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [achievements, setAchievements] = useState({
    hydrationHero: false,
    sleepChampion: false,
    fitnessStarter: false,
    consistencyMaster: false
  });
  const [adaptivePlan, setAdaptivePlan] = useState<AdaptivePlan | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<string>('');
  const [activeNutritionPlan, setActiveNutritionPlan] = useState<string>('');

  // UI / Tracker Inputs (Today's Entry)
  const [todaySleep, setTodaySleep] = useState<string>('8');
  const [todayWater, setTodayWater] = useState<string>('2.5');
  const [todayWorkoutDone, setTodayWorkoutDone] = useState<boolean>(false);
  const [todayWorkoutDuration, setTodayWorkoutDuration] = useState<string>('30');
  const [todayMealsCount, setTodayMealsCount] = useState<string>('3');
  const [todayCalories, setTodayCalories] = useState<string>('2000');
  const [todayProtein, setTodayProtein] = useState<string>('120');

  // Onboarding Wizard Form State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [wizardName, setWizardName] = useState('');
  const [wizardAge, setWizardAge] = useState('28');
  const [wizardGender, setWizardGender] = useState('male');
  const [wizardHeight, setWizardHeight] = useState('175');
  const [wizardWeight, setWizardWeight] = useState('78');
  const [wizardActivity, setWizardActivity] = useState('moderate');
  const [wizardSleep, setWizardSleep] = useState('7');
  const [wizardWater, setWizardWater] = useState('2');
  const [wizardGoals, setWizardGoals] = useState<string[]>(['general-fitness']);
  const [wizardTargetWeight, setWizardTargetWeight] = useState('72');
  const [wizardTargetDate, setWizardTargetDate] = useState('');

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: "Welcome to your FitAI Command Hub. I am your adaptive AI Fitness Coach. I monitor your daily habits, recalibrate training parameters when your schedule becomes tight, and unlock genetic alignment directives. Ask me anything to begin.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quest / Challenges State (Gamification)
  const [quests, setQuests] = useState([
    { id: 'q1', text: 'Sip 2.5L of pure cellular hydration today', xpReward: 30, completed: false, claimed: false },
    { id: 'q2', text: 'Engage in a 25-minute focused athletic session', xpReward: 40, completed: false, claimed: false },
    { id: 'q3', text: 'Log 8 hours of deep restorative sleep', xpReward: 30, completed: false, claimed: false }
  ]);

  // Confetti State
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Setup initial mock data when onboarding is completed
  const populateMockHistory = (userId: string, startWeight: number, targetW: number) => {
    const historicalLogs: Record<string, HabitLog> = {};
    const today = new Date();

    const weights = [startWeight, startWeight - 0.2, startWeight - 0.1, startWeight + 0.1, startWeight, startWeight + 0.2];
    const sleepHrs = [7.5, 8.0, 6.0, 5.5, 7.0, 6.5];
    const waterLtrs = [2.2, 3.0, 1.5, 1.2, 2.0, 1.8];
    const workoutState = [true, true, false, false, true, false];
    const workoutDur = [45, 45, 0, 0, 40, 0];
    const mealCount = [3, 4, 2, 2, 3, 2];
    const calories = [2100, 1950, 2500, 2600, 2200, 2400];
    const protein = [130, 150, 90, 80, 120, 95];

    for (let i = 6; i >= 1; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      historicalLogs[dateStr] = {
        date: dateStr,
        sleep: sleepHrs[6 - i],
        water: waterLtrs[6 - i],
        workoutCompleted: workoutState[6 - i],
        workoutDuration: workoutDur[6 - i],
        mealsCompleted: mealCount[6 - i],
        caloriesConsumed: calories[6 - i],
        proteinConsumed: protein[6 - i],
        timestamp: d.getTime()
      };
    }

    return historicalLogs;
  };

  // Sync state to local storage and DB
  const saveStateToDB = async (updatedState: Partial<UserState>) => {
    if (!user) return;
    try {
      const doc = await db.getDoc('users', user.uid);
      const currentData = doc.exists() ? doc.data() : {};

      const merged: UserState = {
        profile: updatedState.profile !== undefined ? updatedState.profile : (currentData.profile || profile),
        logs: updatedState.logs !== undefined ? updatedState.logs : (currentData.logs || logs),
        xp: updatedState.xp !== undefined ? updatedState.xp : (currentData.xp || xp),
        level: updatedState.level !== undefined ? updatedState.level : (currentData.level || level),
        streaks: updatedState.streaks !== undefined ? updatedState.streaks : (currentData.streaks || streaks),
        achievements: updatedState.achievements !== undefined ? updatedState.achievements : (currentData.achievements || achievements),
        adaptivePlan: updatedState.adaptivePlan !== undefined ? updatedState.adaptivePlan : (currentData.adaptivePlan || adaptivePlan),
        weeklyReport: updatedState.weeklyReport !== undefined ? updatedState.weeklyReport : (currentData.weeklyReport || weeklyReport),
      };

      await db.setDoc('users', user.uid, merged);
    } catch (e) {
      console.error('Error saving state to mock Firestore:', e);
    }
  };

  // Load state from DB
  const loadStateFromDB = async (userId: string) => {
    try {
      const doc = await db.getDoc('users', userId);
      if (doc.exists()) {
        const data = doc.data() as UserState;
        setProfile(data.profile || null);
        setLogs(data.logs || {});
        setXp(data.xp || 0);
        setLevel(data.level || 1);
        setStreaks(data.streaks || { current: 0, best: 0 });
        setAchievements(data.achievements || {
          hydrationHero: false,
          sleepChampion: false,
          fitnessStarter: false,
          consistencyMaster: false
        });
        setAdaptivePlan(data.adaptivePlan || null);
        setWeeklyReport(data.weeklyReport || null);

        if (data.profile?.uid) {
          const storedWorkout = localStorage.getItem(`fitai_workout_${userId}`);
          const storedNutrition = localStorage.getItem(`fitai_nutrition_${userId}`);
          if (storedWorkout) setActiveWorkoutPlan(storedWorkout);
          if (storedNutrition) setActiveNutritionPlan(storedNutrition);
        }
      }
    } catch (e) {
      console.error('Error loading state from mock Firestore:', e);
    }
  };

  // Auth monitoring
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await loadStateFromDB(u.uid);
      } else {
        setProfile(null);
        setLogs({});
        setXp(0);
        setLevel(1);
        setStreaks({ current: 0, best: 0 });
        setAchievements({
          hydrationHero: false,
          sleepChampion: false,
          fitnessStarter: false,
          consistencyMaster: false
        });
        setAdaptivePlan(null);
        setWeeklyReport(null);
        setActiveWorkoutPlan('');
        setActiveNutritionPlan('');
      }
      setLoading(false);
    });

    const apiKey = getGeminiApiKey();
    if (apiKey) setApiKeyInput(apiKey);

    const future = new Date();
    future.setDate(future.getDate() + 60);
    setWizardTargetDate(future.toISOString().split('T')[0]);

    return () => unsubscribe();
  }, []);

  // Synchronise dark/light theme wrapper
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clean old confetti particles
  useEffect(() => {
    if (confetti.length > 0) {
      const timer = setTimeout(() => {
        setConfetti([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confetti]);

  // Trigger particle effect
  const triggerConfetti = (x: number, y: number) => {
    const colors = ['#00f2fe', '#00f5a0', '#ff7e5f', '#7f00ff', '#ff0844'];
    const newParticles = Array.from({ length: 45 }).map((_, i) => ({
      id: Math.random() + i,
      x: x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 500),
      y: y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 400),
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setConfetti(newParticles);
  };

  // Authenticate User
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await auth.createUserWithEmailAndPassword(authEmail, authPassword);
      } else {
        await auth.signInWithEmailAndPassword(authEmail, authPassword);
      }
    } catch (e: any) {
      setAuthError(e.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out User
  const handleSignOut = async () => {
    await auth.signOut();
  };

  // Setup Gemini Key
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      saveGeminiApiKey(apiKeyInput.trim());
    } else {
      removeGeminiApiKey();
    }
    setShowKeyModal(false);
    triggerConfetti(0, 0);
  };

  // Award XP and manage level progression
  const awardXP = (amount: number, eventX?: number, eventY?: number) => {
    setXp((prevXp) => {
      let newXp = prevXp + amount;
      let newLevel = level;
      const xpNeeded = level * 100;

      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        setLevel(newLevel);
        triggerConfetti(eventX || 0, eventY || 0);
      }

      setTimeout(() => {
        saveStateToDB({ xp: newXp, level: newLevel });
      }, 0);

      return newXp;
    });
  };

  // BMI calculations
  const calculateBMI = (w: number, h: number) => {
    const hM = h / 100;
    const bmiVal = w / (hM * hM);
    let cat = 'Normal';
    if (bmiVal < 18.5) cat = 'Underweight';
    else if (bmiVal >= 25 && bmiVal < 30) cat = 'Overweight';
    else if (bmiVal >= 30) cat = 'Obese';
    return { bmi: bmiVal, category: cat };
  };

  // Submit assessment onboarding wizard
  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setAuthLoading(true);
    try {
      const weightNum = parseFloat(wizardWeight);
      const heightNum = parseFloat(wizardHeight);
      const ageNum = parseInt(wizardAge);
      const waterNum = parseFloat(wizardWater);
      const sleepNum = parseFloat(wizardSleep);
      const targetWNum = parseFloat(wizardTargetWeight);

      const { bmi, category } = calculateBMI(weightNum, heightNum);

      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        name: wizardName,
        age: ageNum,
        gender: wizardGender,
        height: heightNum,
        weight: weightNum,
        activityLevel: wizardActivity,
        sleepHours: sleepNum,
        waterIntake: waterNum,
        fitnessGoals: wizardGoals,
        targetWeight: targetWNum,
        targetDate: wizardTargetDate,
        bmi,
        bmiCategory: category,
        createdAt: new Date().toISOString()
      };

      const startWeight = weightNum;
      const initialLogs = populateMockHistory(user.uid, startWeight, targetWNum);

      const hydration = Math.round((weightNum * 0.033) * 10) / 10;
      setTodayWater(hydration.toString());
      setTodaySleep('8');

      setProfile(newProfile);
      setLogs(initialLogs);
      setStreaks({ current: 4, best: 4 });

      const blueprint = await generateFitnessBlueprint(newProfile);

      setActiveWorkoutPlan(blueprint.workoutPlan);
      setActiveNutritionPlan(blueprint.nutritionPlan);
      localStorage.setItem(`fitai_workout_${user.uid}`, blueprint.workoutPlan);
      localStorage.setItem(`fitai_nutrition_${user.uid}`, blueprint.nutritionPlan);

      const logsArray = Object.values(initialLogs).sort((a, b) => a.timestamp - b.timestamp);
      const report = await generateWeeklyReport(newProfile, logsArray);
      setWeeklyReport(report);

      const completedCount = logsArray.filter(l => l.workoutCompleted).length;
      let newAdaptive: AdaptivePlan | null = null;
      if (completedCount <= 3) {
        newAdaptive = {
          originalWorkouts: 5,
          originalDuration: 45,
          adaptedWorkouts: 4,
          adaptedDuration: 25,
          reason: 'Biometric completion rate sits at 50%. Activating adaptive protocols to lower duration resistance and protect your streak.',
          isActive: false
        };
        setAdaptivePlan(newAdaptive);
      }

      const updatedState: UserState = {
        profile: newProfile,
        logs: initialLogs,
        xp: 100,
        level: 1,
        streaks: { current: 4, best: 4 },
        achievements: {
          hydrationHero: false,
          sleepChampion: false,
          fitnessStarter: true,
          consistencyMaster: false
        },
        adaptivePlan: newAdaptive,
        weeklyReport: report
      };

      setXp(100);
      setAchievements(updatedState.achievements);
      await db.setDoc('users', user.uid, updatedState);

      triggerConfetti(0, 0);
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Log today's habit entries
  const handleLogHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const newLog: HabitLog = {
      date: dateStr,
      sleep: parseFloat(todaySleep) || 0,
      water: parseFloat(todayWater) || 0,
      workoutCompleted: todayWorkoutDone,
      workoutDuration: todayWorkoutDone ? (parseInt(todayWorkoutDuration) || 0) : 0,
      mealsCompleted: parseInt(todayMealsCount) || 0,
      caloriesConsumed: parseInt(todayCalories) || 0,
      proteinConsumed: parseInt(todayProtein) || 0,
      timestamp: Date.now()
    };

    const updatedLogs = { ...logs, [dateStr]: newLog };
    setLogs(updatedLogs);

    let gainedXP = 15;

    const dailyWaterTarget = Math.round((profile.weight || 70) * 0.033 * 10) / 10;
    if (newLog.water >= dailyWaterTarget && (!logs[dateStr] || logs[dateStr].water < dailyWaterTarget)) {
      gainedXP += 10;
    }
    if (newLog.sleep >= 8 && (!logs[dateStr] || logs[dateStr].sleep < 8)) {
      gainedXP += 10;
    }
    if (newLog.workoutCompleted && (!logs[dateStr] || !logs[dateStr].workoutCompleted)) {
      gainedXP += 15;
    }

    let currentStreak = streaks.current;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasLoggedToday = !!logs[dateStr];
    const hasLoggedYesterday = !!logs[yesterdayStr];

    if (!hasLoggedToday) {
      if (hasLoggedYesterday || Object.keys(logs).length === 0) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    const bestStreak = Math.max(currentStreak, streaks.best);
    const updatedStreaks = { current: currentStreak, best: bestStreak, lastActiveDate: dateStr };
    setStreaks(updatedStreaks);

    const newAchievements = { ...achievements };

    if (newLog.workoutCompleted) newAchievements.fitnessStarter = true;

    const logList = Object.values(updatedLogs);
    const waterMetDays = logList.filter(l => l.water >= dailyWaterTarget).length;
    const sleepMetDays = logList.filter(l => l.sleep >= 8).length;

    if (waterMetDays >= 3) newAchievements.hydrationHero = true;
    if (sleepMetDays >= 3) newAchievements.sleepChampion = true;
    if (overallConsistency >= 80 && logList.length >= 5) newAchievements.consistencyMaster = true;

    let achievementUnlocked = false;
    Object.keys(newAchievements).forEach((key) => {
      const k = key as keyof typeof achievements;
      if (newAchievements[k] && !achievements[k]) {
        achievementUnlocked = true;
        gainedXP += 50;
      }
    });

    setAchievements(newAchievements);
    awardXP(gainedXP);

    if (achievementUnlocked) {
      triggerConfetti(0, 0);
    }

    const updatedQuests = quests.map(q => {
      if (q.id === 'q1' && newLog.water >= 2.5) return { ...q, completed: true };
      if (q.id === 'q2' && newLog.workoutCompleted && newLog.workoutDuration >= 25) return { ...q, completed: true };
      if (q.id === 'q3' && newLog.sleep >= 8) return { ...q, completed: true };
      return q;
    });
    setQuests(updatedQuests);

    saveStateToDB({
      logs: updatedLogs,
      streaks: updatedStreaks,
      achievements: newAchievements
    });
  };

  // Claim Quest Reward
  const handleClaimQuest = (id: string, e: React.MouseEvent) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || !quest.completed || quest.claimed) return;

    triggerConfetti(e.clientX, e.clientY);

    setQuests(prev => prev.map(q => q.id === id ? { ...q, claimed: true } : q));
    awardXP(quest.xpReward, e.clientX, e.clientY);

    setTimeout(() => {
      const newPool = [
        { text: 'Conquer a 40m High-Intensity session', xpReward: 50 },
        { text: 'Absorb 130g of pure muscle-building protein', xpReward: 40 },
        { text: 'Excel across all 4 core habits today', xpReward: 60 },
        { text: 'Infuse 3L of water into your body system', xpReward: 35 },
        { text: 'Sleep 8.5 hours for full recovery optimization', xpReward: 45 }
      ];

      const selected = newPool[Math.floor(Math.random() * newPool.length)];

      setQuests(prev => prev.map(q => q.id === id ? {
        id: 'q_' + Math.random().toString(36).substring(2, 6),
        text: selected.text,
        xpReward: selected.xpReward,
        completed: false,
        claimed: false
      } : q));
    }, 1500);
  };

  // Adaptive Planning Action
  const handleApplyAdaptation = () => {
    if (!adaptivePlan || !profile || !user) return;

    const message = `
### Weekly Workout Schedule (Adapted for Adherence)
* **Monday (Strength Foundation):** 25 mins High Intensity Focus (Upper Body Compound)
* **Tuesday (Circadian Flow):** 15 mins dynamic stretching & thoracic mobility flow
* **Wednesday:** Rest and Epigenetic Recovery Day
* **Thursday (Strength Activation):** 25 mins Core Stability & Lower Body squats
* **Friday (Cardiovascular Surge):** 20 mins HIIT / tempo fat-burner circuit
* **Saturday:** Outdoor Movement (Walk/Recreation)
* **Sunday:** Circadian sleep reset.
    `;

    setActiveWorkoutPlan(message);
    localStorage.setItem(`fitai_workout_${user.uid}`, message);

    const newAdaptive = { ...adaptivePlan, isActive: true };
    setAdaptivePlan(newAdaptive);

    awardXP(30);
    triggerConfetti(0, 0);
    saveStateToDB({ adaptivePlan: newAdaptive });
  };

  // AI Chat submission
  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: textToSend, time };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const logsArray = Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);
      const reply = await getAICoachReply(textToSend, profile, logsArray, history);

      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const chatChips = [
    "Recalibrate my consistency index",
    "Request 15-min functional workout",
    "Directives to hit protein markers",
    "Optimise sleep circadian window"
  ];

  // Calculate consistency scores
  const consistencyStats = useMemo(() => {
    const logList = Object.values(logs);
    if (logList.length === 0) {
      return { workout: 0, sleep: 0, water: 0, nutrition: 0, overall: 0 };
    }

    const totalDays = logList.length;
    const waterTarget = profile ? Math.round((profile.weight || 70) * 0.033 * 10) / 10 : 2.5;

    let workoutSuccess = 0;
    let sleepSuccess = 0;
    let waterSuccess = 0;
    let nutritionSuccess = 0;

    logList.forEach(log => {
      if (log.workoutCompleted) workoutSuccess++;
      if (log.sleep >= 8) sleepSuccess++;
      if (log.water >= waterTarget) waterSuccess++;
      if (log.mealsCompleted >= 3 || (log.caloriesConsumed > 1500 && log.caloriesConsumed < 2500)) {
        nutritionSuccess++;
      }
    });

    const workoutScore = Math.round((workoutSuccess / totalDays) * 100);
    const sleepScore = Math.round((sleepSuccess / totalDays) * 100);
    const waterScore = Math.round((waterSuccess / totalDays) * 100);
    const nutritionScore = Math.round((nutritionSuccess / totalDays) * 100);
    const overallScore = Math.round((workoutScore + sleepScore + waterScore + nutritionScore) / 4);

    return {
      workout: workoutScore,
      sleep: sleepScore,
      water: waterScore,
      nutrition: nutritionScore,
      overall: overallScore
    };
  }, [logs, profile]);

  const overallConsistency = consistencyStats.overall;

  // Consistency Risk Alerts
  const riskAlert = useMemo(() => {
    if (Object.keys(logs).length < 3) return null;

    const sorted = Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(-4);

    if (recent.length >= 2 && !recent[recent.length - 1].workoutCompleted && !recent[recent.length - 2].workoutCompleted) {
      return {
        type: 'danger',
        message: "momentum hazard: Two consecutive training sessions missed. Muscle protein synthesis markers are declining. Complete a 15-minute high-intensity micro-workout today to reset circadian momentum.",
        scoreDrop: 15
      };
    }

    if (recent.length >= 3 && recent[recent.length - 1].sleep < 6.5 && recent[recent.length - 2].sleep < 6.5) {
      return {
        type: 'warning',
        message: "recovery deficit: Sleeping hours fell under 6.5h for two consecutive nights. Cortisol elevations detected. Prioritize screen exclusion 45 minutes before bedtime.",
        scoreDrop: 8
      };
    }

    const waterTarget = profile ? Math.round((profile.weight || 70) * 0.033 * 10) / 10 : 2.5;
    if (recent.length >= 3 && recent[recent.length - 1].water < waterTarget * 0.7 && recent[recent.length - 2].water < waterTarget * 0.7) {
      return {
        type: 'info',
        message: `hydration drop: Cell hydration level is below 70% of ${waterTarget}L baseline. Metabolic filtration velocity has slowed. Drink 500ml of mineralized water.`,
        scoreDrop: 10
      };
    }

    if (sorted.length >= 6) {
      const last3 = sorted.slice(-3);
      const prev3 = sorted.slice(-6, -3);

      const last3Score = last3.filter(l => l.workoutCompleted).length;
      const prev3Score = prev3.filter(l => l.workoutCompleted).length;

      if (last3Score < prev3Score) {
        const drop = Math.round(((prev3Score - last3Score) / 3) * 100);
        return {
          type: 'warning',
          message: `Your consistency rating has dropped by ${drop}% in comparison with last week. Perform one active habit now to recover absolute alignment.`,
          scoreDrop: drop
        };
      }
    }

    return null;
  }, [logs, profile]);

  // Calculate Days Remaining
  const daysRemaining = useMemo(() => {
    if (!profile?.targetDate) return 0;
    const target = new Date(profile.targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [profile]);

  // Chart data calculations
  const chartVitals = useMemo(() => {
    const sorted = Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((log) => {
      const dateObj = new Date(log.date);
      const name = dateObj.toLocaleDateString([], { weekday: 'short' });

      const sleepTarget = 8;
      const waterTarget = profile ? Math.round((profile.weight || 70) * 0.033 * 10) / 10 : 2.5;

      let dayScore = 0;
      if (log.workoutCompleted) dayScore += 25;
      if (log.sleep >= sleepTarget) dayScore += 25;
      if (log.water >= waterTarget) dayScore += 25;
      if (log.mealsCompleted >= 3) dayScore += 25;

      return {
        name,
        date: log.date,
        workout: log.workoutCompleted ? 100 : 0,
        workoutDuration: log.workoutDuration,
        sleep: log.sleep,
        water: log.water,
        calories: log.caloriesConsumed,
        consistency: dayScore
      };
    });
  }, [logs, profile]);

  const svgDimensions = { width: 500, height: 200, padding: 30 };
  const plotWidth = svgDimensions.width - svgDimensions.padding * 2;
  const plotHeight = svgDimensions.height - svgDimensions.padding * 2;

  const consistencyPath = useMemo(() => {
    if (chartVitals.length < 2) return '';
    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      const y = svgDimensions.height - svgDimensions.padding - (d.consistency / 100) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [chartVitals]);

  const waterPath = useMemo(() => {
    if (chartVitals.length < 2) return '';
    const maxWater = 4;
    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      const val = Math.min(maxWater, d.water);
      const y = svgDimensions.height - svgDimensions.padding - (val / maxWater) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [chartVitals]);

  const weightTrendPath = useMemo(() => {
    if (chartVitals.length < 2 || !profile) return '';
    const startW = profile.weight || 78;
    const targetW = profile.targetWeight || 72;

    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      let currentEstimate = startW;
      for (let j = 0; j <= index; j++) {
        const day = chartVitals[j];
        if (day.consistency >= 75) {
          currentEstimate -= (startW > targetW ? 0.12 : -0.12);
        } else if (day.consistency < 25) {
          currentEstimate += (startW > targetW ? 0.05 : -0.05);
        }
      }
      const minBound = Math.min(startW, targetW) - 2;
      const maxBound = Math.max(startW, targetW) + 2;
      const range = maxBound - minBound || 10;
      const y = svgDimensions.height - svgDimensions.padding - ((currentEstimate - minBound) / range) * plotHeight;

      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [chartVitals, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col justify-center items-center text-cyber-primary bg-tech-grid bg-dot-matrix hologram-scanline">
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-t-2 border-cyan-400 animate-spin" />
          <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-sm tracking-[0.25em] text-cyan-400 font-mono font-bold text-glow-cyan animate-pulse">SYNCHRONISING SYSTEM CORES</p>
        <span className="text-[10px] text-cyber-dim font-mono mt-2 uppercase">Core status: SECURE // BMR CALIBRATION</span>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col relative bg-[#050508] text-cyber-primary font-sans min-h-screen select-none bg-tech-grid bg-dot-matrix">
      
      {/* Background Glow Blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-cyan-900/10 top-0 left-[-100px] animate-bg-pan" />
      <div className="glow-blob w-[450px] h-[450px] bg-violet-900/10 bottom-0 right-[-100px] animate-bg-pan" />
      <div className="glow-blob w-[400px] h-[400px] bg-rose-900/5 top-1/2 left-1/3" />

      {/* Confetti canvas animation */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            backgroundColor: particle.color,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 12 + 6}px`,
            animationDelay: `${Math.random() * 0.2}s`,
            animationDuration: `${Math.random() * 1.5 + 1.2}s`
          }}
        />
      ))}

      {/* --- LANDING HERO PAGE (UNAUTHENTICATED) --- */}
      {!user && (
        <div className="flex-grow flex flex-col z-10 relative">
          {/* Header Bar */}
          <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-cyber-divider">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Brain className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-cyber-primary font-mono">Fit<span className="text-cyan-400">AI</span> Coach</span>
                <span className="text-[8px] text-cyber-muted font-mono tracking-widest uppercase">Consistency Engine // V2.5</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> SECURE WORKSPACE
              </span>
              <a href="#auth-section" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold font-mono transition-all text-cyber-primary border border-cyber-divider hover:border-cyber-divider">
                ENTER HUBS
              </a>
            </div>
          </header>

          {/* Hero Section Container */}
          <div className="max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Info Column */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-400/20 shadow-inner">
                <Sparkle className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span className="text-[10px] text-cyan-300 font-mono font-bold tracking-wider uppercase">Adaptive Epigenetic Optimization</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] text-cyber-primary">
                Unleash Your <br />
                <span className="gradient-text-cyan-blue text-glow-cyan">Absolute Consistency</span>
              </h1>

              <p className="text-cyber-muted text-sm sm:text-base max-w-xl leading-relaxed">
                Unlock your physical potential. FitAI Coach bridges the gap between biological directives and physical execution, dynamically scaling workloads to guarantee streaks never break.
              </p>

              {/* Showcase mini widgets */}
              <div className="grid grid-cols-3 gap-4 max-w-lg border-y border-cyber-divider py-6 font-mono">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400 text-glow-cyan">84.2%</div>
                  <div className="text-[9px] text-cyber-dim uppercase mt-1 tracking-wider">Avg Adherence</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-violet-400 text-glow-violet">Lvl 12</div>
                  <div className="text-[9px] text-cyber-dim uppercase mt-1 tracking-wider">Aesthetic Cap</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-rose-400 text-glow-rose">SIRT1</div>
                  <div className="text-[9px] text-cyber-dim uppercase mt-1 tracking-wider">Gene Active</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <a
                  href="#auth-section"
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 font-black tracking-widest text-xs uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  Start Athletic Assessment
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </a>
                <div className="flex items-center justify-center gap-2 text-cyber-dim text-[10px] font-mono uppercase">
                  <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
                  Biometric Engine Offline Mode Available
                </div>
              </div>
            </div>

            {/* Auth Form and Visual Preview Column */}
            <div id="auth-section" className="lg:col-span-5 w-full flex flex-col gap-6">
              <div className="glass-card p-8 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-2xl relative overflow-hidden hologram-scanline">
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />
                <div className="hud-corner-bl" />
                <div className="hud-corner-br" />

                <div className="flex flex-col items-center mb-6">
                  <div className="bg-cyan-500/10 w-12 h-12 rounded-full flex items-center justify-center border border-cyan-500/30 mb-3 shadow-inner">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-cyber-primary">SYSTEM AUTHENTICATION</h2>
                  <p className="text-cyber-dim text-[9px] font-mono tracking-widest mt-1 uppercase">INITIALISE SESSION INTERFACE</p>
                </div>

                {/* Form Tabs */}
                <div className="grid grid-cols-2 bg-cyber-input/90 p-1 rounded-xl border border-cyber-divider mb-6 font-mono">
                  <button
                    onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all uppercase ${authMode === 'signup' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-cyber-muted hover:text-cyber-primary'}`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all uppercase ${authMode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-cyber-muted hover:text-cyber-primary'}`}
                  >
                    Access Profile
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-5 text-left">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest">Athletic ID (Email)</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@fitness.com"
                      className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-2.5 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest">Access Protocol (Password)</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-2.5 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      required
                    />
                  </div>

                  {authError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 font-mono">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 animate-pulse" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-violet-550 hover:from-cyan-400 hover:to-violet-400 text-slate-950 font-black py-3.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    {authLoading ? 'ESTABLISHING HANDSHAKE...' : authMode === 'signup' ? 'Create FitAI Core Profile' : 'Authenticate Fitness Matrix'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DIAGNOSTIC ASSESSMENT WIZARD SCREEN --- */}
      {user && !profile?.name && (
        <div className="flex-grow flex items-center justify-center p-4 z-10 relative bg-tech-grid">
          <div className="glass-card p-8 rounded-2xl w-full max-w-2xl border border-cyber-divider bg-cyber-input/80 shadow-2xl relative overflow-hidden hologram-scanline">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />

            {/* Diagnostic Steps Progress Indicator */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyber-divider">
              <div className="flex flex-col text-left">
                <h2 className="text-xl font-bold font-mono text-cyber-primary tracking-widest uppercase">DIAGNOSTIC ASSESSMENT</h2>
                <p className="text-[9px] text-cyber-dim font-mono tracking-widest uppercase mt-0.5">Calibrating DNA-Coach Epigenetic Blueprints</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-10 h-1 rounded-full transition-all ${onboardingStep >= step ? 'bg-cyan-400 text-glow-cyan' : 'bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="text-left">
              {/* Step 1: Personal Profile */}
              {onboardingStep === 1 && (
                <div className="space-y-5">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <h3 className="text-sm font-bold text-cyber-primary font-mono tracking-widest uppercase">01 // IDENTITY PROTOCOLS</h3>
                    <p className="text-[10px] text-cyber-muted mt-0.5">Primary identification and biometric measurements.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Athlete Nom-de-Guerre</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="e.g. Alexander Mercer"
                      className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Age</label>
                      <input
                        type="number"
                        value={wizardAge}
                        onChange={(e) => setWizardAge(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Height (cm)</label>
                      <input
                        type="number"
                        value={wizardHeight}
                        onChange={(e) => setWizardHeight(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Weight (kg)</label>
                      <input
                        type="number"
                        value={wizardWeight}
                        onChange={(e) => setWizardWeight(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-2">Biological Phenotype</label>
                    <div className="grid grid-cols-2 gap-4 font-mono">
                      {['male', 'female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setWizardGender(g)}
                          className={`py-3 text-xs font-bold rounded-lg border uppercase transition-all flex items-center justify-center gap-2 ${wizardGender === g ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 text-glow-cyan' : 'border-cyber-divider text-cyber-muted bg-cyber-input/70'}`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          {g === 'male' ? 'XY Phenotype (Male)' : 'XX Phenotype (Female)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Lifestyle Baseline */}
              {onboardingStep === 2 && (
                <div className="space-y-5">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <h3 className="text-sm font-bold text-cyber-primary font-mono tracking-widest uppercase">02 // LIFESTYLE DISPOSITION</h3>
                    <p className="text-[10px] text-cyber-muted mt-0.5">Calibrate metabolic baseline values for energy tracking.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-2">Metabolic Activity Class</label>
                    <div className="space-y-2">
                      {[
                        { id: 'sedentary', label: 'Hypokinetic Baseline (Sedentary, Desk job, Minimal active routines)' },
                        { id: 'moderate', label: 'Homeostatic Active (Moderate, 3-5 athletic drills/week)' },
                        { id: 'high', label: 'Hyperkinetic Metabolism (Strenuous athletic loads, high volume daily drills)' }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => setWizardActivity(act.id)}
                          className={`w-full py-3.5 px-4 text-left text-xs rounded-lg border transition-all flex items-center justify-between font-mono ${wizardActivity === act.id ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'border-cyber-divider text-cyber-muted bg-cyber-input/70'}`}
                        >
                          <span>{act.label}</span>
                          <span className={`w-2 h-2 rounded-full ${wizardActivity === act.id ? 'bg-cyan-400 animate-pulse' : 'bg-slate-800'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Avg Sleep (Hours / Night)</label>
                      <input
                        type="number"
                        value={wizardSleep}
                        onChange={(e) => setWizardSleep(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Avg Water (Liters / Day)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={wizardWater}
                        onChange={(e) => setWizardWater(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Goals Calibration */}
              {onboardingStep === 3 && (
                <div className="space-y-5">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <h3 className="text-sm font-bold text-cyber-primary font-mono tracking-widest uppercase">03 // BIOMETRIC DIRECTIVES</h3>
                    <p className="text-[10px] text-cyber-muted mt-0.5">Determine target parameters and genetic adaptation focus.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-2.5">Target Genetic Adaptation Targets</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                      {[
                        { id: 'weight-loss', label: 'Adipose Tissue Reduction (Weight Loss)' },
                        { id: 'weight-gain', label: 'Hypertrophic Weight Gain' },
                        { id: 'muscle-gain', label: 'Myofibrillar Hypertrophy (Muscle Gain)' },
                        { id: 'general-fitness', label: 'Mitochondrial Density (General Fitness)' },
                        { id: 'improve-stamina', label: 'VO2 Max Elevation (Stamina)' }
                      ].map((goal) => {
                        const isSelected = wizardGoals.includes(goal.id);
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWizardGoals(wizardGoals.filter(g => g !== goal.id));
                              } else {
                                setWizardGoals([...wizardGoals, goal.id]);
                              }
                            }}
                            className={`py-3 px-3.5 text-left text-[10px] font-bold rounded-lg border transition-all flex items-center justify-between ${isSelected ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 text-glow-cyan' : 'border-cyber-divider text-cyber-muted bg-cyber-input/70'}`}
                          >
                            <span>{goal.label}</span>
                            {isSelected ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <div className="w-3.5 h-3.5 border border-slate-700 rounded-sm" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Target Mass (kg)</label>
                      <input
                        type="number"
                        value={wizardTargetWeight}
                        onChange={(e) => setWizardTargetWeight(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-cyber-muted uppercase tracking-widest mb-1.5">Target Execution Horizon</label>
                      <input
                        type="date"
                        value={wizardTargetDate}
                        onChange={(e) => setWizardTargetDate(e.target.value)}
                        className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-3 text-xs text-cyber-secondary focus:outline-none focus:border-cyan-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Calculations Summary */}
              {onboardingStep === 4 && (
                <div className="space-y-5">
                  <div className="border-l-2 border-cyan-400 pl-3">
                    <h3 className="text-sm font-bold text-cyber-primary font-mono tracking-widest uppercase">04 // SYSTEM DIAGNOSTIC ANALYSIS</h3>
                    <p className="text-[10px] text-cyber-muted mt-0.5">Previewing algorithmic calculations for biometric initialization.</p>
                  </div>

                  {/* Redesigned BMI Dial preview */}
                  {(() => {
                    const { bmi, category } = calculateBMI(parseFloat(wizardWeight) || 70, parseFloat(wizardHeight) || 170);
                    // Determine percentage on a visual scale from 15 to 35
                    const scaledPercent = Math.max(0, Math.min(100, ((bmi - 15) / 20) * 100));
                    return (
                      <div className="bg-cyber-input/90 p-6 rounded-xl border border-cyber-divider text-center relative overflow-hidden">
                        <div className="hud-corner-tl" />
                        <div className="hud-corner-tr" />
                        <p className="text-cyber-dim text-[9px] font-mono tracking-widest mb-1.5">CALCULATED ATHLETIC BODY MASS INDEX (BMI)</p>
                        <div className="text-4xl font-black text-cyber-primary tracking-tight font-mono">{bmi.toFixed(1)}</div>
                        <div className="text-cyan-400 text-xs font-bold mt-1 uppercase font-mono tracking-wider">{category} Index Category</div>
                        
                        {/* Visual sliding BMI Scale */}
                        <div className="w-full h-1.5 bg-cyber-input rounded-full overflow-hidden mt-5 relative border border-cyber-divider">
                          <div className="absolute top-0 bottom-0 left-0 bg-cyan-500" style={{ width: `${scaledPercent}%` }} />
                          <div className="absolute top-[-3px] w-3 h-3 rounded-full bg-white border border-cyan-400 shadow shadow-cyan-400" style={{ left: `calc(${scaledPercent}% - 6px)` }} />
                        </div>
                        <div className="flex justify-between text-[8px] text-cyber-dim font-mono mt-1.5">
                          <span>18.5 (UNDER)</span>
                          <span>24.9 (NORMAL)</span>
                          <span>29.9 (OVER)</span>
                          <span>35.0 (OBESE)</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-cyber-input/50 border border-cyber-divider p-4 rounded-xl space-y-3 text-xs font-mono">
                    <div className="flex justify-between border-b border-cyber-divider pb-2">
                      <span className="text-cyber-dim uppercase">Registered Athlete:</span>
                      <span className="font-bold text-cyber-primary">{wizardName}</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-divider pb-2">
                      <span className="text-cyber-dim uppercase">Phenotype / Age:</span>
                      <span className="font-bold text-cyber-primary capitalize">{wizardGender} // {wizardAge} Years</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-divider pb-2">
                      <span className="text-cyber-dim uppercase">Physical Parameters:</span>
                      <span className="font-bold text-cyber-primary">{wizardHeight}cm // {wizardWeight}kg</span>
                    </div>
                    <div className="flex justify-between border-b border-cyber-divider pb-2">
                      <span className="text-cyber-dim uppercase">Biometric Directives:</span>
                      <span className="font-bold text-cyan-400">{wizardWeight}kg → {wizardTargetWeight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-dim uppercase">Activity Tier:</span>
                      <span className="font-bold text-cyber-primary uppercase">{wizardActivity}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div className="flex justify-between mt-8 pt-4 border-t border-cyber-divider font-mono">
                {onboardingStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(prev => prev - 1)}
                    className="border border-cyber-divider hover:border-cyber-divider bg-cyber-input text-cyber-muted hover:text-cyber-primary font-bold px-5 py-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    PREVIOUS
                  </button>
                ) : (
                  <div />
                )}

                {onboardingStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onboardingStep === 1 && !wizardName.trim()) return;
                      setOnboardingStep(prev => prev + 1);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/10 flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <span>NEXT PROTOCOL</span>
                    <ChevronRight className="w-4 h-4 text-slate-950" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 font-black px-8 py-3 rounded-lg text-xs tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] ml-auto cursor-pointer"
                  >
                    {authLoading ? 'COMPUTING BLUEPRINTS...' : 'INITIALISE FITAI SYSTEM CORE'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- AUTHENTICATED ATHLETIC CORE INTERFACE --- */}
      {user && profile?.name && (
        <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 z-10 relative">
          
          {/* SIDE NAVIGATION PANEL */}
          <aside className="w-full md:w-64 flex flex-col gap-4 text-left shrink-0">
            {/* User Profile Summary */}
            <div className="glass-card p-5 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              
              {/* User Avatar with circular level rings */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-3.5">
                {/* SVG circular level meter border */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" strokeWidth="2.5" stroke="rgba(255,255,255,0.03)" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    strokeWidth="2.5"
                    stroke="url(#avatarGradient)"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - xp / (level * 100))}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="w-15 h-15 rounded-full bg-cyber-input flex items-center justify-center font-bold font-mono text-cyan-400 text-xl border border-cyan-500/20 relative shadow-inner">
                  {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute bottom-[-2px] right-[-2px] bg-gradient-to-tr from-cyan-500 to-violet-500 text-slate-950 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center font-mono border border-slate-950 shadow">
                  {level}
                </div>
              </div>

              <h2 className="text-base font-bold text-cyber-primary mt-1 leading-tight font-mono tracking-wide">{profile.name}</h2>
              
              <div className="flex items-center gap-2 mt-1.5 justify-center">
                <span className="text-[9px] text-cyber-dim uppercase tracking-widest font-mono">LEVEL {level}</span>
                <span className="text-slate-800">•</span>
                <span className="text-[9px] text-cyan-400 font-mono font-bold flex items-center gap-0.5 text-glow-cyan">
                  <Flame className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
                  {streaks.current} DAYS
                </span>
              </div>

              {/* XP progress metrics */}
              <div className="w-full mt-4 space-y-1 font-mono text-[9px]">
                <div className="flex justify-between text-cyber-muted">
                  <span>{xp} XP</span>
                  <span>{level * 100} XP NEXT</span>
                </div>
                <div className="w-full h-1 bg-cyber-input rounded-full overflow-hidden border border-cyber-divider">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700"
                    style={{ width: `${(xp / (level * 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyber-input/70 border border-cyber-divider hover:border-cyber-divider text-[9px] font-bold font-mono text-cyber-muted hover:text-cyber-primary transition-all shadow-inner"
              >
                <span>THEME PROTOCOL</span>
                <span className="flex items-center gap-1 font-bold text-cyan-400 uppercase tracking-widest text-glow-cyan">
                  {theme === 'dark' ? (
                    <>
                      <MoonIcon className="w-3.5 h-3.5" />
                      DARK
                    </>
                  ) : (
                    <>
                      <SunIcon className="w-3.5 h-3.5" />
                      LIGHT
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="glass-card p-2 rounded-2xl border border-cyber-divider bg-cyber-input/70 space-y-1 shadow-lg relative">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              {[
                { id: 'dashboard', label: 'ATHLETIC CONSOLE', icon: Activity },
                { id: 'chat', label: 'AI COACH ASSISTANT', icon: Brain },
                { id: 'adaptive', label: 'ADAPTIVE INTERFACE', icon: Compass },
                { id: 'report', label: 'COACH BIOMETRICS', icon: ShieldAlert }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold font-mono rounded-xl transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border border-cyan-500/30 text-glow-cyan' : 'text-cyber-muted border border-transparent hover:text-cyber-primary hover:bg-white/5'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* API Config details */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="glass-card py-3.5 px-4 rounded-2xl border border-cyber-divider bg-cyber-input/70 flex items-center justify-between text-[10px] font-bold font-mono text-cyan-400 hover:text-cyan-300 hover:border-cyber-divider shadow-md relative"
            >
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 shrink-0" />
                API MATRIX
              </span>
              <span className="text-[8px] text-cyber-dim uppercase tracking-widest">
                {getGeminiApiKey() ? 'LIVE' : 'MOCK'}
              </span>
            </button>

            {/* Disconnect Button */}
            <button
              onClick={handleSignOut}
              className="glass-card py-3 px-4 rounded-2xl border border-rose-950/20 bg-rose-950/10 text-rose-400 hover:bg-rose-950/25 hover:text-rose-300 flex items-center justify-center gap-2 text-[10px] font-bold font-mono transition-all uppercase tracking-widest relative"
            >
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Disconnect System</span>
            </button>
          </aside>

          {/* MAIN DASHBOARD CONTENT AREA */}
          <main className="flex-grow flex flex-col gap-6 text-left">

            {/* CORE STATUS ENGINE OVERLAY HEADER */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyber-divider pb-4 font-mono">
              <div className="flex flex-col">
                <span className="text-[9px] text-cyber-dim tracking-[0.25em] uppercase">SYSTEM COMMAND INTERFACE</span>
                <span className="text-lg font-black text-cyber-primary tracking-wide uppercase">FitAI // Athletic Command Console</span>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] text-emerald-400 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  COACH ONLINE
                </span>
                <span className="text-[10px] text-cyber-dim">CONN: SECURE_NET</span>
              </div>
            </div>

            {/* CONSISTENCY RISK ALERTS BANNER */}
            {riskAlert && activeTab === 'dashboard' && (
              <div className={`border rounded-2xl p-4 flex gap-3.5 shadow-lg transition-all animate-float relative overflow-hidden ${
                riskAlert.type === 'danger' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                riskAlert.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
                'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}>
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 animate-pulse ${
                  riskAlert.type === 'danger' ? 'text-rose-400' :
                  riskAlert.type === 'warning' ? 'text-orange-400' :
                  'text-cyan-400'
                }`} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest font-mono">SYSTEM ANOMALY DETECTION // RISK: {riskAlert.scoreDrop}% ACCEL</h4>
                  <p className="text-xs font-sans leading-relaxed text-cyber-secondary uppercase-first">{riskAlert.message}</p>
                </div>
              </div>
            )}

            {/* TAB VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
                {/* 1. HEALTH SUMMARY GRID */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* BMI */}
                  <div className="glass-card p-4 rounded-xl border border-cyber-divider bg-cyber-input/50 relative">
                    <div className="hud-corner-tl" />
                    <p className="text-[9px] font-mono text-cyber-dim tracking-wider uppercase">Biometric BMI</p>
                    <p className="text-xl font-bold mt-1 text-cyber-primary font-mono">{profile.bmi?.toFixed(1) || '22.4'}</p>
                    <p className="text-[8px] text-cyan-400 font-mono mt-0.5 capitalize tracking-wider">{profile.bmiCategory || 'Normal'}</p>
                  </div>
                  {/* Current Weight */}
                  <div className="glass-card p-4 rounded-xl border border-cyber-divider bg-cyber-input/50">
                    <p className="text-[9px] font-mono text-cyber-dim tracking-wider uppercase">Current Mass</p>
                    <p className="text-xl font-bold mt-1 text-cyber-primary font-mono">{profile.weight || '70'} kg</p>
                    <p className="text-[8px] text-cyber-dim font-mono mt-0.5">Biometric Load</p>
                  </div>
                  {/* Target Weight */}
                  <div className="glass-card p-4 rounded-xl border border-cyber-divider bg-cyber-input/50">
                    <p className="text-[9px] font-mono text-cyber-dim tracking-wider uppercase">Target Mass</p>
                    <p className="text-xl font-bold mt-1 text-cyber-primary font-mono">{profile.targetWeight || '68'} kg</p>
                    <p className="text-[8px] text-cyber-dim font-mono mt-0.5">Physical Target</p>
                  </div>
                  {/* Days remaining */}
                  <div className="glass-card p-4 rounded-xl border border-cyber-divider bg-cyber-input/50">
                    <p className="text-[9px] font-mono text-cyber-dim tracking-wider uppercase">Time remaining</p>
                    <p className="text-xl font-bold mt-1 text-cyber-primary font-mono">{daysRemaining} D</p>
                    <p className="text-[8px] text-cyber-dim font-mono mt-0.5">Horizon limit</p>
                  </div>
                  {/* Consistency Rating */}
                  <div className="glass-card p-4 rounded-xl border border-cyan-800/40 bg-cyan-950/15 col-span-2 md:col-span-1 shadow-inner relative">
                    <div className="hud-corner-tr" />
                    <p className="text-[9px] font-mono text-cyan-400 tracking-wider uppercase">Consistency Index</p>
                    <p className="text-xl font-black mt-1 text-cyan-300 font-mono text-glow-cyan">{overallConsistency}%</p>
                    <p className="text-[8px] text-cyber-muted font-mono mt-0.5 uppercase tracking-wider">
                      {overallConsistency >= 80 ? 'hyperkinetic' :
                       overallConsistency >= 50 ? 'homeostatic' :
                       'hypokinetic'}
                    </p>
                  </div>
                </div>

                {/* 2. THE HERO CONSISTENCY SCORE SECTION */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl relative overflow-hidden">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  
                  <div className="flex items-center gap-2.5 mb-6 border-b border-cyber-divider pb-3">
                    <Target className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">CONSISTENCY ADHERENCE BIORHYTHM</h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center items-center">
                    
                    {/* Overall Ring (Redesigned as a massive radial gauge) */}
                    <div className="flex flex-col items-center justify-center col-span-2 lg:col-span-1 border-r border-cyber-divider pr-0 lg:pr-6">
                      <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="rgba(255,255,255,0.03)" fill="transparent" />
                          <circle
                            cx="64" cy="64" r="54" strokeWidth="8"
                            stroke="url(#cyanGlow)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 54}
                            strokeDashoffset={2 * Math.PI * 54 * (1 - overallConsistency / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-black text-cyber-primary font-mono text-glow-cyan">{overallConsistency}%</span>
                          <span className="text-[8px] font-mono text-cyber-dim tracking-widest uppercase mt-0.5">OVERALL MATRIX</span>
                        </div>
                      </div>
                    </div>

                    {/* Workout Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" strokeWidth="5.5" stroke="rgba(255,255,255,0.02)" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="40" strokeWidth="5.5"
                            stroke="var(--neon-violet)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - consistencyStats.workout / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Dumbbell className="w-4 h-4 text-violet-400 mb-0.5" />
                          <span className="text-xs font-bold text-cyber-primary font-mono">{consistencyStats.workout}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyber-muted tracking-wider">ATHLETIC RUNS</span>
                    </div>

                    {/* Sleep Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" strokeWidth="5.5" stroke="rgba(255,255,255,0.02)" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="40" strokeWidth="5.5"
                            stroke="var(--neon-rose)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - consistencyStats.sleep / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Moon className="w-4 h-4 text-rose-400 mb-0.5" />
                          <span className="text-xs font-bold text-cyber-primary font-mono">{consistencyStats.sleep}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyber-muted tracking-wider">CIRCADIAN RECOVERY</span>
                    </div>

                    {/* Hydration Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" strokeWidth="5.5" stroke="rgba(255,255,255,0.02)" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="40" strokeWidth="5.5"
                            stroke="var(--neon-cyan)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - consistencyStats.water / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Droplets className="w-4 h-4 text-cyan-400 mb-0.5" />
                          <span className="text-xs font-bold text-cyber-primary font-mono">{consistencyStats.water}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyber-muted tracking-wider">HYDRATION MARKS</span>
                    </div>

                    {/* Nutrition Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" strokeWidth="5.5" stroke="rgba(255,255,255,0.02)" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="40" strokeWidth="5.5"
                            stroke="var(--neon-green)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - consistencyStats.nutrition / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Flame className="w-4 h-4 text-emerald-400 mb-0.5" />
                          <span className="text-xs font-bold text-cyber-primary font-mono">{consistencyStats.nutrition}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyber-muted tracking-wider">NUTRITIONAL MARKS</span>
                    </div>

                  </div>

                  {/* SVG gradients definition */}
                  <svg className="hidden">
                    <defs>
                      <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f2fe" />
                        <stop offset="100%" stopColor="#7f00ff" />
                      </linearGradient>
                      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f2fe" />
                        <stop offset="100%" stopColor="#00f5a0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* 3. DAILY TRACKING LOGGERS & CHALLENGE BOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Daily Habit Logger Card */}
                  <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex flex-col relative">
                    <div className="hud-corner-tl" />
                    <div className="hud-corner-tr" />
                    <div className="flex items-center gap-2 mb-5 border-b border-cyber-divider pb-3">
                      <Plus className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">LOG DAILY BIOMETRICS</h3>
                    </div>

                    <form onSubmit={handleLogHabit} className="space-y-5 flex-grow flex flex-col justify-between">
                      <div className="space-y-4">
                        
                        {/* Sleep & Water inputs */}
                        <div className="grid grid-cols-2 gap-4 font-mono">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-cyber-muted uppercase mb-1.5 tracking-wider">Hours Slept (rest)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={todaySleep}
                              onChange={(e) => setTodaySleep(e.target.value)}
                              className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-3 py-2 text-sm text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono text-cyber-muted uppercase mb-1.5 tracking-wider">Water Intake (Liters)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={todayWater}
                              onChange={(e) => setTodayWater(e.target.value)}
                              className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-3 py-2 text-sm text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                              required
                            />
                          </div>
                        </div>

                        {/* Workout Checkbox & Duration */}
                        <div className="bg-cyber-input/90 p-4 rounded-xl border border-cyber-divider flex items-center justify-between font-mono">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="workoutDone"
                              checked={todayWorkoutDone}
                              onChange={(e) => setTodayWorkoutDone(e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-500 bg-cyber-input border-cyber-divider focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <label htmlFor="workoutDone" className="text-xs text-cyber-secondary font-bold uppercase tracking-wider cursor-pointer">Log Athletic Workout</label>
                          </div>
                          {todayWorkoutDone && (
                            <div className="flex items-center gap-1.5 shrink-0 animate-pulse">
                              <input
                                type="number"
                                value={todayWorkoutDuration}
                                onChange={(e) => setTodayWorkoutDuration(e.target.value)}
                                className="w-16 bg-cyber-input border border-cyber-divider rounded px-2.5 py-1 text-xs text-right focus:outline-none text-cyber-primary font-mono"
                                placeholder="Mins"
                                required
                              />
                              <span className="text-[9px] font-mono text-cyber-dim">MINS</span>
                            </div>
                          )}
                        </div>

                        {/* Calories, Protein & Meals count */}
                        <div className="grid grid-cols-3 gap-2 font-mono">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-cyber-muted uppercase mb-1 tracking-wider">Meals Count</label>
                            <input
                              type="number"
                              value={todayMealsCount}
                              onChange={(e) => setTodayMealsCount(e.target.value)}
                              className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-3 py-2 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-cyber-muted uppercase mb-1 tracking-wider">Calories (kcal)</label>
                            <input
                              type="number"
                              value={todayCalories}
                              onChange={(e) => setTodayCalories(e.target.value)}
                              className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-3 py-2 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-cyber-muted uppercase mb-1 tracking-wider">Protein (g)</label>
                            <input
                              type="number"
                              value={todayProtein}
                              onChange={(e) => setTodayProtein(e.target.value)}
                              className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-3 py-2 text-xs text-cyber-primary focus:outline-none focus:border-cyan-500 font-mono"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-450 hover:to-teal-450 text-slate-950 font-black py-3 rounded-lg text-xs tracking-widest uppercase transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98] mt-4 font-mono cursor-pointer"
                      >
                        LOG BIOMETRICS & SYNC
                      </button>
                    </form>
                  </div>

                  {/* Quests / Gamification Board */}
                  <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex flex-col relative">
                    <div className="hud-corner-tl" />
                    <div className="hud-corner-tr" />
                    <div className="flex items-center justify-between mb-5 border-b border-cyber-divider pb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-400" />
                        <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">DAILY ADHERENCE QUESTS</h3>
                      </div>
                      <span className="text-[8px] font-mono bg-orange-500/10 border border-orange-555/20 px-2 py-0.5 rounded text-orange-450 tracking-wider">ACTIVE DRILLS</span>
                    </div>

                    <div className="space-y-3.5 flex-grow flex flex-col justify-center">
                      {quests.map((quest) => (
                        <div
                          key={quest.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all relative overflow-hidden ${
                            quest.claimed ? 'bg-cyber-input/30 border-cyber-divider opacity-45' :
                            quest.completed ? 'bg-emerald-950/15 border-emerald-800/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.08)]' :
                            'bg-cyber-input/70 border-cyber-divider'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-left">
                            <div className={`p-1.5 rounded-full shrink-0 border ${
                              quest.claimed ? 'border-cyber-divider bg-cyber-input text-cyber-dim' :
                              quest.completed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                              'border-cyber-divider bg-cyber-input text-cyber-dim'
                            }`}>
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold leading-snug">{quest.text}</p>
                              <span className="text-[8px] font-mono text-cyan-400 font-black tracking-wider">+{quest.xpReward} XP STIMULATOR</span>
                            </div>
                          </div>

                          {!quest.claimed && (
                            <button
                              disabled={!quest.completed}
                              onClick={(e) => handleClaimQuest(quest.id, e)}
                              className={`px-3 py-1.5 rounded text-[9px] font-bold font-mono transition-all uppercase shrink-0 tracking-wider cursor-pointer ${
                                quest.completed ? 'bg-emerald-450 text-slate-950 hover:bg-emerald-400 shadow shadow-emerald-500/20' :
                                'bg-cyber-input text-cyber-dim border border-cyber-divider cursor-not-allowed'
                              }`}
                            >
                              CLAIM
                            </button>
                          )}
                          {quest.claimed && (
                            <span className="text-[8px] font-black font-mono text-cyber-dim mr-2 uppercase tracking-widest">CLAIMED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* 4. PROGRESS CHARTS (LIVE DETAILED METRIC CURVES) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Consistency & Water trend */}
                  <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex flex-col relative">
                    <div className="hud-corner-tl" />
                    <div className="hud-corner-tr" />
                    <div className="flex justify-between items-center mb-4 border-b border-cyber-divider pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">WEEKLY COHORT INDEX</h3>
                      </div>
                      <div className="flex gap-3 text-[8px] font-mono tracking-wider">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-cyan-400 rounded-sm shadow-sm" /> CONSISTENCY</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-violet-400 rounded-sm shadow-sm" /> HYDRATION</span>
                      </div>
                    </div>

                    <div className="relative w-full h-[190px] bg-cyber-input/70 border border-cyber-divider rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      {chartVitals.length < 2 ? (
                        <p className="text-xs text-cyber-dim font-mono tracking-wider">Biometric log points insufficient for cohort charting.</p>
                      ) : (
                        <svg viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} className="w-full h-full">
                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                            const y = svgDimensions.padding + r * plotHeight;
                            return (
                              <line
                                key={idx}
                                x1={svgDimensions.padding}
                                y1={y}
                                x2={svgDimensions.width - svgDimensions.padding}
                                y2={y}
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                            );
                          })}
                          
                          {/* Plot lines */}
                          <path d={consistencyPath} fill="none" stroke="var(--neon-cyan)" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]" />
                          <path d={waterPath} fill="none" stroke="var(--neon-violet)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" className="opacity-80" />

                          {/* Data points */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            const y = svgDimensions.height - svgDimensions.padding - (d.consistency / 100) * plotHeight;
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="4.5"
                                fill="#050508"
                                stroke="var(--neon-cyan)"
                                strokeWidth="3"
                              />
                            );
                          })}

                          {/* Weekday Labels */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            return (
                              <text
                                key={index}
                                x={x}
                                y={svgDimensions.height - 8}
                                fill="#64748b"
                                fontSize="9"
                                textAnchor="middle"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {d.name}
                              </text>
                            );
                          })}
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Weight progress curve */}
                  <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex flex-col relative">
                    <div className="hud-corner-tl" />
                    <div className="hud-corner-tr" />
                    <div className="flex justify-between items-center mb-4 border-b border-cyber-divider pb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-500" />
                        <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">MASS METABOLISM ESTIMATOR</h3>
                      </div>
                      <span className="text-[9px] font-mono text-rose-450 tracking-wider">TARGET: {profile.targetWeight} KG</span>
                    </div>

                    <div className="relative w-full h-[190px] bg-cyber-input/70 border border-cyber-divider rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      {chartVitals.length < 2 ? (
                        <p className="text-xs text-cyber-dim font-mono tracking-wider">Log stats to visualize weight trend updates.</p>
                      ) : (
                        <svg viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} className="w-full h-full">
                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                            const y = svgDimensions.padding + r * plotHeight;
                            return (
                              <line
                                key={idx}
                                x1={svgDimensions.padding}
                                y1={y}
                                x2={svgDimensions.width - svgDimensions.padding}
                                y2={y}
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                            );
                          })}
                          
                          {/* Plot lines */}
                          <path d={weightTrendPath} fill="none" stroke="var(--neon-rose)" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(255,8,68,0.4)]" />

                          {/* Data points */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            
                            let currentEstimate = profile.weight || 78;
                            const targetW = profile.targetWeight || 72;
                            const profileWeight = profile.weight || 78;
                            for (let j = 0; j <= index; j++) {
                              const day = chartVitals[j];
                              if (day.consistency >= 75) {
                                currentEstimate -= (profileWeight > targetW ? 0.12 : -0.12);
                              } else if (day.consistency < 25) {
                                currentEstimate += (profileWeight > targetW ? 0.05 : -0.05);
                              }
                            }
                            
                            const minBound = Math.min(profileWeight, targetW) - 2;
                            const maxBound = Math.max(profileWeight, targetW) + 2;
                            const range = maxBound - minBound || 10;
                            const y = svgDimensions.height - svgDimensions.padding - ((currentEstimate - minBound) / range) * plotHeight;

                            return (
                              <g key={index}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="4.5"
                                  fill="#050508"
                                  stroke="var(--neon-rose)"
                                  strokeWidth="3"
                                />
                                <text
                                  x={x}
                                  y={y - 10}
                                  fill="var(--neon-rose)"
                                  fontSize="9"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                >
                                  {currentEstimate.toFixed(1)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Labels */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            return (
                              <text
                                key={index}
                                x={x}
                                y={svgDimensions.height - 8}
                                fill="#64748b"
                                fontSize="9"
                                textAnchor="middle"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {d.name}
                              </text>
                            );
                          })}
                        </svg>
                      )}
                    </div>
                  </div>

                </div>

                {/* Achievements Showcase */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl relative">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="flex items-center gap-2.5 mb-5 border-b border-cyber-divider pb-3">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">UNLOCKABLE ATHLETIC MEDALS</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'hydrationHero', name: 'Hydration Hero', desc: 'Sustained water target metrics for 3+ logs', icon: Droplets, color: 'text-cyan-400 border-cyan-800/40 bg-cyan-950/10' },
                      { id: 'sleepChampion', name: 'Sleep Champion', desc: 'Synchronized sleep targets for 3+ logs', icon: Moon, color: 'text-rose-400 border-rose-800/40 bg-rose-950/10' },
                      { id: 'fitnessStarter', name: 'Fitness Starter', desc: 'Triggered first athletic training logs', icon: Dumbbell, color: 'text-violet-400 border-violet-800/40 bg-violet-950/10' },
                      { id: 'consistencyMaster', name: 'Consistency Master', desc: 'Secured an adherence index >= 80%', icon: Sparkles, color: 'text-amber-400 border-amber-800/40 bg-amber-950/10' }
                    ].map((badge) => {
                      const hasBadge = achievements[badge.id as keyof typeof achievements];
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-300 relative ${
                            hasBadge ? badge.color + ' border-neon-cyan scale-100 opacity-100 shadow-[0_0_15px_rgba(0,242,254,0.1)]' : 'border-cyber-divider bg-cyber-input/30 opacity-30 scale-95'
                          }`}
                        >
                          {/* Holographic scanning effect on unlocked badges */}
                          {hasBadge && <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />}
                          <div className={`p-3 rounded-full mb-3 shadow-inner ${hasBadge ? 'bg-cyber-input/50 border border-cyber-divider' : 'bg-cyber-input'}`}>
                            {hasBadge ? <Icon className="w-7 h-7" /> : <Lock className="w-7 h-7 text-cyber-dim" />}
                          </div>
                          <h4 className="text-xs font-bold text-cyber-primary leading-tight font-mono tracking-wide">{badge.name}</h4>
                          <p className="text-[10px] text-cyber-muted mt-1.5 leading-snug">{badge.desc}</p>
                          <span className="text-[8px] font-mono font-black mt-3 tracking-widest uppercase px-2 py-0.5 rounded bg-black/40 border border-cyber-divider">
                            {hasBadge ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB VIEW: AI COACH CHAT */}
            {activeTab === 'chat' && (
              <div className="glass-card rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl overflow-hidden flex flex-col h-[550px] relative hologram-scanline">
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />
                
                {/* Chat Panel Header */}
                <div className="p-4 bg-cyber-input/90 border-b border-cyber-divider flex items-center justify-between shrink-0 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-bold tracking-widest text-cyber-primary">COACH SYSTEM TERMINAL DIRECT</span>
                  </div>
                  <span className="text-[9px] text-cyber-dim uppercase tracking-widest">GEMINI // CORE_SYNC</span>
                </div>

                {/* Messages scrollarea */}
                <div className="flex-grow overflow-y-auto p-5 space-y-5">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 rounded-tr-none font-bold shadow-lg shadow-cyan-500/10'
                          : 'bg-cyber-input/90 border border-cyber-divider text-cyber-primary rounded-tl-none font-mono text-left'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <div className="markdown-chat whitespace-pre-line leading-relaxed">
                            {msg.text}
                          </div>
                        ) : (
                          <p className="font-sans font-bold">{msg.text}</p>
                        )}
                        <span className={`block text-[8px] mt-2 font-mono ${msg.sender === 'user' ? 'text-cyan-950' : 'text-cyber-dim text-right'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-cyber-input/90 border border-cyber-divider p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span className="animate-pulse tracking-widest">COACH DECIPHERING PATHWAYS...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestion Chips */}
                <div className="p-2.5 bg-cyber-input/50 border-t border-cyber-divider overflow-x-auto whitespace-nowrap flex gap-2 shrink-0 font-mono">
                  {chatChips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(chip)}
                      className="border border-cyber-divider bg-cyber-input text-[9px] font-bold font-mono text-cyan-400 hover:text-cyber-primary hover:border-cyan-500 px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input form */}
                <div className="p-3.5 bg-cyber-input/90 border-t border-cyber-divider shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Input questions regarding metabolic rates, circadian sync or workouts..."
                      className="flex-grow bg-cyber-input border border-cyber-divider rounded-xl px-4 py-3.5 text-xs sm:text-sm text-cyber-primary focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-3.5 rounded-xl transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98] shrink-0 cursor-pointer"
                    >
                      <Send className="w-4.5 h-4.5 text-slate-950" />
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* TAB VIEW: ADAPTIVE PLANNING */}
            {activeTab === 'adaptive' && (
              <div className="space-y-6">
                
                {/* Introduction banner */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl relative overflow-hidden">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="flex items-center gap-2.5 mb-3 border-b border-cyber-divider pb-2">
                    <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                    <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">AUTOMATED WORKLOAD ADAPTATION</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-cyber-secondary leading-relaxed font-sans">
                    Fitness consistency fails when physical load expectations collide with lifestyle friction. 
                    If you miss your target exercises repeatedly, our AI **Consistency Engine** scales training blocks down to micro-habits, preventing burnout and keeping momentum alive.
                  </p>
                </div>

                {/* Split comparison plan */}
                {adaptivePlan ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    
                    {/* Before Plan */}
                    <div className="glass-card p-6 rounded-2xl border border-rose-900/20 bg-rose-950/5 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-3 right-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-[8px] font-bold font-mono px-2 py-0.5 rounded tracking-wider uppercase">
                        INITIAL LOAD STATE
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-cyber-primary font-mono uppercase mb-4 border-b border-cyber-divider pb-2">Initial Adherence Load</h4>
                        <div className="space-y-3 font-mono text-xs text-cyber-secondary">
                          <div className="flex justify-between border-b border-cyber-divider pb-2">
                            <span className="text-cyber-dim">Weekly Cycles:</span>
                            <span className="font-bold text-cyber-primary">{adaptivePlan.originalWorkouts} drills / week</span>
                          </div>
                          <div className="flex justify-between border-b border-cyber-divider pb-2">
                            <span className="text-cyber-dim">Cycle Duration:</span>
                            <span className="font-bold text-cyber-primary">{adaptivePlan.originalDuration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-dim">Total Workload Time:</span>
                            <span className="font-bold text-rose-400">{adaptivePlan.originalWorkouts * adaptivePlan.originalDuration} mins / week</span>
                          </div>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 mt-6 text-xs text-rose-300 leading-relaxed font-sans">
                          <strong>Biometric Adherence Drop:</strong> Athlete completed only {Object.values(logs).filter(l => l.workoutCompleted).length} training routines this week. Circadian stress detected.
                        </div>
                      </div>
                    </div>

                    {/* Adapted After Plan */}
                    <div className={`glass-card p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
                      adaptivePlan.isActive ? 'border-emerald-800/80 bg-emerald-950/5' : 'border-cyan-800/60 bg-cyan-950/5 border-glow-cyan'
                    }`}>
                      <div className={`absolute top-3 right-3 border text-[8px] font-bold font-mono px-2 py-0.5 rounded tracking-wider uppercase ${
                        adaptivePlan.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}>
                        {adaptivePlan.isActive ? 'ACTIVE PLAN MATRIX' : 'RECOMMENDED DIRECTIVE'}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-cyber-primary font-mono uppercase mb-4 border-b border-cyber-divider pb-2">Scaled Adapted Blueprint</h4>
                        <div className="space-y-3 font-mono text-xs text-cyber-secondary">
                          <div className="flex justify-between border-b border-cyber-divider pb-2">
                            <span className="text-cyber-dim">Weekly Cycles:</span>
                            <span className="font-bold text-cyber-primary">{adaptivePlan.adaptedWorkouts} drills / week</span>
                          </div>
                          <div className="flex justify-between border-b border-cyber-divider pb-2">
                            <span className="text-cyber-dim">Cycle Duration:</span>
                            <span className="font-bold text-cyber-primary">{adaptivePlan.adaptedDuration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-dim">Total Workload Time:</span>
                            <span className="font-bold text-cyan-400">{adaptivePlan.adaptedWorkouts * adaptivePlan.adaptedDuration} mins / week</span>
                          </div>
                        </div>
                        <div className="bg-cyan-950/20 border border-cyan-800/35 rounded-xl p-3.5 mt-6 text-xs text-cyan-200 leading-relaxed font-sans">
                          <strong>AI Logic Adaptation:</strong> {adaptivePlan.reason}
                        </div>
                      </div>

                      {!adaptivePlan.isActive && (
                        <button
                          onClick={handleApplyAdaptation}
                          className="w-full bg-cyan-505 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2.5 rounded-lg text-xs tracking-widest uppercase transition-all shadow-md mt-6 font-mono cursor-pointer"
                        >
                          APPLY METRIC DIRECTIVES
                        </button>
                      )}

                      {adaptivePlan.isActive && (
                        <div className="w-full text-center py-2.5 rounded-lg text-xs font-bold font-mono text-emerald-450 border border-emerald-800 bg-emerald-950/20 mt-6 uppercase tracking-widest">
                          ADAPTATION SECURED IN BLUEPRINT
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="glass-card p-8 rounded-2xl border border-cyber-divider bg-cyber-input/50 text-center font-mono text-cyber-dim text-xs tracking-wider">
                    Adherence levels are stable. Adaptive thresholds will trigger if your consistency index falls under 70%.
                  </div>
                )}

              </div>
            )}

            {/* TAB VIEW: AI WEEKLY REPORT */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                
                {/* Introduction and stats */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl flex items-center justify-between relative">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold font-mono text-cyber-primary tracking-widest uppercase">COACH BIOMETRICS ANALYSIS</h3>
                    <p className="text-[10px] text-cyber-dim font-mono uppercase">Calculated across the preceding 7 diurnal rotations</p>
                  </div>
                  <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    MATRIX RECALIBRATED
                  </span>
                </div>

                {weeklyReport ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    
                    {/* Wins column */}
                    <div className="glass-card p-6 rounded-2xl border border-emerald-900/20 bg-emerald-950/5 flex flex-col gap-4 relative">
                      <div className="hud-corner-tl" />
                      <div className="flex items-center gap-2 border-b border-cyber-divider pb-2">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                        <h4 className="text-xs font-bold text-cyber-primary font-mono uppercase tracking-wider">SECURED ADVANCEMENTS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs sm:text-sm text-cyber-secondary list-disc pl-4 leading-relaxed">
                        {weeklyReport.wins.map((w, idx) => (
                          <li key={idx} className="marker:text-emerald-400">{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weak areas column */}
                    <div className="glass-card p-6 rounded-2xl border border-rose-900/20 bg-rose-950/5 flex flex-col gap-4 relative">
                      <div className="hud-corner-tl" />
                      <div className="flex items-center gap-2 border-b border-cyber-divider pb-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
                        <h4 className="text-xs font-bold text-cyber-primary font-mono uppercase tracking-wider">BIOMETRIC SLIPS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs sm:text-sm text-cyber-secondary list-disc pl-4 leading-relaxed">
                        {weeklyReport.weakAreas.map((w, idx) => (
                          <li key={idx} className="marker:text-rose-455">{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggestions column */}
                    <div className="glass-card p-6 rounded-2xl border border-cyan-900/25 bg-cyan-950/5 flex flex-col gap-4 relative">
                      <div className="hud-corner-tl" />
                      <div className="flex items-center gap-2 border-b border-cyber-divider pb-2">
                        <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                        <h4 className="text-xs font-bold text-cyber-primary font-mono uppercase tracking-wider">COACH INTERVENTIONS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs sm:text-sm text-cyber-secondary list-disc pl-4 leading-relaxed">
                        {weeklyReport.suggestions.map((w, idx) => (
                          <li key={idx} className="marker:text-cyan-450">{w}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ) : (
                  <div className="glass-card p-8 rounded-2xl border border-cyber-divider bg-cyber-input/50 text-center font-mono text-cyber-dim text-xs tracking-wider">
                    Feedback vectors require at least 4 active log frames. Perform more diurnal logs.
                  </div>
                )}

              </div>
            )}

            {/* LIVE ACTIVE PLANS DISPLAY CARD (FOOTER AREA) */}
            {activeWorkoutPlan && activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                
                {/* Workout blueprint */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl relative overflow-hidden">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="flex items-center gap-2 mb-3 border-b border-cyber-divider pb-2">
                    <Dumbbell className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-[10px] font-bold font-mono text-cyber-primary tracking-widest uppercase">ACTIVE CYCLICAL TRAINING PLAN</h4>
                  </div>
                  <div className="font-sans text-xs sm:text-sm leading-relaxed text-cyber-secondary max-h-[220px] overflow-y-auto whitespace-pre-line">
                    {activeWorkoutPlan}
                  </div>
                </div>

                {/* Nutrition blueprint */}
                <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input/70 shadow-xl relative overflow-hidden">
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="flex items-center gap-2 mb-3 border-b border-cyber-divider pb-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-[10px] font-bold font-mono text-cyber-primary tracking-widest uppercase">ACTIVE NUTRITIONAL FUEL PLAN</h4>
                  </div>
                  <div className="font-sans text-xs sm:text-sm leading-relaxed text-cyber-secondary max-h-[220px] overflow-y-auto whitespace-pre-line">
                    {activeNutritionPlan}
                  </div>
                </div>

              </div>
            )}

          </main>

        </div>
      )}

      {/* --- MOCK API CONFIGURATION MODAL --- */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-cyber-input/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-cyber-divider bg-cyber-input max-w-md w-full shadow-2xl space-y-4 relative text-left font-mono">
            <div className="hud-corner-tl" />
            <div className="hud-corner-tr" />
            <div className="hud-corner-bl" />
            <div className="hud-corner-br" />

            <div className="flex items-center gap-2.5 border-b border-cyber-divider pb-3">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs font-bold text-cyber-primary uppercase tracking-widest">GEMINI SYSTEM API KEY</h3>
            </div>
            
            <p className="text-[10px] text-cyber-muted leading-relaxed font-sans uppercase-first">
              FitAI Coach runs offline via a local heuristic model. 
              Input a Google Gemini API key to swap to the live **Gemini 1.5 Flash** model for blueprints and coaching feedback. Keys are cached locally and never sent to external servers.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-cyber-muted uppercase tracking-widest">Gemini API Token Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={getGeminiApiKey() ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                className="w-full bg-cyber-input border border-cyber-divider rounded-lg px-4 py-2.5 text-xs text-cyber-secondary focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="flex-1 border border-cyber-divider hover:border-cyber-divider bg-cyber-input py-2.5 rounded-lg text-cyber-muted font-bold tracking-widest uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2.5 rounded-lg font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
              >
                Save Protocol
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
