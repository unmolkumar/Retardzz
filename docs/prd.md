# Product Requirements Document (PRD)
## Smart Student Study Manager

**Version:** 1.0  
**Status:** Draft  
**Prepared for:** Hackathon Presentation  

---

## 1. Overview

### 1.1 What Is This Product?

Smart Student Study Manager is an all-in-one collaborative study platform built for students. It combines real-time collaboration, focused study tools, and an AI-powered personal tutor into a single seamless experience.

Students today are scattered across multiple tools — they use one app for video calls, another for notes, another for flashcards, and yet another for quizzes. There is no single place where a group of students can come together, study in a focused environment, collaborate visually, test each other's knowledge, and get help from an AI tutor — all without switching tabs or losing context.

This product solves exactly that.

### 1.2 The Problem We Are Solving

- Students lack a dedicated, distraction-free space to study together online
- Existing tools are either too social (like Discord) or too isolated (like Notion)
- There is no unified platform that combines real-time collaboration with AI-assisted learning
- Group study sessions are unorganized — there is no accountability, no structure, and no way to measure progress
- AI tutoring tools exist but they do not retain context, do not know the student's study history, and cannot collaborate with peers

### 1.3 Who Is This For?

- **Primary users:** Students (high school, undergraduate, postgraduate)
- **Secondary users:** Study groups, tutoring circles, competitive exam aspirants
- **Tertiary users:** Teachers or mentors who want to create guided study rooms for their students

---

## 2. Goals and Success Metrics

### 2.1 Product Goals

- Make group studying as easy and productive as being in the same room
- Give every student access to a personal AI tutor that actually remembers them
- Replace 4–5 fragmented tools with one cohesive platform
- Make studying measurably more engaging through gamification and accountability

### 2.2 What Success Looks Like

- Students spend more time in focused study sessions compared to studying alone
- Students return to the platform daily (habit formation via streaks and goals)
- Students report improved understanding of subjects through the AI tutor
- Study groups successfully use the whiteboard and polling tools during sessions

---

## 3. Core Features

The product is divided into three major modules:

---

### Module 1: Study Rooms

This is the heart of the product. A Study Room is a private, invite-only space where a group of students can come together to study. Think of it like a virtual study hall.

#### 3.1 Room Creation and Management

- Any logged-in user can create a Study Room
- The creator becomes the Room Host with admin controls
- Rooms can be named (e.g., "JEE Physics Revision" or "CS Finals Group")
- The host can invite others via a shareable invite link or by searching usernames
- Rooms can be set as public (anyone can join) or private (invite only)
- The host can remove participants, mute members, or transfer host privileges

#### 3.2 Focus Room (Inside the Study Room)

The Focus Room is the core study environment within a room. It is designed to eliminate distractions and keep everyone on task.

**Voice Chat**
- Members can talk to each other in real time, just like being in a study hall together
- Users can mute/unmute themselves
- There is a push-to-talk option for quieter environments

**Study Timer**
- A shared Pomodoro-style timer visible to all room members
- The host can start, pause, or reset the timer
- Configurable work and break intervals (e.g., 25 minutes study, 5 minutes break)
- A notification or sound plays when a session ends

**Idle User Detection**
- If a user has been inactive for a set period, the system gently nudges them
- Idle users are visually marked in the participant list so the group stays accountable
- Optional: host can send a "wake up" ping to idle members

**Screen Sharing**
- Any room member can share their screen with the group
- Useful for walking others through a problem or solution

**Emoji Reactions**
- Quick one-tap reactions (thumbs up, confused face, need a break, etc.) so members can express themselves without interrupting the session

**Focus Leaderboard**
- Tracks how many focused minutes each room member has accumulated in the session
- Encourages healthy competition and accountability within the group

---

#### 3.3 Collaborative Whiteboard (Inside the Study Room)

A shared visual canvas where all room members can draw, write, and diagram together in real time.

**Drawing Tools**
- Freehand drawing (pen tool)
- Shapes: rectangles, circles, triangles, arrows, lines
- Text tool for adding labels or notes
- Eraser tool
- Color picker and stroke size options

