# InnoVision Advanced Features Guide

## Feature 4: Instructor Authoring Studio

### Overview
A complete WYSIWYG editor for instructors to create, edit, and publish courses with AI assistance.

### Access
Navigate to `/studio` to access the authoring studio.

### Features

#### 1. **WYSIWYG Editor**
- Rich text editing with markdown support
- Formatting toolbar (Bold, Italic, Headings, Code, Quotes)
- AI-powered content enhancement
- Real-time preview

#### 2. **Content Templates**
- **Standard Lesson**: Traditional lesson structure
- **Step-by-Step Tutorial**: Hands-on coding tutorials
- **Concept Explanation**: Deep dive into concepts
- **Video Lesson**: Video-based content with timestamps
- **Assessment/Quiz**: Quiz and test templates

#### 3. **Resource Manager**
- Add multiple resource types:
  - Web Links
  - Videos
  - Documents
  - Images
  - Downloadable Files
- Organize resources per chapter
- Easy resource management

#### 4. **Course Management**
- Create multiple chapters
- Save drafts
- Publish courses
- Edit existing content

### How to Use

1. **Create a Course**
   - Go to `/studio`
   - Enter course title and description
   - Click "Add Chapter"

2. **Edit Content**
   - Select a chapter from the sidebar
   - Use the Editor tab to write content
   - Apply formatting using the toolbar
   - Click "Enhance with AI" to improve content

3. **Use Templates**
   - Click the "Templates" tab
   - Choose a template that fits your needs
   - Template content will be loaded into the editor
   - Customize as needed

4. **Add Resources**
   - Click the "Resources" tab
   - Select resource type
   - Enter title and URL
   - Click "Add Resource"

5. **Save & Publish**
   - Click "Save Draft" to save your work
   - Click "Publish Course" when ready to go live

### API Endpoints

- `POST /api/studio/save` - Save course draft
- `POST /api/studio/publish` - Publish course
- `POST /api/studio/enhance` - AI content enhancement

---

## Feature 5: Advanced Gamification & Adaptive Rewards

### Overview
Comprehensive gamification system with XP, levels, badges, streaks, and leaderboards to boost engagement.

### Access
Navigate to `/gamification` to view your progress.

### Features

#### 1. **XP & Leveling System**
- Earn XP for completing activities
- Level up every 1000 XP
- Visual progress bars
- Level badges

#### 2. **Daily Streaks**
- Track consecutive days of learning
- Streak counter with fire icon
- Streak rewards
- Streak recovery system

#### 3. **Badge System**
Available badges:
- 🎯 **First Steps**: Complete first course
- 🔥 **Dedicated**: 7-day streak
- 💯 **Perfectionist**: 100% on quiz
- ⚡ **Speed Demon**: Complete course in 1 day
- 🦉 **Night Owl**: Study after midnight
- 🐦 **Early Bird**: Study before 6 AM
- 🦋 **Social Butterfly**: Help 10 students
- 👑 **Master**: Reach level 10

#### 4. **Leaderboards**
Three leaderboard types:
- **Daily**: Today's top performers
- **Weekly**: Last 7 days
- **All Time**: Overall rankings

#### 5. **Achievement System**
- Real-time achievement notifications
- Achievement history
- XP rewards for achievements

### XP Rewards

| Action | XP Earned |
|--------|-----------|
| Complete Chapter | 100 XP |
| Complete Course | 500 XP |
| Perfect Quiz Score | 200 XP |
| Daily Login | 50 XP |
| Help Another Student | 75 XP |

### How to Use

#### For Students

1. **View Your Progress**
   - Go to `/gamification`
   - See your level, XP, and streak
   - View earned badges
   - Check your rank

2. **Earn XP**
   - Complete chapters and courses
   - Take quizzes
   - Maintain daily streaks
   - Help other students

3. **Compete**
   - Check leaderboards
   - Compare with friends
   - Climb the rankings

#### For Developers

**Award XP programmatically:**

```javascript
const awardXP = async (userId, action) => {
  const res = await fetch("/api/gamification/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      action, // 'complete_chapter', 'complete_course', etc.
    })
  });
  
  const data = await res.json();
  
  if (data.newLevel) {
    // Show level up animation
  }
  
  if (data.newBadges.length > 0) {
    // Show badge unlock animation
  }
};
```

**Get user stats:**

```javascript
const stats = await fetch(`/api/gamification/stats?userId=${userId}`);
const data = await stats.json();
// { xp, level, streak, badges, rank, achievements }
```

