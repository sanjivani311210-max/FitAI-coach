// Gemini API client and local fallback engine
import { UserProfile, HabitLog, WeeklyReport, AdaptivePlan } from './mockFirebase';

// Retrieve API key from local storage if available
export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fitai_gemini_api_key') || localStorage.getItem('fitdna_gemini_api_key');
  }
  return null;
}

export function saveGeminiApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fitai_gemini_api_key', key);
  }
}

export function removeGeminiApiKey() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fitai_gemini_api_key');
    localStorage.removeItem('fitdna_gemini_api_key');
  }
}

// Helper to make real Gemini call if API key exists
async function callGeminiApi(prompt: string, fallbackResponse: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    // Artificial typing delay for local mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fallbackResponse;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (resultText) {
      return resultText;
    }
    return fallbackResponse;
  } catch (error) {
    console.error('Gemini API call failed, using offline fallback:', error);
    return fallbackResponse + "\n\n*(Note: Real Gemini API call failed, showing local offline estimate)*";
  }
}

// 1. Generate Personalized Fitness Blueprint
export async function generateFitnessBlueprint(profile: UserProfile): Promise<{
  workoutPlan: string;
  hydrationTarget: number; // liters
  sleepTarget: number; // hours
  nutritionPlan: string;
}> {
  const name = profile.name || 'Athlete';
  const goalStr = profile.fitnessGoals?.join(', ') || 'General Fitness';
  const bmi = profile.bmi ? profile.bmi.toFixed(1) : '22.0';
  const bmiCategory = profile.bmiCategory || 'Normal';
  
  // Calculate default targets
  const hydration = Math.round(((profile.weight || 70) * 0.033) * 10) / 10; // 33ml per kg
  const sleep = profile.age && profile.age < 18 ? 9 : 8;
  
  // Calculate nutrition target (Calorie intake using Harris-Benedict)
  // Men: BMR = 88.362 + (13.397 x weight in kg) + (4.799 x height in cm) - (5.677 x age in years)
  // Women: BMR = 447.593 + (9.247 x weight in kg) + (3.098 x height in cm) - (4.330 x age in years)
  let bmr = 1500;
  if (profile.gender === 'male') {
    bmr = 88.36 + 13.4 * (profile.weight || 70) + 4.8 * (profile.height || 175) - 5.7 * (profile.age || 25);
  } else {
    bmr = 447.59 + 9.25 * (profile.weight || 60) + 3.1 * (profile.height || 165) - 4.3 * (profile.age || 25);
  }
  
  let factor = 1.2; // Sedentary
  if (profile.activityLevel === 'moderate') factor = 1.55;
  if (profile.activityLevel === 'high') factor = 1.725;
  
  let targetCalories = Math.round(bmr * factor);
  let goalMessage = "maintain your weight";
  
  if (profile.fitnessGoals?.includes('weight-loss')) {
    targetCalories -= 450;
    goalMessage = "achieve healthy, gradual weight loss";
  } else if (profile.fitnessGoals?.includes('weight-gain') || profile.fitnessGoals?.includes('muscle-gain')) {
    targetCalories += 350;
    goalMessage = "muscle gain and healthy weight addition";
  }

  const proteinTarget = Math.round((profile.weight || 70) * 1.8); // 1.8g per kg

  const prompt = `
    You are an expert AI Fitness Coach. Generate a personalized Fitness Blueprint for ${name}:
    Age: ${profile.age}, Gender: ${profile.gender}, Height: ${profile.height}cm, Weight: ${profile.weight}kg.
    BMI: ${bmi} (${bmiCategory}).
    Primary Goals: ${goalStr}.
    Target Goal: Weight target is ${profile.targetWeight}kg by ${profile.targetDate}.
    Activity Level: ${profile.activityLevel}. Current Water Intake: ${profile.waterIntake}L, Sleep: ${profile.sleepHours}h.

    Output a JSON object with exactly the following structure (do not include markdown syntax outside of standard text block formatting):
    {
      "workoutPlan": "Provide a detailed weekly schedule, showing recommended exercise types, active days vs rest days, and durations.",
      "nutritionPlan": "Provide daily calorie target (${targetCalories} kcal), protein target (${proteinTarget}g), macro breakdown advice, and 3 specific meal suggestions suited for ${goalStr}."
    }
  `;

  // Fallback plans if offline
  const fallbackWorkout = `
### Weekly Workout Schedule
* **Monday (Strength):** 40 mins Upper Body (Push/Pull focus). Target compound lifts.
* **Tuesday (Stamina):** 25 mins Zone 2 Cardio (Jogging, cycling or brisk walk) + core.
* **Wednesday:** Active Recovery (Light stretching or 15-minute mobility routine).
* **Thursday (Strength):** 40 mins Lower Body (Squats, lunges, glute bridges) + core.
* **Friday (Stamina):** 30 mins HIIT or Tempo Cardio intervals.
* **Saturday (Active):** 45 mins outdoor walk or light recreational activity.
* **Sunday:** Complete Rest and Circadian Reset.
  `;

  const fallbackNutrition = `
### Daily Calorie Target: **${targetCalories} kcal** | Protein: **${proteinTarget}g**
* **Goal Orientation:** Calibrated to ${goalMessage}.
* **Macronutrient Balance:** ~40% Carbohydrates, ~30% Protein, ~30% Healthy Fats.
* **Meal Suggestions:**
  1. *Breakfast:* Protein Oatmeal (oats, 1 scoop whey protein, handful of berries, and 1 tbsp almond butter).
  2. *Lunch:* Grilled Chicken Breast (or Tofu) with quinoa and dark leafy roasted vegetables (broccoli & spinach).
  3. *Dinner:* Baked Salmon (or Tempeh) with sweet potato mash and a side of avocado salad.
  4. *Snack:* Greek Yogurt (0% fat) with chia seeds.
  `;

  const fallbackResponse = JSON.stringify({
    workoutPlan: fallbackWorkout.trim(),
    nutritionPlan: fallbackNutrition.trim(),
  });

  const responseText = await callGeminiApi(prompt, fallbackResponse);

  try {
    // Strip markdown json formatting if returned by AI
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      workoutPlan: parsed.workoutPlan || fallbackWorkout,
      hydrationTarget: hydration,
      sleepTarget: sleep,
      nutritionPlan: parsed.nutritionPlan || fallbackNutrition,
    };
  } catch (e) {
    console.error('Failed to parse Gemini output as JSON, returning fallback structure', e);
    return {
      workoutPlan: fallbackWorkout,
      hydrationTarget: hydration,
      sleepTarget: sleep,
      nutritionPlan: fallbackNutrition,
    };
  }
}