**Real-Time Collaboration**
- All changes made by any member appear instantly on everyone's screen
- Each user's cursor is visible and labeled with their name
- No lag, no refresh needed — it just works

**Undo / Redo**
- Every user can undo and redo their own actions
- Actions do not conflict with other users' drawings

**Sticky Notes**
- Members can drop virtual sticky notes anywhere on the canvas
- Great for brainstorming, labeling diagrams, or leaving comments

**Export**
- The completed whiteboard can be exported as an image (PNG) or PDF
- Useful for saving notes after a session

---

#### 3.4 Polling System (Inside the Study Room)

A quick and fun way to test knowledge, take votes, or quiz the group.

**Create a Poll**
- Any room member can create a poll question with multiple choice options
- The host can restrict poll creation to themselves only if needed

**Live Results**
- As members vote, results update in real time as a live bar chart
- Everyone sees the results together, making it interactive

**Anonymous Voting**
- An option to hide individual votes so members feel comfortable answering honestly

**Quiz Mode**
- The host can run a timed quiz where each question has a correct answer
- Members are scored based on accuracy and speed
- A post-quiz leaderboard shows rankings

**Poll History**
- Past polls and quiz results are saved in the room's history
- Members can review them after the session

---

### Module 2: AI Tutor

A personal AI-powered study assistant available to every user outside (and optionally inside) the study room. Unlike generic AI chatbots, this tutor knows the student, remembers past conversations, and grows with them over time.

#### 3.5 AI Chat Interface

- A clean, conversational chat interface similar to messaging an expert tutor
- Students can ask any academic question across any subject
- Supports text, equations, and uploaded documents or images as input

#### 3.6 Context Memory

- The AI remembers previous conversations with the student
- It knows what topics the student has studied, struggled with, or mastered
- This allows it to give progressively better and more relevant responses over time
- Example: If a student asked about Newton's laws last week, the AI will connect new physics questions to that prior context

#### 3.7 What the AI Tutor Can Do

**Answer Subject Questions**
- Any subject: Math, Physics, Chemistry, Biology, History, Literature, Computer Science, Economics, and more
- Explains concepts clearly, step by step, at the student's level

**Create a Personalized Study Plan**
- Based on the student's goals, available time, and weak areas, the AI generates a structured study schedule
- The plan is adjustable and updates as the student progresses

**Generate Flashcards**
- The AI can turn any topic, chapter, or uploaded notes into a set of revision flashcards
- Students can review flashcards in the app

**Generate Quizzes from Notes**
- Upload a PDF, paste text, or describe a topic, and the AI generates a multiple-choice or short-answer quiz
- Instant self-testing without any manual effort

**Summarize Documents**
- Students can upload PDFs, textbook pages, or lecture notes
- The AI produces a clear, concise summary with key points highlighted

**Explain Formulas and Concepts**
- Not just the formula, but the intuition behind it
- Includes examples, analogies, and visual descriptions where helpful

**Progress Tracking and Suggestions**
- The AI monitors what the student has been studying and identifies knowledge gaps
- It proactively suggests topics to review based on study patterns

---

### Module 3: Profile and Progress

Every student has a personal profile that tracks their study journey and keeps them motivated.

#### 3.8 User Profile

- Customizable display name and avatar
- Shows the student's subjects of interest and current study goals
- Visible to friends and room members

#### 3.9 Study Streaks and Badges

- Daily study streaks are tracked (similar to Duolingo)
- Earning badges for milestones: first session, 7-day streak, 100 focused minutes, first quiz completed, etc.
- Badges are displayed on the user's profile

#### 3.10 Weekly Analytics

- A visual summary of the student's study activity for the week
- Shows: total focused minutes, rooms joined, quizzes taken, AI sessions started
- Helps students reflect on their habits and stay consistent

#### 3.11 Goal Setting and Reminders

- Students can set personal study goals (e.g., "Study 2 hours a day", "Complete 3 chapters this week")
- The app sends gentle reminders via notifications
- Progress toward goals is shown on the dashboard

