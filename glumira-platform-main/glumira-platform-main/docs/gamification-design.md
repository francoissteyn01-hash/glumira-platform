# GluMira™ Gamification & Rewards System Design

## 1. Overview
The GluMira™ Gamification & Rewards system is designed to motivate users without gamifying their health in a trivial or distracting way. It centers around a dynamic profile mascot, a milestone badge system, and deeply empathetic messaging.

## 2. Core Data Models

### 2.1 Mascot Tiers
The mascot tier reflects the user's sustained positive use and health consistency.
- **Bronze Member**: Default tier for new users.
- **Silver Member**: Achieved after 7 days of consistent logging.
- **Gold Member**: Achieved after 30 days of consistent logging and maintained target range.
- **Platinum Member**: Achieved after 90 days of excellent control.
- **Crown Member**: Elite tier, adds a subtle visual crown or elite aura.

### 2.2 Badges
Badges are unlocked by reaching major milestones and can optionally replace the mascot.
- `id`: Unique identifier
- `name`: Display name of the badge
- `description`: How the badge was earned
- `iconUrl`: Visual representation
- `unlockedAt`: Timestamp of achievement

### 2.3 Reward Triggers
Events that trigger progression or badges:
- **App Engagement**: Daily logins, consistent meal/reading logging.
- **Health Maintenance**: Maintaining blood sugar within target range (7-day, 30-day streaks).
- **Health Improvement**: Formally logging a lowered/improved A1C result.

### 2.4 Milestones & Messaging
Triggers for special events with deeply empathetic messaging.
- **Happy Diaversary**: Anniversary of diagnosis.
- **Happy Birthday**: User's birthday.
- **Caregiver Encouragement**: For users flagged as caregivers, especially after erratic numbers.

## 3. TypeScript Interfaces

```typescript
export type MascotTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'crown';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: string;
}

export interface GamificationProfile {
  userId: string;
  currentTier: MascotTier;
  points: number;
  currentStreakDays: number;
  longestStreakDays: number;
  unlockedBadges: Badge[];
  activeBadgeId: string | null; // If set, replaces the mascot
  diaversaryDate: string | null;
  isCaregiver: boolean;
}

export type MilestoneType = 'diaversary' | 'birthday' | 'caregiver_burnout' | 'streak_7' | 'streak_30' | 'a1c_improved';

export interface MilestoneMessage {
  id: string;
  type: MilestoneType;
  title: string;
  body: string;
  triggerDate: string;
  isRead: boolean;
}
```

## 4. Animation Rules
- Higher-tier skins feature slight animations (gleam or pulse).
- **Strict Constraint**: All moving components MUST stop after exactly 3 loops to prevent distraction.

## 5. Tone Guidelines
- Inspiring, deeply empathetic, validating the specific struggle.
- ZERO toxic positivity or cheesiness.
- Example (Caregiver): "We see how hard you're working right now. The numbers have been tough, but your dedication is exactly what they need. Take a breath, you're doing a great job."
