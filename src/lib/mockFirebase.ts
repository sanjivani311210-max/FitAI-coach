// Mock Firebase Authentication and Firestore services for offline operations
// In a real project, replace this import with actual firebase/app, firebase/auth, and firebase/firestore

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  age?: number;
  gender?: string;
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: string;
  sleepHours?: number;
  waterIntake?: number;
  fitnessGoals?: string[];
  targetWeight?: number;
  targetDate?: string;
  bmi?: number;
  bmiCategory?: string;
  createdAt: string;
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  sleep: number; // hours
  water: number; // liters
  workoutCompleted: boolean;
  workoutDuration: number; // minutes
  mealsCompleted: number; // count out of 3 or 4
  caloriesConsumed: number; // kcal
  proteinConsumed: number; // grams
  timestamp: number;
}

export interface WeeklyReport {
  weekId: string;
  wins: string[];
  weakAreas: string[];
  suggestions: string[];
  generatedAt: string;
}

export interface AdaptivePlan {
  originalWorkouts: number;
  originalDuration: number;
  adaptedWorkouts: number;
  adaptedDuration: number;
  reason: string;
  isActive: boolean;
}

export interface UserState {
  profile: UserProfile | null;
  logs: Record<string, HabitLog>; // Key: YYYY-MM-DD
  xp: number;
  level: number;
  streaks: {
    current: number;
    best: number;
    lastActiveDate?: string;
  };
  achievements: {
    hydrationHero: boolean;
    sleepChampion: boolean;
    fitnessStarter: boolean;
    consistencyMaster: boolean;
  };
  adaptivePlan: AdaptivePlan | null;
  weeklyReport: WeeklyReport | null;
}

class MockAuth {
  private listeners: ((user: any) => void)[] = [];
  private currentUser: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('fitai_active_user') || localStorage.getItem('fitdna_active_user');
      if (activeUser) {
        this.currentUser = JSON.parse(activeUser);
      }
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    // Trigger immediately with current user
    setTimeout(() => callback(this.currentUser), 0);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private triggerChange() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<any> {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const users = JSON.parse(localStorage.getItem('fitai_users') || localStorage.getItem('fitdna_users') || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already in use.');
    }

    const newUser = {
      uid: 'uid_' + Math.random().toString(36).substring(2, 11),
      email,
    };

    users.push({ ...newUser, password });
    localStorage.setItem('fitai_users', JSON.stringify(users));

    // Create user default state
    const defaultState: UserState = {
      profile: {
        uid: newUser.uid,
        email: newUser.email,
        createdAt: new Date().toISOString()
      },
      logs: {},
      xp: 0,
      level: 1,
      streaks: { current: 0, best: 0 },
      achievements: {
        hydrationHero: false,
        sleepChampion: false,
        fitnessStarter: false,
        consistencyMaster: false
      },
      adaptivePlan: null,
      weeklyReport: null
    };
    
    localStorage.setItem(`fitai_state_${newUser.uid}`, JSON.stringify(defaultState));
    this.currentUser = newUser;
    localStorage.setItem('fitai_active_user', JSON.stringify(newUser));
    this.triggerChange();
    return { user: newUser };
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<any> {
    const users = JSON.parse(localStorage.getItem('fitai_users') || localStorage.getItem('fitdna_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const authUser = { uid: user.uid, email: user.email };
    this.currentUser = authUser;
    localStorage.setItem('fitai_active_user', JSON.stringify(authUser));
    this.triggerChange();
    return { user: authUser };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('fitai_active_user');
    localStorage.removeItem('fitdna_active_user');
    this.triggerChange();
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

class MockFirestore {
  // Simple document operations
  async getDoc(collectionName: string, docId: string): Promise<any> {
    if (collectionName === 'users') {
      const stateKey = `fitai_state_${docId}`;
      const fallbackKey = `fitdna_state_${docId}`;
      const stateStr = localStorage.getItem(stateKey) || localStorage.getItem(fallbackKey);
      if (stateStr) {
        return {
          exists: () => true,
          data: () => JSON.parse(stateStr)
        };
      }
    }
    return {
      exists: () => false,
      data: () => null
    };
  }

  async setDoc(collectionName: string, docId: string, data: any): Promise<void> {
    if (collectionName === 'users') {
      const stateKey = `fitai_state_${docId}`;
      localStorage.setItem(stateKey, JSON.stringify(data));
    }
  }

  async updateDoc(collectionName: string, docId: string, updateData: any): Promise<void> {
    if (collectionName === 'users') {
      const stateKey = `fitai_state_${docId}`;
      const fallbackKey = `fitdna_state_${docId}`;
      const existing = localStorage.getItem(stateKey) || localStorage.getItem(fallbackKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        const merged = { ...parsed, ...updateData };
        localStorage.setItem(stateKey, JSON.stringify(merged));
      }
    }
  }
}

export const auth = new MockAuth();
export const db = new MockFirestore();