#### 3.12 Leaderboard

- A global leaderboard showing top studiers by focused minutes
- A friends-only leaderboard for a more personal competitive experience
- Resets weekly so everyone has a fresh chance

#### 3.13 Notification Center

- Notifications for room invites, session reminders, quiz results, and AI tutor responses
- Fully manageable — students can choose what to be notified about

---

## 4. User Flow Summary

```
User Opens App
    |
    v
Google Login
    |
    v
Main Dashboard
    |
    +---------> Study Room Hub
    |                |
    |                +--> Create Room / Join via Invite
    |                         |
    |                         v
    |                    Room Page
    |                         |
    |           +-------------+-------------+
    |           |             |             |
    |           v             v             v
    |       Focus Room    Whiteboard    Polling
    |
    +---------> AI Tutor
    |                |
    |                +--> Ask a question
    |                +--> Get a study plan
    |                +--> Generate flashcards / quiz
    |                +--> Upload and summarize notes
    |
    +---------> Profile & Progress
                     |
                     +--> View streaks, badges, analytics
                     +--> Set goals, check leaderboard
```

---

## 5. What This Product Is NOT

To stay focused, the following are explicitly out of scope:

- This is **not a social media platform** — there are no public feeds, posts, or follower systems
- This is **not a video conferencing tool** — we offer voice only, not full video calls
- This is **not a Learning Management System (LMS)** — teachers cannot assign grades or manage a curriculum
- This is **not a note-taking app** — while the whiteboard and AI summaries exist, we are not replacing Notion or Google Docs
- This is **not a messaging app** — there is no private DM system between users

---

## 6. MVP (Minimum Viable Product)

The MVP focuses on delivering the core value of the product with the minimum features needed to make it genuinely useful.

### 6.1 MVP Scope

| Feature | Included in MVP |
|---|---|
| Google Login | Yes |
| Create and Join Study Rooms | Yes |
| Voice Chat in Focus Room | Yes |
| Shared Pomodoro Timer | Yes |
| Idle User Detection | Yes |
| Real-Time Collaborative Whiteboard | Yes |
| Undo / Redo on Whiteboard | Yes |
| Basic Polling (MCQ, live results) | Yes |
| AI Chat with Context Memory | Yes |
| Subject Q&A via AI | Yes |
| AI Flashcard Generator | Yes |
| User Profile (name, avatar) | Yes |
| Study Streaks | Yes |
| Screen Sharing | No — Post-MVP |
| Quiz Mode with Scoring | No — Post-MVP |
| PDF / Doc Summarizer via AI | No — Post-MVP |
| Weekly Analytics Dashboard | No — Post-MVP |
| Global Leaderboard | No — Post-MVP |
| Goal Setting and Reminders | No — Post-MVP |
| Export Whiteboard as PNG/PDF | No — Post-MVP |
| Anonymous Voting in Polls | No — Post-MVP |

### 6.2 Why This MVP?

The MVP contains the features that directly address the core problem: students need a place to study together with structure and AI support. Voice chat, the timer, the whiteboard, basic polling, and the AI tutor together form a complete and compelling experience on their own.

---

## 7. Future Expansion (Post-MVP Roadmap)

### Phase 2 — Enhanced Collaboration
- Screen sharing inside Focus Room
- Whiteboard export (PNG and PDF)
- Anonymous voting in polls
- Quiz mode with scoring and post-quiz leaderboard
- Room recording (audio + whiteboard playback)

### Phase 3 — Deeper AI Integration
- AI tutor inside the study room (shared AI assistant for the group)
- PDF and document summarization
- AI-generated personalized study plans
- Progress tracking and gap analysis by the AI
- Formula and concept explainer with visual diagrams

### Phase 4 — Gamification and Retention
- Weekly and global leaderboards
- Goal setting with push notification reminders
- Achievement badges and milestone rewards
- Weekly analytics dashboard
- Friends system and friend-only leaderboards