### API Endpoints

- `GET /api/gamification/stats?userId=<id>` - Get user stats
- `POST /api/gamification/stats` - Award XP/achievements
- `GET /api/gamification/leaderboard` - Get leaderboards

### Integration with Existing Features

#### In Course Completion:
```javascript
// When user completes a chapter
await fetch("/api/gamification/stats", {
  method: "POST",
  body: JSON.stringify({
    userId: session.user.email,
    action: "complete_chapter"
  })
});
```

#### In Quiz Completion:
```javascript
// When user completes quiz
const action = score === 100 ? "perfect_quiz" : "complete_chapter";
await fetch("/api/gamification/stats", {
  method: "POST",
  body: JSON.stringify({
    userId: session.user.email,
    action
  })
});
```

---

## Feature 6: AI Flashcard Studio

### Overview
An interactive, spaced-repetition learning tool that uses AI (Gemini 2.5 Flash) to generate custom 3D flashcards for active recall and memory retention. Includes offline fallbacks and Text-to-Speech integration.

### Access
Navigate to `/features/flashcards` to access the flashcard studio.

### Features

#### 1. **AI Deck Generation**
- Input any topic to generate targeted cards.
- Select difficulty levels (Beginner, Intermediate, Advanced).
- Generate flashcards directly from enrolled courses.
- Intelligent offline fallback templates (Data Structures, JS, etc.).

#### 2. **Interactive 3D UI**
- CSS 3D card flipping mechanics.
- Tactile keyboard shortcuts (Space to flip, Arrows to score, H for hint).
- Text-to-Speech (TTS) integration for auditory learning.

#### 3. **Spaced Repetition & Gamification**
- "Study Again" vs "I Knew This" active recall tracking.
- Mastery percentage and progress bars.
- Streak tracking and session timers.
- Awards XP (e.g., +15 XP) upon deck mastery with celebratory confetti.

### API Endpoints
- `POST /api/flashcards/generate` - Generates flashcards using Gemini AI or fallback templates.

---

## Components Created

### Instructor Studio
- `src/app/studio/page.jsx` - Main studio page
- `src/components/studio/WYSIWYGEditor.jsx` - Content editor
- `src/components/studio/TemplateSelector.jsx` - Template chooser
- `src/components/studio/ResourceManager.jsx` - Resource management

### Gamification
- `src/app/gamification/page.jsx` - Gamification dashboard page
- `src/components/gamification/GamificationDashboard.jsx` - Stats display
- `src/components/gamification/Leaderboard.jsx` - Leaderboard component

### API Routes
- `src/app/api/studio/save/route.js` - Save drafts
- `src/app/api/studio/publish/route.js` - Publish courses
- `src/app/api/studio/enhance/route.js` - AI enhancement
- `src/app/api/gamification/stats/route.js` - User stats
- `src/app/api/gamification/leaderboard/route.js` - Leaderboards

---

## Firebase Collections

### New Collections Created

1. **studio_courses**
   - Stores draft and published courses from studio
   - Fields: title, description, chapters, status, createdBy, createdAt

2. **published_courses**
   - Stores published courses
   - Fields: Same as studio_courses + publishedAt

3. **gamification**
   - Stores user gamification data
   - Fields: xp, level, streak, badges, rank, achievements, lastActive

---

## Next Steps

### Recommended Enhancements

1. **Studio**
   - Add image upload functionality
   - Implement collaborative editing
   - Add version control
   - Create course preview mode

2. **Gamification**
   - Add friend system
   - Implement challenges
   - Create seasonal events
   - Add custom avatars
   - Implement reward shop

3. **Integration**
   - Connect studio courses to main course system
   - Add gamification to all learning activities
   - Create instructor dashboard
   - Add analytics for both features

---

## Testing

### Test Studio
1. Visit `/studio`
2. Create a new course
3. Add chapters
4. Try different templates
5. Add resources
6. Save draft
7. Publish course

### Test Gamification
1. Visit `/gamification`
2. Complete a course chapter
3. Check XP increase
4. View leaderboard
5. Check badge progress

---

## Troubleshooting

### Studio Issues
- **Can't save**: Check Firebase permissions
- **AI enhancement fails**: Verify GEMINI_API_KEY
- **Templates not loading**: Check component imports

### Gamification Issues
- **XP not updating**: Check API endpoint
- **Leaderboard empty**: Ensure users have gamification data
- **Badges not unlocking**: Check badge conditions in API

---

**Happy Teaching & Learning! 🎓**
