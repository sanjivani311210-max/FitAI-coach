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
  SunIcon
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

export default function FitDNACoach() {
  // Navigation & Authentication state
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'adaptive' | 'report' | 'profile'>('dashboard');

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
      text: "Hello! I am your FitDNA Coach. Ask me anything about your custom plan, workout strategies, optimizing nutrition, circadian sleep synchronization, or how to maintain consistency!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quest / Challenges State (Gamification)
  const [quests, setQuests] = useState([
    { id: 'q1', text: 'Reach 2.5L Water Intake today', xpReward: 30, completed: false, claimed: false },
    { id: 'q2', text: 'Log a workout of at least 25 minutes', xpReward: 40, completed: false, claimed: false },
    { id: 'q3', text: 'Log 8 hours of restorative sleep', xpReward: 30, completed: false, claimed: false }
  ]);

  // DNA Rotation Angle (Simulated Epigenetics)
  const [dnaAngle, setDnaAngle] = useState(0);

  // Confetti State
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Setup initial mock data when onboarding is completed
  const populateMockHistory = (userId: string, startWeight: number, targetW: number) => {
    const historicalLogs: Record<string, HabitLog> = {};
    const today = new Date();
    
    // Generate 6 days of historical data leading to today (Day -6 to Day -1)
    // Create a scenario: high enthusiasm at first, then a dip in workouts and sleep, which triggers risk alerts!
    const weights = [startWeight, startWeight - 0.2, startWeight - 0.1, startWeight + 0.1, startWeight, startWeight + 0.2];
    const sleepHrs = [7.5, 8.0, 6.0, 5.5, 7.0, 6.5];
    const waterLtrs = [2.2, 3.0, 1.5, 1.2, 2.0, 1.8];
    const workoutState = [true, true, false, false, true, false]; // 3 completed, 3 missed
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
        
        // Restore AI blueprints if they exist
        if (data.profile?.uid) {
          const storedWorkout = localStorage.getItem(`fitdna_workout_${userId}`);
          const storedNutrition = localStorage.getItem(`fitdna_nutrition_${userId}`);
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

    // Default target date for assessment
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

  // DNA Rotation Engine Loop
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const speed = 0.015 + (overallConsistency / 100) * 0.05;
      setDnaAngle((prev) => (prev + speed) % (Math.PI * 2));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [logs, profile]);

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
    const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b'];
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
      
      // Save state update
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

      // Populate history with mock logs so dashboard displays metrics immediately
      const startWeight = weightNum;
      const initialLogs = populateMockHistory(user.uid, startWeight, targetWNum);
      
      // Calculate today's water/sleep defaults based on targets
      const hydration = Math.round((weightNum * 0.033) * 10) / 10;
      setTodayWater(hydration.toString());
      setTodaySleep('8');
      
      // Initialise state
      setProfile(newProfile);
      setLogs(initialLogs);
      setStreaks({ current: 4, best: 4 }); // Starter streak
      
      // Generate blueprint from Gemini API
      const blueprint = await generateFitnessBlueprint(newProfile);
      
      setActiveWorkoutPlan(blueprint.workoutPlan);
      setActiveNutritionPlan(blueprint.nutritionPlan);
      localStorage.setItem(`fitdna_workout_${user.uid}`, blueprint.workoutPlan);
      localStorage.setItem(`fitdna_nutrition_${user.uid}`, blueprint.nutritionPlan);

      // Generate initial weekly AI report
      const logsArray = Object.values(initialLogs).sort((a, b) => a.timestamp - b.timestamp);
      const report = await generateWeeklyReport(newProfile, logsArray);
      setWeeklyReport(report);

      // Check if adaptive planning triggers (workout rate is 50% which is < 70%)
      const completedCount = logsArray.filter(l => l.workoutCompleted).length;
      if (completedCount <= 3) {
        // Trigger adaptive planning recommendation!
        const newAdaptive: AdaptivePlan = {
          originalWorkouts: 5,
          originalDuration: 45,
          adaptedWorkouts: 4,
          adaptedDuration: 25,
          reason: 'Your workout completion rate is 50% over the last week. Slicing workout durations and shifting to a 4-day plan will help recover consistency.',
          isActive: false
        };
        setAdaptivePlan(newAdaptive);
      }

      const updatedState: UserState = {
        profile: newProfile,
        logs: initialLogs,
        xp: 100, // Initial XP reward
        level: 1,
        streaks: { current: 4, best: 4 },
        achievements: {
          hydrationHero: false,
          sleepChampion: false,
          fitnessStarter: true, // Unlocked fitness starter
          consistencyMaster: false
        },
        adaptivePlan: completedCount <= 3 ? {
          originalWorkouts: 5,
          originalDuration: 45,
          adaptedWorkouts: 4,
          adaptedDuration: 25,
          reason: 'Your workout completion rate is 50% over the last week. Slicing workout durations and shifting to a 4-day plan will help recover consistency.',
          isActive: false
        } : null,
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

    // Calculate XP
    let gainedXP = 15; // Daily logging base reward
    
    // Check if hydration met
    const dailyWaterTarget = Math.round((profile.weight || 70) * 0.033 * 10) / 10;
    if (newLog.water >= dailyWaterTarget && (!logs[dateStr] || logs[dateStr].water < dailyWaterTarget)) {
      gainedXP += 10;
    }
    // Check if sleep met
    if (newLog.sleep >= 8 && (!logs[dateStr] || logs[dateStr].sleep < 8)) {
      gainedXP += 10;
    }
    // Check if workout met
    if (newLog.workoutCompleted && (!logs[dateStr] || !logs[dateStr].workoutCompleted)) {
      gainedXP += 15;
    }

    // Refresh streak calendar rules
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
        currentStreak = 1; // reset streak
      }
    }
    
    const bestStreak = Math.max(currentStreak, streaks.best);
    const updatedStreaks = { current: currentStreak, best: bestStreak, lastActiveDate: dateStr };
    setStreaks(updatedStreaks);

    // Evaluate Achievements
    const newAchievements = { ...achievements };
    
    // 1. Fitness Starter
    if (newLog.workoutCompleted) newAchievements.fitnessStarter = true;
    
    // Count historic successes
    const logList = Object.values(updatedLogs);
    const waterMetDays = logList.filter(l => l.water >= dailyWaterTarget).length;
    const sleepMetDays = logList.filter(l => l.sleep >= 8).length;

    // 2. Hydration Hero (3 days)
    if (waterMetDays >= 3) newAchievements.hydrationHero = true;

    // 3. Sleep Champion (3 days)
    if (sleepMetDays >= 3) newAchievements.sleepChampion = true;

    // 4. Consistency Master
    if (overallConsistency >= 80 && logList.length >= 5) newAchievements.consistencyMaster = true;

    // Trigger achievement sound/confetti
    let achievementUnlocked = false;
    Object.keys(newAchievements).forEach((key) => {
      const k = key as keyof typeof achievements;
      if (newAchievements[k] && !achievements[k]) {
        achievementUnlocked = true;
        gainedXP += 50; // Bonus for achievements
      }
    });

    setAchievements(newAchievements);
    awardXP(gainedXP);

    if (achievementUnlocked) {
      triggerConfetti(0, 0);
    }

    // Update quest tracking
    const updatedQuests = quests.map(q => {
      if (q.id === 'q1' && newLog.water >= 2.5) return { ...q, completed: true };
      if (q.id === 'q2' && newLog.workoutCompleted && newLog.workoutDuration >= 25) return { ...q, completed: true };
      if (q.id === 'q3' && newLog.sleep >= 8) return { ...q, completed: true };
      return q;
    });
    setQuests(updatedQuests);

    // Persist
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

    // Trigger confetti at click coordinate
    triggerConfetti(e.clientX, e.clientY);

    // Claim Quest
    setQuests(prev => prev.map(q => q.id === id ? { ...q, claimed: true } : q));
    awardXP(quest.xpReward, e.clientX, e.clientY);

    // Swap finished quest with a new random quest
    setTimeout(() => {
      const newPool = [
        { text: 'Complete a 40m High Intensity workout', xpReward: 50 },
        { text: 'Consume 130g of protein today', xpReward: 40 },
        { text: 'Meet all 4 habit goals today', xpReward: 60 },
        { text: 'Drink 3L of water', xpReward: 35 },
        { text: 'Sleep 8.5 hours for full DNA expression', xpReward: 45 }
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
    
    // Adapt recommendations
    const message = `
### Weekly Workout Schedule (Adapted for Consistency)
* **Monday (Strength):** 25 mins Focus workout (Push focus)
* **Tuesday (Active Recovery):** 15 mins mobility flow and light stretches
* **Wednesday:** Rest Day
* **Thursday (Strength):** 25 mins Lower Body focus (Squats & Core)
* **Friday (Stamina):** 20 mins HIIT/Cardio brisk walk
* **Saturday:** Rest Day
* **Sunday:** Circadian sleep reset.
    `;
    
    setActiveWorkoutPlan(message);
    localStorage.setItem(`fitdna_workout_${user.uid}`, message);
    
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
      // Prepare history format
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

  // AI suggestion chips
  const chatChips = [
    "How does consistency alter my DNA?",
    "Suggest a quick 15-minute workout",
    "How can I hit my protein goal today?",
    "Tips to sleep better tonight"
  ];

  // Calculate consistency scores using the AI engine logic
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
      // Nutrition met if logged calories is within 350 calories of baseline target (approx 2000)
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

  // Consistency Risk Alerts logic
  const riskAlert = useMemo(() => {
    if (Object.keys(logs).length < 3) return null;
    
    // Sort logs chronologically
    const sorted = Object.values(logs).sort((a, b) => a.timestamp - b.timestamp);
    const recent = sorted.slice(-4); // last 4 entries
    
    // 1. Detect multiple missed workouts (e.g. 2 consecutive missed workouts)
    if (recent.length >= 2 && !recent[recent.length - 1].workoutCompleted && !recent[recent.length - 2].workoutCompleted) {
      return {
        type: 'danger',
        message: "Consistency Alert: You've missed workouts for 2 consecutive days. High risk of losing momentum! Completing a short 15-minute workout today can reactivate your FTO metabolism genes.",
        scoreDrop: 15
      };
    }

    // 2. Detect falling sleep quality
    if (recent.length >= 3 && recent[recent.length - 1].sleep < 6.5 && recent[recent.length - 2].sleep < 6.5) {
      return {
        type: 'warning',
        message: "Recovery Alert: Sleep has dropped below 6.5 hours for 2 nights. Your CLOCK gene expression is falling, creating recovery debt. Prioritise a 15-min screen-free wind down tonight.",
        scoreDrop: 8
      };
    }

    // 3. Detect low hydration
    const waterTarget = profile ? Math.round((profile.weight || 70) * 0.033 * 10) / 10 : 2.5;
    if (recent.length >= 3 && recent[recent.length - 1].water < waterTarget * 0.7 && recent[recent.length - 2].water < waterTarget * 0.7) {
      return {
        type: 'info',
        message: `Hydration Risk: Water intake is under 70% of your ${waterTarget}L target. Low hydration limits joint lubrication and metabolic speed. Sip a glass of water now.`,
        scoreDrop: 10
      };
    }

    // 4. Declining overall consistency trend (last 3 days vs preceding 3 days)
    if (sorted.length >= 6) {
      const last3 = sorted.slice(-3);
      const prev3 = sorted.slice(-6, -3);
      
      const last3Score = last3.filter(l => l.workoutCompleted).length;
      const prev3Score = prev3.filter(l => l.workoutCompleted).length;

      if (last3Score < prev3Score) {
        const drop = Math.round(((prev3Score - last3Score) / 3) * 100);
        return {
          type: 'warning',
          message: `Your consistency score has dropped by ${drop}% this week. Completing one small fitness habit today will help regain full momentum.`,
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
      
      // Calculate daily consistency score
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

  // SVG Chart path calculation helpers
  const svgDimensions = { width: 500, height: 200, padding: 30 };
  const plotWidth = svgDimensions.width - svgDimensions.padding * 2;
  const plotHeight = svgDimensions.height - svgDimensions.padding * 2;

  // 1. Generate line path for Consistency over last 7 days
  const consistencyPath = useMemo(() => {
    if (chartVitals.length < 2) return '';
    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      const y = svgDimensions.height - svgDimensions.padding - (d.consistency / 100) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [chartVitals]);

  // 2. Generate line path for Water logs over last 7 days
  const waterPath = useMemo(() => {
    if (chartVitals.length < 2) return '';
    const maxWater = 4; // L
    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      const val = Math.min(maxWater, d.water);
      const y = svgDimensions.height - svgDimensions.padding - (val / maxWater) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [chartVitals]);

  // 3. Weight log points
  const weightTrendPath = useMemo(() => {
    if (chartVitals.length < 2 || !profile) return '';
    const startW = profile.weight || 78;
    const targetW = profile.targetWeight || 72;
    const maxDiff = Math.abs(startW - targetW) * 1.5 || 10;
    
    // Simulate weight dropping towards target
    const points = chartVitals.map((d, index) => {
      const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
      // Interpolate weight based on consistency (simulate losing weight if consistency is high)
      let currentEstimate = startW;
      for (let j = 0; j <= index; j++) {
        const day = chartVitals[j];
        if (day.consistency >= 75) {
          currentEstimate -= (startW > targetW ? 0.12 : -0.12);
        } else if (day.consistency < 25) {
          currentEstimate += (startW > targetW ? 0.05 : -0.05);
        }
      }
      // Constrain plotting bounds
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
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-100">
        <RotateCw className="w-10 h-10 text-cyan-500 animate-spin mb-3" />
        <p className="text-sm tracking-widest text-cyan-400 font-mono">CALIBRATING DNA PATHWAYS...</p>
      </div>
    );
  }

  // View Router State
  return (
    <div className="flex-grow flex flex-col relative bg-slate-950 text-slate-100 font-sans min-h-screen select-none bg-tech-grid">
      
      {/* Background Glow Blobs */}
      <div className="glow-blob w-[400px] h-[400px] bg-cyan-900/20 top-12 left-10" />
      <div className="glow-blob w-[350px] h-[350px] bg-violet-900/20 bottom-12 right-10" />

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
            animationDelay: `${Math.random() * 0.3}s`,
            animationDuration: `${Math.random() * 1.5 + 1.5}s`
          }}
        />
      ))}

      {/* --- AUTH SHIELD SCREEN --- */}
      {!user && (
        <div className="flex-grow flex items-center justify-center p-4 z-10 relative">
          <div className="glass-card p-8 rounded-2xl w-full max-w-md border border-slate-800 bg-slate-900/80 shadow-2xl">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-cyan-500/10 p-4 rounded-full border border-cyan-500/30 mb-3 shadow-inner">
                <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">Fit<span className="text-cyan-400">DNA</span></h1>
              <p className="text-slate-400 text-xs mt-1 font-mono tracking-wider">AI CONSISTENCY ENGINE MVP</p>
            </div>

            <div className="flex bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 mb-6">
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all font-mono ${authMode === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                SIGN UP
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all font-mono ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                LOGIN
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  required
                />
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold py-3 rounded-lg text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
              >
                {authLoading ? 'CONNECTING AGENT...' : authMode === 'signup' ? 'CREATE FITDNA SESSION' : 'INITIALISE FITNESS CORE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSESSMENT WIZARD SCREEN --- */}
      {user && !profile?.name && (
        <div className="flex-grow flex items-center justify-center p-4 z-10 relative">
          <div className="glass-card p-8 rounded-2xl w-full max-w-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
            
            {/* Steps Progress Indicator */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold font-mono text-white">ONBOARDING ASSESSMENT</h2>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-2 rounded-full transition-all ${onboardingStep >= step ? 'bg-cyan-400' : 'bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleAssessmentSubmit}>
              {/* Step 1: Personal Info */}
              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 font-mono mb-2">1. Personal Information</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</label>
                      <input
                        type="number"
                        value={wizardAge}
                        onChange={(e) => setWizardAge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={wizardHeight}
                        onChange={(e) => setWizardHeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={wizardWeight}
                        onChange={(e) => setWizardWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Biological Gender</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['male', 'female'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setWizardGender(g)}
                          className={`py-2.5 text-sm font-semibold rounded-lg font-mono border uppercase transition-all ${wizardGender === g ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'border-slate-800 text-slate-400 bg-slate-950'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Lifestyle */}
              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 font-mono mb-2">2. Lifestyle Calibration</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Daily Activity Level</label>
                    <div className="space-y-2">
                      {[
                        { id: 'sedentary', label: 'Sedentary (desk job, low weekly activity)' },
                        { id: 'moderate', label: 'Moderate (3-5 workouts/week, active day-to-day)' },
                        { id: 'high', label: 'High (daily training, strenuous job)' }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => setWizardActivity(act.id)}
                          className={`w-full py-3 px-4 text-left text-sm rounded-lg border transition-all ${wizardActivity === act.id ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'border-slate-800 text-slate-400 bg-slate-950'}`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Sleep (Hours/night)</label>
                      <input
                        type="number"
                        value={wizardSleep}
                        onChange={(e) => setWizardSleep(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Water Intake (Liters/day)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={wizardWater}
                        onChange={(e) => setWizardWater(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Goals */}
              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 font-mono mb-2">3. Targets & Fitness Goals</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Goals (Multiple selection)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'weight-loss', label: 'Weight Loss' },
                        { id: 'weight-gain', label: 'Weight Gain' },
                        { id: 'muscle-gain', label: 'Muscle Gain' },
                        { id: 'general-fitness', label: 'General Fitness' },
                        { id: 'improve-stamina', label: 'Improve Stamina' }
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
                            className={`py-2.5 px-4 text-sm font-semibold rounded-lg border transition-all text-left flex items-center justify-between ${isSelected ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'border-slate-800 text-slate-400 bg-slate-950'}`}
                          >
                            <span>{goal.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Weight (kg)</label>
                      <input
                        type="number"
                        value={wizardTargetWeight}
                        onChange={(e) => setWizardTargetWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Date</label>
                      <input
                        type="date"
                        value={wizardTargetDate}
                        onChange={(e) => setWizardTargetDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-250 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review Assessment */}
              {onboardingStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 font-mono mb-2">4. Core Calculations Preview</h3>
                  
                  {/* BMI preview */}
                  <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-slate-400 text-xs font-mono tracking-widest mb-1">YOUR CALCULATED BMI</p>
                    {(() => {
                      const { bmi, category } = calculateBMI(parseFloat(wizardWeight) || 70, parseFloat(wizardHeight) || 170);
                      return (
                        <>
                          <div className="text-4xl font-extrabold text-white tracking-tight">{bmi.toFixed(1)}</div>
                          <div className="text-cyan-400 text-sm font-semibold mt-1 uppercase font-mono">{category} Category</div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-slate-400 font-mono">Athlete:</span>
                      <span className="font-semibold text-white">{wizardName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-slate-400 font-mono">Age / Gender:</span>
                      <span className="font-semibold text-white capitalize">{wizardAge} y/o | {wizardGender}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-slate-400 font-mono">Physical Stature:</span>
                      <span className="font-semibold text-white">{wizardHeight}cm | {wizardWeight}kg</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                      <span className="text-slate-400 font-mono">Goal Weights:</span>
                      <span className="font-semibold text-cyan-400">{wizardWeight}kg → {wizardTargetWeight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-mono">Activity Tier:</span>
                      <span className="font-semibold text-white capitalize">{wizardActivity}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div className="flex justify-between mt-8 pt-4 border-t border-slate-800">
                {onboardingStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(prev => prev - 1)}
                    className="border border-slate-800 hover:border-slate-700 bg-slate-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-all"
                  >
                    BACK
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
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm tracking-wider uppercase transition-all shadow-md shadow-cyan-500/10 flex items-center gap-1"
                  >
                    <span>NEXT STEP</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-3 rounded-lg text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                  >
                    {authLoading ? 'COMPUTING GENETIC BLUEPRINTS...' : 'INITIALISE AI FITNESS blueprint'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CORE WORKSPACE APPLICATION --- */}
      {user && profile?.name && (
        <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 z-10 relative">
          
          {/* SIDE NAVIGATION PANEL */}
          <aside className="w-full md:w-64 flex flex-col gap-4">
            {/* User Profile Summary */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center font-bold font-mono text-slate-950 text-2xl shadow-lg border border-cyan-400/20 relative animate-float">
                {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                <div className="absolute -bottom-1 -right-1 bg-cyan-400 text-slate-950 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center font-mono">
                  {level}
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mt-3 leading-tight font-mono">{profile.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">LEVEL {level}</span>
                <span className="text-slate-700">•</span>
                <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-0.5">
                  <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                  {streaks.current} DAY STREAK
                </span>
              </div>

              {/* XP progress bar */}
              <div className="w-full mt-4 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{xp} XP</span>
                  <span>{level * 100} XP NEXT</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${(xp / (level * 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="mt-4 w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 text-[10px] font-bold font-mono text-slate-400 hover:text-white transition-all shadow-inner"
              >
                <span>THEME</span>
                <span className="flex items-center gap-1 font-bold text-cyan-400 uppercase">
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

            {/* Navigation Tabs */}
            <nav className="glass-card p-2 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1 shadow-lg">
              {[
                { id: 'dashboard', label: 'DASHBOARD', icon: Activity },
                { id: 'chat', label: 'AI COACH CHAT', icon: Brain },
                { id: 'adaptive', label: 'ADAPTIVE PLAN', icon: Compass },
                { id: 'report', label: 'AI COACH REPORT', icon: ShieldAlert },
                { id: 'profile', label: 'GENETIC PROFILE', icon: User }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono rounded-xl transition-all ${isActive ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* AI Key config Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="glass-card py-3.5 px-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-bold font-mono text-cyan-400 hover:text-cyan-300 hover:border-slate-700 shadow-md"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 shrink-0" />
                API CONFIG
              </span>
              <span className="text-[10px] text-slate-500 uppercase">
                {getGeminiApiKey() ? 'ACTIVE' : 'MOCK'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="glass-card py-3 px-4 rounded-2xl border border-slate-800 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center justify-center gap-2 text-xs font-bold font-mono transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>LOGOUT ACTIVE SESSION</span>
            </button>
          </aside>

          {/* MAIN DASHBOARD CONTENT AREA */}
          <main className="flex-grow flex flex-col gap-6">

            {/* CONSISTENCY RISK ALERTS BANNER */}
            {riskAlert && activeTab === 'dashboard' && (
              <div className={`border rounded-2xl p-4 flex gap-3 shadow-lg transition-all animate-float ${
                riskAlert.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                riskAlert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  riskAlert.type === 'danger' ? 'text-red-400' :
                  riskAlert.type === 'warning' ? 'text-amber-400' :
                  'text-cyan-400'
                }`} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest font-mono">Consistency Engine Risk Detection</h4>
                  <p className="text-sm font-sans leading-relaxed">{riskAlert.message}</p>
                </div>
              </div>
            )}

            {/* TAB VIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
                {/* 1. HEALTH SUMMARY CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* BMI */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">BMI Target</p>
                    <p className="text-xl font-bold mt-1 text-white font-mono">{profile.bmi?.toFixed(1) || '22.4'}</p>
                    <p className="text-[9px] text-cyan-400 font-mono mt-0.5 capitalize">{profile.bmiCategory || 'Normal'}</p>
                  </div>
                  {/* Current Weight */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Current Weight</p>
                    <p className="text-xl font-bold mt-1 text-white font-mono">{profile.weight || '70'} kg</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Updated recently</p>
                  </div>
                  {/* Target Weight */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Target Weight</p>
                    <p className="text-xl font-bold mt-1 text-white font-mono">{profile.targetWeight || '68'} kg</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Target reached dynamic</p>
                  </div>
                  {/* Days remaining */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Days Remaining</p>
                    <p className="text-xl font-bold mt-1 text-white font-mono">{daysRemaining}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Till {profile.targetDate ? new Date(profile.targetDate).toLocaleDateString() : 'target'}</p>
                  </div>
                  {/* Overall Consistency Score */}
                  <div className="glass-card p-4 rounded-xl border border-cyan-800 bg-cyan-950/10 col-span-2 md:col-span-1 shadow-md shadow-cyan-950/20">
                    <p className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase">Consistency Score</p>
                    <p className="text-xl font-black mt-1 text-cyan-300 font-mono text-glow-cyan">{overallConsistency}%</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {overallConsistency >= 80 ? 'Master tier expression' :
                       overallConsistency >= 50 ? 'Intermediate tier' :
                       'Struggling adherence'}
                    </p>
                  </div>
                </div>

                {/* 2. THE AI CONSISTENCY SCORE CIRCLES */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-3">
                    <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h3 className="text-sm font-bold font-mono text-white tracking-wider">AI CONSISTENCY ENGINE</h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 text-center">
                    
                    {/* Overall Ring */}
                    <div className="flex flex-col items-center justify-center col-span-2 lg:col-span-1 border-r border-slate-800/50 pr-0 lg:pr-6">
                      <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="46" strokeWidth="6" stroke="#0f172a" fill="transparent" />
                          <circle
                            cx="56" cy="56" r="46" strokeWidth="6"
                            stroke="url(#cyanGlow)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 46}
                            strokeDashoffset={2 * Math.PI * 46 * (1 - overallConsistency / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-white font-mono text-glow-cyan">{overallConsistency}%</span>
                          <span className="text-[8px] font-mono text-slate-400 tracking-widest uppercase mt-0.5">OVERALL</span>
                        </div>
                      </div>
                    </div>

                    {/* Workout Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="#0f172a" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="38" strokeWidth="5"
                            stroke="var(--neon-violet)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - consistencyStats.workout / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Dumbbell className="w-4 h-4 text-violet-400 mb-0.5" />
                          <span className="text-base font-bold text-white font-mono">{consistencyStats.workout}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">WORKOUT</span>
                    </div>

                    {/* Sleep Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="#0f172a" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="38" strokeWidth="5"
                            stroke="var(--neon-rose)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - consistencyStats.sleep / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Moon className="w-4 h-4 text-rose-400 mb-0.5" />
                          <span className="text-base font-bold text-white font-mono">{consistencyStats.sleep}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">SLEEP</span>
                    </div>

                    {/* Hydration Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="#0f172a" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="38" strokeWidth="5"
                            stroke="var(--neon-cyan)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - consistencyStats.water / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Droplets className="w-4 h-4 text-cyan-400 mb-0.5" />
                          <span className="text-base font-bold text-white font-mono">{consistencyStats.water}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">WATER</span>
                    </div>

                    {/* Nutrition Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="#0f172a" fill="transparent" />
                          <circle
                            cx="48" cy="48" r="38" strokeWidth="5"
                            stroke="var(--neon-green)"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - consistencyStats.nutrition / 100)}
                            className="transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <Flame className="w-4 h-4 text-emerald-400 mb-0.5" />
                          <span className="text-base font-bold text-white font-mono">{consistencyStats.nutrition}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider">NUTRITION</span>
                    </div>

                  </div>
                  
                  {/* Linear SVG Gradient Definition */}
                  <svg className="hidden">
                    <defs>
                      <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* 3. DAILY TRACKING LOGGERS & CHALLENGE BOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Daily Habit Logger Card */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
                      <Plus className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm font-bold font-mono text-white tracking-wider">LOG TODAY'S HABITS</h3>
                    </div>

                    <form onSubmit={handleLogHabit} className="space-y-4 flex-grow flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Sleep & Water inputs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Hours Slept</label>
                            <input
                              type="number"
                              step="0.5"
                              value={todaySleep}
                              onChange={(e) => setTodaySleep(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Water Consumed (L)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={todayWater}
                              onChange={(e) => setTodayWater(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                        </div>

                        {/* Workout Checkbox & Duration */}
                        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="workoutDone"
                              checked={todayWorkoutDone}
                              onChange={(e) => setTodayWorkoutDone(e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-800 focus:ring-0 focus:ring-offset-0"
                            />
                            <label htmlFor="workoutDone" className="text-sm text-slate-300 font-medium">Completed Workout Today</label>
                          </div>
                          {todayWorkoutDone && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                value={todayWorkoutDuration}
                                onChange={(e) => setTodayWorkoutDuration(e.target.value)}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-right focus:outline-none text-slate-200"
                                placeholder="Mins"
                                required
                              />
                              <span className="text-[10px] font-mono text-slate-400">MINS</span>
                            </div>
                          )}
                        </div>

                        {/* Calories, Protein & Meals count */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Meals Met</label>
                            <input
                              type="number"
                              value={todayMealsCount}
                              onChange={(e) => setTodayMealsCount(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Calories (kcal)</label>
                            <input
                              type="number"
                              value={todayCalories}
                              onChange={(e) => setTodayCalories(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Protein (g)</label>
                            <input
                              type="number"
                              value={todayProtein}
                              onChange={(e) => setTodayProtein(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98] mt-4"
                      >
                        LOG HABITS & SYNC GENES
                      </button>
                    </form>
                  </div>

                  {/* Quests / Gamification Board */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-bold font-mono text-white tracking-wider">DAILY QUEST BOARD</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">ACTIVE</span>
                    </div>

                    <div className="space-y-3 flex-grow flex flex-col justify-center">
                      {quests.map((quest) => (
                        <div
                          key={quest.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            quest.claimed ? 'bg-slate-950/40 border-slate-900 opacity-50' :
                            quest.completed ? 'bg-emerald-950/15 border-emerald-800/60 border-glow-green text-emerald-100' :
                            'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-full shrink-0 border ${
                              quest.claimed ? 'border-slate-800 bg-slate-900 text-slate-500' :
                              quest.completed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                              'border-slate-700 bg-slate-800 text-slate-400'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold leading-snug">{quest.text}</p>
                              <span className="text-[9px] font-mono text-cyan-400 font-semibold">+{quest.xpReward} XP REWARD</span>
                            </div>
                          </div>

                          {!quest.claimed && (
                            <button
                              disabled={!quest.completed}
                              onClick={(e) => handleClaimQuest(quest.id, e)}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold font-mono transition-all uppercase shrink-0 ${
                                quest.completed ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer shadow' :
                                'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              CLAIM
                            </button>
                          )}
                          {quest.claimed && (
                            <span className="text-[9px] font-bold font-mono text-slate-500 mr-2 uppercase tracking-wide">CLAIMED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* 4. PROGRESS CHARTS (LIVE DYNAMIC SVG PLOTS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Consistency & Water trend */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-bold font-mono text-white tracking-wider">WEEKLY TRENDS</h3>
                      </div>
                      <div className="flex gap-3 text-[9px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-cyan-400 rounded-sm" /> CONSISTENCY</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-violet-400 rounded-sm" /> WATER</span>
                      </div>
                    </div>

                    <div className="relative w-full h-[180px] bg-slate-950/60 border border-slate-900 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      {chartVitals.length < 2 ? (
                        <p className="text-xs text-slate-500 font-mono">Log your habits daily to visualize consistency trends.</p>
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
                                stroke="#1e293b"
                                strokeWidth="0.75"
                                strokeDasharray="4 4"
                              />
                            );
                          })}
                          
                          {/* Plot lines */}
                          <path d={consistencyPath} fill="none" stroke="var(--neon-cyan)" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                          <path d={waterPath} fill="none" stroke="var(--neon-violet)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

                          {/* Data points */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            const y = svgDimensions.height - svgDimensions.padding - (d.consistency / 100) * plotHeight;
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#030712"
                                stroke="var(--neon-cyan)"
                                strokeWidth="2.5"
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
                                y={svgDimensions.height - 10}
                                fill="#94a3b8"
                                fontSize="9"
                                textAnchor="middle"
                                fontFamily="monospace"
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
                  <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-400" />
                        <h3 className="text-sm font-bold font-mono text-white tracking-wider">WEIGHT TRACKER ESTIMATE</h3>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400">Target: {profile.targetWeight} kg</span>
                    </div>

                    <div className="relative w-full h-[180px] bg-slate-950/60 border border-slate-900 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                      {chartVitals.length < 2 ? (
                        <p className="text-xs text-slate-500 font-mono">Log stats to visualize weight trend updates.</p>
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
                                stroke="#1e293b"
                                strokeWidth="0.75"
                                strokeDasharray="4 4"
                              />
                            );
                          })}
                          
                          {/* Plot lines */}
                          <path d={weightTrendPath} fill="none" stroke="var(--neon-rose)" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />

                          {/* Data points */}
                          {chartVitals.map((d, index) => {
                            const x = svgDimensions.padding + (index / (chartVitals.length - 1)) * plotWidth;
                            // Interpolate estimate
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
                                  r="4"
                                  fill="#030712"
                                  stroke="var(--neon-rose)"
                                  strokeWidth="2.5"
                                />
                                <text
                                  x={x}
                                  y={y - 8}
                                  fill="#f43f5e"
                                  fontSize="8"
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
                                y={svgDimensions.height - 10}
                                fill="#94a3b8"
                                fontSize="9"
                                textAnchor="middle"
                                fontFamily="monospace"
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
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold font-mono text-white tracking-wider">GAMIFICATION ACHIEVEMENTS</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'hydrationHero', name: 'Hydration Hero', desc: 'Met water targets on 3+ days', icon: Droplets, color: 'text-cyan-400 border-cyan-800/40 bg-cyan-950/10' },
                      { id: 'sleepChampion', name: 'Sleep Champion', desc: 'Slept 8+ hours on 3+ days', icon: Moon, color: 'text-rose-400 border-rose-800/40 bg-rose-950/10' },
                      { id: 'fitnessStarter', name: 'Fitness Starter', desc: 'Completed your first workout', icon: Dumbbell, color: 'text-violet-400 border-violet-800/40 bg-violet-950/10' },
                      { id: 'consistencyMaster', name: 'Consistency Master', desc: 'Overall consistency score >= 80%', icon: Sparkles, color: 'text-amber-400 border-amber-800/40 bg-amber-950/10' }
                    ].map((badge) => {
                      const hasBadge = achievements[badge.id as keyof typeof achievements];
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                            hasBadge ? badge.color + ' border-glow-cyan scale-100 opacity-100 shadow' : 'border-slate-850 bg-slate-950/20 opacity-40 scale-95'
                          }`}
                        >
                          <div className={`p-2.5 rounded-full mb-2 ${hasBadge ? 'bg-slate-950/50' : 'bg-slate-900'}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight font-mono">{badge.name}</h4>
                          <p className="text-[9px] text-slate-400 mt-1 leading-snug">{badge.desc}</p>
                          <span className="text-[8px] font-mono font-bold mt-2 tracking-widest uppercase">
                            {hasBadge ? 'UNLOCKED' : 'LOCKED'}
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
              <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden flex flex-col h-[550px]">
                
                {/* Chat Panel Header */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-bold font-mono tracking-wider text-white">AI COACH AGENT ACTIVE</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">GEMINI 1.5 FLASH ENGINE</span>
                </div>

                {/* Messages scrollarea */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' ? 'bg-cyan-500 text-slate-950 rounded-tr-none font-medium' : 'bg-slate-950/90 border border-slate-850 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <div className="markdown-chat whitespace-pre-line text-xs md:text-sm">
                            {msg.text}
                          </div>
                        ) : (
                          <p className="font-sans text-xs md:text-sm">{msg.text}</p>
                        )}
                        <span className={`block text-[9px] mt-1.5 font-mono ${msg.sender === 'user' ? 'text-cyan-900' : 'text-slate-500 text-right'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950/90 border border-slate-850 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs font-mono text-cyan-400">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>COACH IS THINKING...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestion Chips */}
                <div className="p-2 bg-slate-950/30 border-t border-slate-850/60 overflow-x-auto whitespace-nowrap flex gap-2 shrink-0">
                  {chatChips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(chip)}
                      className="border border-slate-800 bg-slate-950 text-[10px] font-bold font-mono text-cyan-400 hover:border-slate-700 px-3 py-1.5 rounded-full transition-all shrink-0"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input form */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-850 shrink-0">
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
                      placeholder="Ask your Coach about workouts, metabolic pathways, or sleep targets..."
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-3 rounded-xl transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98] shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* TAB VIEW: ADAPTIVE PLANNING */}
            {activeTab === 'adaptive' && (
              <div className="space-y-6">
                
                {/* Introduction banner */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                    <h3 className="text-sm font-bold font-mono text-white tracking-wider">ADAPTIVE PLANNING SYSTEM</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Fitness consistency breaks because people set overly ambitious targets. 
                    If you miss your workout schedule repeatedly, our **Consistency Engine** automatically 
                    recalibrates your blueprint down to manageable, habit-forming sizes, ensuring you regain momentum instead of quitting.
                  </p>
                </div>

                {/* Split comparison plan */}
                {adaptivePlan ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Before Plan */}
                    <div className="glass-card p-6 rounded-2xl border border-red-900/30 bg-red-950/5 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-2 right-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold font-mono px-2 py-0.5 rounded">
                        WEEK 1 INITIAL TARGETS
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono uppercase mb-4 border-b border-red-900/20 pb-2">Ambitious Plan</h4>
                        <div className="space-y-3 font-sans text-sm text-slate-300">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-400">Weekly Workouts:</span>
                            <span className="font-bold text-white">{adaptivePlan.originalWorkouts} days</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-400">Duration per session:</span>
                            <span className="font-bold text-white">{adaptivePlan.originalDuration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total workout time:</span>
                            <span className="font-bold text-red-400">{adaptivePlan.originalWorkouts * adaptivePlan.originalDuration} mins / week</span>
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 mt-6 text-xs text-red-300 leading-relaxed font-sans">
                          <strong>Adherence Drop:</strong> {profile.name || 'Athlete'} completed only {Object.values(logs).filter(l => l.workoutCompleted).length} workouts in the last 7 days. Consistency rating is low.
                        </div>
                      </div>
                    </div>

                    {/* Adapted After Plan */}
                    <div className={`glass-card p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
                      adaptivePlan.isActive ? 'border-emerald-800/80 bg-emerald-950/5' : 'border-cyan-800/60 bg-cyan-950/5 border-glow-cyan'
                    }`}>
                      <div className={`absolute top-2 right-2 border text-[8px] font-bold font-mono px-2 py-0.5 rounded ${
                        adaptivePlan.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}>
                        {adaptivePlan.isActive ? 'ACTIVE PLAN' : 'RECOMMENDED ADAPTATION'}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono uppercase mb-4 border-b border-cyan-900/20 pb-2">Adaptive plan</h4>
                        <div className="space-y-3 font-sans text-sm text-slate-300">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-400">Weekly Workouts:</span>
                            <span className="font-bold text-white">{adaptivePlan.adaptedWorkouts} days</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5">
                            <span className="text-slate-400">Duration per session:</span>
                            <span className="font-bold text-white">{adaptivePlan.adaptedDuration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total workout time:</span>
                            <span className="font-bold text-cyan-400">{adaptivePlan.adaptedWorkouts * adaptivePlan.adaptedDuration} mins / week</span>
                          </div>
                        </div>
                        <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 mt-6 text-xs text-cyan-200 leading-relaxed font-sans">
                          <strong>AI Logic:</strong> {adaptivePlan.reason}
                        </div>
                      </div>

                      {!adaptivePlan.isActive && (
                        <button
                          onClick={handleApplyAdaptation}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md mt-6"
                        >
                          APPLY ADAPTED RECOMMENDATIONS
                        </button>
                      )}

                      {adaptivePlan.isActive && (
                        <div className="w-full text-center py-2.5 rounded-lg text-xs font-bold font-mono text-emerald-400 border border-emerald-800 bg-emerald-950/20 mt-6 uppercase">
                          PLAN SUCCESSFULLY APPLIED
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="glass-card p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center font-mono text-slate-500 text-sm">
                    Your workout adherence is currently high! Adaptive modifications will trigger if your consistency dips below 70%.
                  </div>
                )}

              </div>
            )}

            {/* TAB VIEW: AI WEEKLY REPORT */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                
                {/* Introduction and stats */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-mono text-white tracking-wider uppercase">Weekly AI Coach Report</h3>
                    <p className="text-xs text-slate-400">Analysis calculated on last 7 days of logs</p>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
                    CALIBRATED TODAY
                  </span>
                </div>

                {weeklyReport ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Wins column */}
                    <div className="glass-card p-6 rounded-2xl border border-emerald-900/30 bg-emerald-950/5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-emerald-900/20 pb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white font-mono uppercase">WEEKLY WINS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs md:text-sm text-slate-300 list-disc pl-4 leading-relaxed">
                        {weeklyReport.wins.map((w, idx) => (
                          <li key={idx} className="marker:text-emerald-400">{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weak areas column */}
                    <div className="glass-card p-6 rounded-2xl border border-red-900/30 bg-red-950/5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-red-900/20 pb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h4 className="text-sm font-bold text-white font-mono uppercase">WEAK AREAS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs md:text-sm text-slate-300 list-disc pl-4 leading-relaxed">
                        {weeklyReport.weakAreas.map((w, idx) => (
                          <li key={idx} className="marker:text-red-400">{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggestions column */}
                    <div className="glass-card p-6 rounded-2xl border border-cyan-900/30 bg-cyan-950/5 flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-cyan-900/20 pb-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white font-mono uppercase">SUGGESTIONS</h4>
                      </div>
                      <ul className="space-y-3 font-sans text-xs md:text-sm text-slate-300 list-disc pl-4 leading-relaxed">
                        {weeklyReport.suggestions.map((w, idx) => (
                          <li key={idx} className="marker:text-cyan-400">{w}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ) : (
                  <div className="glass-card p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center font-mono text-slate-500 text-sm">
                    Weekly feedback requires at least 4 tracked days in history. Log more habits to trigger.
                  </div>
                )}

              </div>
            )}

            {/* TAB VIEW: GENETIC PROFILE */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* DNA Helix simulator column (SVG loop) */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl col-span-1 lg:col-span-5 flex flex-col items-center justify-center min-h-[350px]">
                  <h3 className="text-sm font-bold font-mono text-white tracking-wider mb-4 text-center">EPIGENETIC PATHWAY SIMULATOR</h3>
                  
                  {/* Rotating DNA Helix */}
                  <div className="relative w-full max-w-[200px] aspect-square flex items-center justify-center bg-slate-950/60 border border-slate-900 rounded-full shadow-inner p-4">
                    <svg viewBox="0 0 100 200" className="w-full h-full overflow-visible">
                      {/* Vertical strands connector */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const spacing = 15;
                        const angle1 = dnaAngle + (i * 0.4);
                        const angle2 = angle1 + Math.PI;
                        
                        const x1 = 50 + 32 * Math.cos(angle1);
                        const x2 = 50 + 32 * Math.cos(angle2);
                        const y = 15 + (i * 15);

                        // Determine layer ordering (front node is larger and brighter)
                        const isNode1Front = Math.sin(angle1) > 0;
                        const opacity = isNode1Front ? '0.7' : '0.2';
                        
                        return (
                          <g key={i}>
                            {/* Horizontal connector bar */}
                            <line
                              x1={x1}
                              y1={y}
                              x2={x2}
                              y2={y}
                              stroke="var(--neon-violet)"
                              strokeWidth="1.5"
                              strokeOpacity={opacity}
                            />
                            
                            {/* DNA node 1 */}
                            <circle
                              cx={x1}
                              cy={y}
                              r={isNode1Front ? 4.5 : 2.5}
                              fill="var(--neon-cyan)"
                              className="dna-node"
                              style={{
                                fillOpacity: isNode1Front ? 1 : 0.4,
                                filter: isNode1Front ? 'drop-shadow(0 0 4px #06b6d4)' : 'none'
                              }}
                            />
                            
                            {/* DNA node 2 */}
                            <circle
                              cx={x2}
                              cy={y}
                              r={!isNode1Front ? 4.5 : 2.5}
                              fill="var(--neon-rose)"
                              className="dna-node"
                              style={{
                                fillOpacity: !isNode1Front ? 1 : 0.4,
                                filter: !isNode1Front ? 'drop-shadow(0 0 4px #f43f5e)' : 'none'
                              }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  
                  <div className="text-center mt-4 space-y-1">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Helix Rotation Speed</p>
                    <p className="text-xs font-bold text-cyan-400 font-mono">
                      {(0.015 + (overallConsistency / 100) * 0.05 * 100).toFixed(1)}x (Calibrated to Consistency)
                    </p>
                  </div>
                </div>

                {/* Epigenetic gene pathways information */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl col-span-1 lg:col-span-7 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-sm font-bold font-mono text-white tracking-wider">ACTIVE GENETIC PATHWAY CHECKS</h3>
                    </div>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
                      Genes load the gun, but habits pull the trigger. Our simulated epigenetic report tracks 
                      how your weekly habit consistency regulates critical metabolic, circadian, and lipid-clearance pathways.
                    </p>

                    <div className="space-y-4">
                      {/* FTO gene */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="font-bold text-white">FTO PATHWAY (Fat Burning & Energy Regulator)</span>
                          <span className={`${overallConsistency >= 70 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                            {overallConsistency >= 70 ? 'OPTIMIZED' : 'DOWNREGULATED'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                          <div
                            className={`h-full transition-all duration-1000 ${overallConsistency >= 70 ? 'bg-emerald-400' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, overallConsistency)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          Adherence dependent. High consistency increases energy metabolism, helping burn fat more efficiently.
                        </p>
                      </div>

                      {/* PPARG gene */}
                      <div className="space-y-1.5">
                        {(() => {
                          const workoutScore = consistencyStats.workout;
                          const nutritionScore = consistencyStats.nutrition;
                          const ppargScore = Math.round((workoutScore + nutritionScore) / 2);
                          const isOptimized = ppargScore >= 70;
                          return (
                            <>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-bold text-white">PPARG PATHWAY (Lipid Metabolism & Clearing)</span>
                                <span className={`${isOptimized ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                                  {isOptimized ? 'BALANCED' : 'IMPAIRED'}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div
                                  className={`h-full transition-all duration-1000 ${isOptimized ? 'bg-emerald-400' : 'bg-red-500'}`}
                                  style={{ width: `${ppargScore}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed">
                                Dependent on Workout & Nutrition scores. Regulates insulin sensitivity and clearance of circulating lipids.
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* CLOCK gene */}
                      <div className="space-y-1.5">
                        {(() => {
                          const sleepScore = consistencyStats.sleep;
                          const isOptimized = sleepScore >= 70;
                          return (
                            <>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-bold text-white">CLOCK GENE (Circadian Reset & Restoration)</span>
                                <span className={`${isOptimized ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                                  {isOptimized ? 'SYNCED' : 'DISRUPTED'}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                                <div
                                  className={`h-full transition-all duration-1000 ${isOptimized ? 'bg-emerald-400' : 'bg-red-500'}`}
                                  style={{ width: `${sleepScore}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 leading-relaxed">
                                Regulated by Sleep consistency. Synced sleep optimizes cell repairs, energy peaks, and hormone rhythms.
                              </p>
                            </>
                          );
                        })()}
                      </div>

                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block font-mono">Baseline Blueprint:</span>
                      <span className="text-white font-semibold capitalize font-sans">{profile.gender} | {profile.age} y/o</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">BMI Target category:</span>
                      <span className="text-cyan-400 font-semibold uppercase font-sans">{profile.bmiCategory}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* LIVE ACTIVE PLANS DISPLAY CARD (FOOTER AREA OF TABS) */}
            {activeWorkoutPlan && activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Workout blueprint */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2">
                    <Dumbbell className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold font-mono text-white tracking-widest uppercase">ACTIVE WORKOUT PLAN</h4>
                  </div>
                  <div className="markdown-display font-sans text-xs md:text-sm leading-relaxed text-slate-300 max-h-[200px] overflow-y-auto whitespace-pre-line">
                    {activeWorkoutPlan}
                  </div>
                </div>

                {/* Nutrition blueprint */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold font-mono text-white tracking-widest uppercase">ACTIVE NUTRITION RECOMMENDATIONS</h4>
                  </div>
                  <div className="markdown-display font-sans text-xs md:text-sm leading-relaxed text-slate-300 max-h-[200px] overflow-y-auto whitespace-pre-line">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Gemini API Key Configuration</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              By default, FitDNA Coach runs client-side offline using a custom local AI rule engine. 
              If you have a Google Gemini API key, input it below to generate live plans and chat answers from the real **Gemini 1.5 Flash** model. 
              Keys are only stored locally in your browser's memory and are never sent to external servers.
            </p>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Gemini API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={getGeminiApiKey() ? '••••••••••••••••••••••••' : 'Enter API key (AIzaSy...)'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="flex-1 border border-slate-800 hover:border-slate-700 bg-slate-950 text-xs font-bold font-mono py-2.5 rounded-lg text-slate-400"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono py-2.5 rounded-lg uppercase transition-all shadow-md"
              >
                SAVE KEY SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