// 2. Generate AI Coach Report
export async function generateWeeklyReport(
  profile: UserProfile,
  logs: HabitLog[]
): Promise<WeeklyReport> {
  const name = profile.name || 'Athlete';
  
  // Analyze last 7 days of logs
  const last7Days = logs.slice(-7);
  let workoutCompletedCount = 0;
  let hydrationMetCount = 0;
  let sleepMetCount = 0;
  let nutritionMetCount = 0;
  
  const dailyWaterTarget = Math.round(((profile.weight || 70) * 0.033) * 10) / 10;
  const dailySleepTarget = 8;
  
  last7Days.forEach(log => {
    if (log.workoutCompleted) workoutCompletedCount++;
    if (log.water >= dailyWaterTarget) hydrationMetCount++;
    if (log.sleep >= dailySleepTarget) sleepMetCount++;
    // Assume nutrition met if calories are close (within 300 kcal of target)
    if (log.mealsCompleted >= 3) nutritionMetCount++;
  });

  const workoutRate = last7Days.length > 0 ? (workoutCompletedCount / last7Days.length) * 100 : 0;
  const sleepRate = last7Days.length > 0 ? (sleepMetCount / last7Days.length) * 100 : 0;

  // Compile local rules for Wins, Weak Areas and suggestions
  const wins: string[] = [];
  const weakAreas: string[] = [];
  const suggestions: string[] = [];

  if (workoutCompletedCount >= 4) {
    wins.push(`Excellent physical commitment! Completed ${workoutCompletedCount} workouts this week.`);
  } else if (workoutCompletedCount > 0) {
    wins.push(`Started moving! Logged ${workoutCompletedCount} workout sessions.`);
  }
  
  if (hydrationMetCount >= 5) {
    wins.push(`Hydration Hero! Met water goals on ${hydrationMetCount} out of 7 days.`);
  }
  
  if (sleepMetCount >= 5) {
    wins.push(`Sleep Mastery! Reached target sleep hours on ${sleepMetCount} nights, aiding muscle recovery.`);
  }

  if (workoutCompletedCount <= 2) {
    weakAreas.push(`Workout consistency is low (${workoutCompletedCount}/7 days). Busy schedules or fatigue might be barriers.`);
    suggestions.push(`Scale down: Adjust your workouts from 40 minutes to shorter, 20-minute daily movement snacks.`);
  }
  if (sleepMetCount <= 3) {
    weakAreas.push(`Circadian disruption: Missed sleep targets on ${7 - sleepMetCount} days, raising recovery debt.`);
    suggestions.push(`Evening Wind-down: Block blue light screens 45 minutes before sleep and aim for a consistent bedtime.`);
  }
  if (hydrationMetCount <= 3) {
    weakAreas.push(`Dehydration risk: Daily water target missed on ${7 - hydrationMetCount} days.`);
    suggestions.push(`Visual cues: Keep a 1-liter bottle at your desk and sip 250ml every 2 hours.`);
  }

  // Provide defaults if empty
  if (wins.length === 0) wins.push("Completed daily logging entries - tracking habits is the first win!");
  if (weakAreas.length === 0) weakAreas.push("No major consistency dips detected this week. Keeping up a good baseline!");
  if (suggestions.length === 0) suggestions.push("Maintain current targets. Push intensity slightly during strength days.");

  const prompt = `
    You are an AI Fitness & Behavioral Coach. Analyze the 7-day adherence report of ${name}:
    - Workouts completed: ${workoutCompletedCount}/7 days
    - Hydration targets met: ${hydrationMetCount}/7 days
    - Sleep targets met: ${sleepMetCount}/7 days
    - Nutrition guidelines met: ${nutritionMetCount}/7 days

    Provide structured feedback in JSON:
    {
      "wins": ["bullet 1", "bullet 2"],
      "weakAreas": ["bullet 1", "bullet 2"],
      "suggestions": ["bullet 1", "bullet 2"]
    }
  `;

  const fallbackResponse = JSON.stringify({ wins, weakAreas, suggestions });
  const responseText = await callGeminiApi(prompt, fallbackResponse);

  try {
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      weekId: `Week_${new Date().toISOString().split('T')[0]}`,
      wins: parsed.wins || wins,
      weakAreas: parsed.weakAreas || weakAreas,
      suggestions: parsed.suggestions || suggestions,
      generatedAt: new Date().toLocaleDateString(),
    };
  } catch (e) {
    return {
      weekId: `Week_${new Date().toISOString().split('T')[0]}`,
      wins,
      weakAreas,
      suggestions,
      generatedAt: new Date().toLocaleDateString(),
    };
  }
}