### Phase 5 — Platform Expansion
- Mobile app (iOS and Android)
- Teacher/mentor accounts with room moderation tools
- Scheduled study sessions with calendar integration
- Subject-specific room templates (e.g., Math room with built-in formula sheet)
- Public rooms where students can drop in and study with strangers

---

## 8. Assumptions and Constraints

- All users must have a Google account to sign in
- Rooms require a stable internet connection for real-time features to work properly
- The AI tutor requires an active session and is not available offline
- MVP is designed for a small group size per room (suggested: up to 10 members per room)
- The product is designed for web browsers first; mobile is a future phase

---

## 9. Personal Timetable Planner

Every student has a different schedule. The Personal Timetable Planner is a dedicated section on the dashboard where students can build, manage, and follow their weekly study schedule — all in one place, without needing a separate calendar app.

### 9.1 What It Is

A visual weekly timetable that the student fills in with their subjects, free slots, and study blocks. It acts as the student's personal study calendar, visible only to them, and it connects with the rest of the platform to make scheduling smarter over time.

### 9.2 Creating a Timetable

- Students can create a weekly timetable by adding time blocks across any day of the week
- Each block has a subject or activity name (e.g., "Physics", "Math Revision", "Break", "AI Tutor Session")
- Blocks can be color-coded by subject for easy visual scanning
- Students can set recurring blocks (e.g., every Monday at 6 PM — Chemistry)
- The timetable view can be toggled between daily view and full weekly view

### 9.3 Timetable Features

**Drag and Drop Scheduling**
- Students can drag time blocks around to reschedule without having to delete and recreate them

**Study Goals Integration**
- When a student sets a study goal (e.g., "2 hours of Math this week"), the timetable highlights whether they have enough scheduled time to meet it
- If they are under-scheduled for a goal, the app gently nudges them to add more blocks

**AI-Suggested Schedule**
- The AI Tutor can analyze the student's goals, weak subjects, and available free time, and suggest an optimized weekly timetable
- The student can accept, modify, or reject the suggestion
- Example: "You have an exam in 5 days. I suggest dedicating 90 minutes daily to Organic Chemistry and 30 minutes to revision."

**Session Reminders**
- Students can enable reminders for any timetable block
- A notification fires 5–10 minutes before the block is scheduled to begin
- Reminder says something like: "Your Physics session starts in 10 minutes. Ready to focus?"

**Missed Session Tracking**
- If a scheduled block passes without the student opening the app or joining a room, it is marked as missed
- Missed sessions are shown in the weekly summary so the student can reflect and reschedule

**Timetable Sharing (Optional)**
- Students can choose to share their timetable with friends or room members
- This makes it easy to find common free slots and schedule group study sessions together
- Sharing is always opt-in — the timetable is private by default

**Sync with Study Rooms**
- When a student is invited to a Study Room session at a specific time, it automatically appears as a block on their timetable
- They can accept or decline directly from the timetable view

### 9.4 What the Timetable Is NOT

- It is not a full calendar app — there are no external event imports, no Google Calendar sync in MVP
- It is not a task manager or to-do list — it is strictly a time-block scheduler for study
- It does not enforce the schedule — it guides and reminds, but the student is always in control

### 9.5 MVP vs Future for Timetable

| Feature | MVP |
|---|---|
| Create and edit weekly time blocks | Yes |
| Color-code blocks by subject | Yes |
| Session reminders / notifications | Yes |
| Missed session tracking | Yes |
| AI-suggested schedule | No — Post-MVP |
| Timetable sharing with friends | No — Post-MVP |
| Sync with Study Room invites | No — Post-MVP |
| Drag and drop rescheduling | No — Post-MVP |

---

## 10. Open Questions

- Should users be able to study alone (solo mode) or is the product always group-first?
- Should there be a room chat (text messages) alongside voice, or is voice sufficient for MVP?
- How long should AI context memory persist — per session, per week, or indefinitely?
- Should the leaderboard be opt-in or opt-out?
- What happens to a room when the host disconnects — does it end or does it continue?

---

*This document represents the intended product vision as of the current hackathon phase. Features and priorities may evolve based on user feedback and development capacity.*