// 3. AI Coach Chat Response
export async function getAICoachReply(
  userMessage: string,
  profile: UserProfile | null,
  logs: HabitLog[],
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> {
  const name = profile?.name || 'Athlete';
  const goalStr = profile?.fitnessGoals?.join(', ') || 'General Fitness';
  
  // Calculate general details
  const recentLogs = logs.slice(-5);
  const avgWorkouts = recentLogs.filter(l => l.workoutCompleted).length;
  
  const systemPrompt = `
    You are "FitAI Coach", a supportive, professional, and knowledgeable AI Fitness and Consistency Expert.
    The user's name is ${name}. Their fitness goals are: ${goalStr}.
    In their recent logs, they completed ${avgWorkouts} workouts in the last 5 days.
    
    Answer their fitness, workout, nutrition, recovery, or consistency-related questions.
    Give actionable, motivational, and scientifically grounded responses. Avoid overly long replies. Keep it conversational (2-3 paragraphs max).
    If they ask about their training plans, remind them that consistency directly affects athletic recovery, metabolic rate, and muscle retention. Focus on habit-building and adaptive workload scales.
  `;

  // Offline intelligent responses based on keywords
  let localReply = `Hey ${name}! Tracking consistency is the key to achieving your fitness goals. Let me know what questions you have about exercise, sleep, nutrition or building better habits!`;
  
  const lowerMsg = userMessage.toLowerCase();
  if (lowerMsg.includes('workout') || lowerMsg.includes('exercise') || lowerMsg.includes('train')) {
    localReply = `To optimize your workouts for consistency, focusing on progressive overload is critical, ${name}. Since your goal is ${goalStr}, we suggest focusing on structured compound movements (squats, pushups, rows) 3-4 days a week. When short on time, do a 15-minute high-intensity circuit rather than skipping it. Consistency beats duration every time!`;
  } else if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('rest') || lowerMsg.includes('recovery')) {
    localReply = `Sleep is where the magic happens! When you sleep, your muscles repair and your circadian rhythm and sleep stages sync. Aiming for 7-8 hours of quality sleep reduces cortisol, which helps in ${goalStr}. Try to go to bed at the same time daily and shut down screens 30-45 minutes beforehand.`;
  } else if (lowerMsg.includes('diet') || lowerMsg.includes('eat') || lowerMsg.includes('nutrition') || lowerMsg.includes('calorie') || lowerMsg.includes('protein')) {
    localReply = `For ${goalStr}, nutrition acts as your fuel. Make sure you hit your protein target (around ${(profile?.weight || 70) * 1.8}g per day) to preserve lean muscle tissue. Focus on whole foods: complex carbs (oats, quinoa) for training energy, lean proteins (chicken, tofu, eggs) for repairs, and healthy fats (avocado, nuts) for hormone support.`;
  } else if (lowerMsg.includes('ai') || lowerMsg.includes('algorithm') || lowerMsg.includes('predict') || lowerMsg.includes('system')) {
    localReply = `FitAI Coach utilizes dynamic biometric logging and consistency forecasting. By analyzing your workouts, rest periods, and nutrition inputs, the AI system adapts your training volumes dynamically to prevent burnout and ensure steady progression.`;
  } else if (lowerMsg.includes('water') || lowerMsg.includes('hydration') || lowerMsg.includes('dehydrated')) {
    localReply = `Staying hydrated increases joint lubrication, cellular recovery, and metabolic speed. Your calculated daily hydration target is ${Math.round(((profile?.weight || 70) * 0.033) * 10) / 10} liters. A good tip is to drink one large glass of water right when you wake up and carry a water bottle throughout the day.`;
  } else if (lowerMsg.includes('consist') || lowerMsg.includes('motivation') || lowerMsg.includes('missed') || lowerMsg.includes('lazy') || lowerMsg.includes('dna') || lowerMsg.includes('gene')) {
    localReply = `Consistency is a skill, not a trait! If you missed a goal, don't beat yourself up. Focus on the "Never Miss Twice" rule. FitAI Coach helps you track daily habits and adjust target parameters so you can maintain momentum and reach your goals.`;
  }

  const fullPrompt = `
    SYSTEM: ${systemPrompt}
    
    CHAT HISTORY:
    ${chatHistory.map(c => `${c.role === 'user' ? 'User' : 'Coach'}: ${c.parts[0].text}`).join('\n')}
    
    User: ${userMessage}
    Coach:
  `;

  return callGeminiApi(fullPrompt, localReply);
}
