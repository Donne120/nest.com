export interface VideoSection {
  icon: string; // SVG path d= string
  title: string;
  body: string;
}

export interface OnboardingVideoConfig {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  sections: [VideoSection, VideoSection, VideoSection, VideoSection];
  nextTitle: string;
}

export const ONBOARDING_VIDEOS: OnboardingVideoConfig[] = [
  {
    id: 1,
    tag: 'Module 01 · Introduction',
    title: 'Welcome to Nest',
    subtitle: 'The all-in-one onboarding platform. Learn what Nest is, who it\'s for, and how every feature fits together.',
    sections: [
      { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', title: 'What is Nest?', body: 'A complete platform for creating, delivering, and tracking employee onboarding — from video courses to AI Q&A.' },
      { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', title: 'Who is it for?', body: 'Educators who create content, Owners who manage the org, and Learners who go through onboarding — all in one workspace.' },
      { icon: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7', title: 'Core Features', body: 'Video courses, AI-powered Q&A, quizzes, assignments, progress tracking, 1-on-1 meetings, certificates, and analytics.' },
      { icon: 'M5 13l4 4L19 7', title: 'How it works', body: 'Create your org → Upload courses → Invite your team → Learners complete content → You track progress and issue certificates.' },
    ],
    nextTitle: 'Setting Up Your Organisation',
  },
  {
    id: 2,
    tag: 'Module 02 · Setup',
    title: 'Setting Up Your Organisation',
    subtitle: 'Step-by-step guide to creating and configuring your Nest workspace — from name and branding to plan selection.',
    sections: [
      { icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', title: 'Create Your Workspace', body: 'Register your organisation with a unique name and URL slug. This becomes the home for all your content and team members.' },
      { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Branding & Identity', body: 'Upload your logo, set your organisation colour, and add your MoMo payment details so learners know where to send payment.' },
      { icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM1 7v10M23 7v10', title: 'Plan Selection', body: 'Choose from Trial, Starter, Professional, or Enterprise. Each plan unlocks more features and learner capacity.' },
      { icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', title: 'Subscription Management', body: 'Track renewal dates, submit payment proof, and manage your subscription status — all from the Organisation Settings page.' },
    ],
    nextTitle: 'Managing Your Team',
  },
  {
    id: 3,
    tag: 'Module 03 · Team',
    title: 'Managing Your Team',
    subtitle: 'Everything about users inside Nest — inviting members, assigning roles, and controlling who has access to what.',
    sections: [
      { icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l8 8 8-8', title: 'Invite via Email', body: 'Send invite links directly from the Team page. Each invite is tied to a role and expires after 7 days for security.' },
      { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Assign Roles', body: 'Owner: full control. Educator: create and manage content. Learner: access and complete assigned modules.' },
      { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', title: 'Manage Departments', body: 'Group learners and educators by department or cohort. Makes it easy to assign content and track progress by team.' },
      { icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', title: 'Access Control', body: 'Deactivate accounts instantly without deleting data. Revoke access on offboarding while preserving audit history.' },
    ],
    nextTitle: 'Creating Courses & Videos',
  },
  {
    id: 4,
    tag: 'Module 04 · Content',
    title: 'Creating Courses & Videos',
    subtitle: 'How to build your onboarding content library — from creating modules to uploading videos and publishing to your team.',
    sections: [
      { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', title: 'Create a Module', body: 'A module is your course container. Add a title, description, and thumbnail. Set a price if it\'s paid content.' },
      { icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12', title: 'Upload Videos', body: 'Upload MP4 files directly to Supabase storage. Progress bar shows upload status. Videos are processed and ready instantly.' },
      { icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', title: 'Organise Content', body: 'Drag to reorder videos within a module. Set video titles and descriptions. Mark modules as draft or publish when ready.' },
      { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0', title: 'Publish & Share', body: 'Publishing makes the module visible to learners in your organisation. Unpublish anytime to hide without deleting.' },
    ],
    nextTitle: 'Transcription & AI Q&A',
  },
  {
    id: 5,
    tag: 'Module 05 · AI',
    title: 'Transcription & AI Q&A',
    subtitle: 'Nest\'s AI layer. Automatic transcription, timestamp questions, and a growing knowledge base for every new hire.',
    sections: [
      { icon: 'M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM19.14 5L21 3M5 21l1.86-1.86M21 21l-1.86-1.86M3 5l1.86 1.86', title: 'Auto Transcription', body: 'Every uploaded video is automatically transcribed using Groq AI. Transcripts are searchable and used to answer questions.' },
      { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z', title: 'Ask Questions', body: 'Learners can pause a video at any timestamp and ask a question. Questions are tied to that exact moment in the content.' },
      { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'AI Answers', body: 'The AI reads the video transcript around the timestamp and gives a context-aware answer — not a generic response.' },
      { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', title: 'Knowledge Base', body: 'Answered questions accumulate into a searchable knowledge base. Future hires benefit from every question ever asked.' },
    ],
    nextTitle: 'Quizzes & Assessments',
  },
  {
    id: 6,
    tag: 'Module 06 · Quizzes',
    title: 'Quizzes & Assessments',
    subtitle: 'Test learner understanding with built-in quizzes. Multiple question types, pass thresholds, and instant results.',
    sections: [
      { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Question Types', body: 'Multiple choice, true/false, and short-answer questions. Mix and match types to create thorough assessments.' },
      { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Create a Quiz', body: 'Attach a quiz to any video. Add as many questions as you need. Set correct answers and optional explanations.' },
      { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', title: 'Pass Thresholds', body: 'Set a minimum score percentage. Learners who don\'t pass are prompted to re-watch the video and try again.' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Review Results', body: 'Educators see every learner\'s score, attempt history, and time taken. Spot weak spots across your entire team.' },
    ],
    nextTitle: 'Assignments & Tasks',
  },
  {
    id: 7,
    tag: 'Module 07 · Assignments',
    title: 'Assignments & Tasks',
    subtitle: 'Go beyond passive watching. Create practical tasks for learners, review their work, and give structured feedback.',
    sections: [
      { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', title: 'Create Assignments', body: 'Write a task title, detailed instructions, and attach it to a module. Optionally link it to a specific video in the course.' },
      { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Set Due Dates', body: 'Add a deadline to keep learners on track. Overdue assignments are flagged in the dashboard for quick follow-up.' },
      { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', title: 'Review Submissions', body: 'Learners submit their work as text or file uploads. Educators review each submission directly in the platform.' },
      { icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', title: 'Give Feedback', body: 'Leave written feedback on each submission. Mark as approved or request revision. Learners are notified automatically.' },
    ],
    nextTitle: 'Progress Tracking',
  },
  {
    id: 8,
    tag: 'Module 08 · Progress',
    title: 'Progress Tracking',
    subtitle: 'How learners and admins track advancement through modules, videos, and overall onboarding completion.',
    sections: [
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Learner Progress', body: 'Each learner sees a personal dashboard with module completion %, video watch time, quiz scores, and assignment status.' },
      { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0', title: 'Completion States', body: 'Three states per module: Not Started, In Progress, and Completed. Progress auto-updates as videos are watched.' },
      { icon: 'M16 8v8m-4-5v5m-4-2v2M5 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2h-2', title: 'Admin Dashboard', body: 'Owners and educators see the whole team\'s progress in one view. Filter by module, learner, or completion state.' },
      { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Progress Reports', body: 'Export a full progress report for your organisation. Useful for compliance, HR records, and onboarding audits.' },
    ],
    nextTitle: '1-on-1 Meetings',
  },
  {
    id: 9,
    tag: 'Module 09 · Meetings',
    title: '1-on-1 Meetings',
    subtitle: 'The meeting feature in Nest — how learners request sessions, managers respond, and notifications flow automatically.',
    sections: [
      { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Request a Meeting', body: 'Learners browse available managers and request a 1-on-1 session. They add a topic and their preferred time window.' },
      { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0', title: 'Manager Response', body: 'Managers confirm or decline with an optional reason. Declined requests notify the learner with the stated reason.' },
      { icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', title: 'Add Meeting Link', body: 'Confirmed meetings get a video call link — Zoom, Google Meet, or any URL. Learners click the link from the meeting card.' },
      { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Email Notifications', body: 'Every status change triggers an email — request received, meeting confirmed, meeting declined, reminder 1 hour before.' },
    ],
    nextTitle: 'Analytics & Reporting',
  },
  {
    id: 10,
    tag: 'Module 10 · Analytics',
    title: 'Analytics & Reporting',
    subtitle: 'Reading your organisation\'s data — completion rates, per-learner views, quiz summaries, and actionable insights.',
    sections: [
      { icon: 'M16 8v8m-4-5v5m-4-2v2M5 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2h-2', title: 'Completion Rates', body: 'See what percentage of your team has completed each module. Spot which content is most and least engaging.' },
      { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', title: 'Per-Learner View', body: 'Drill into any individual\'s progress. See every video watched, quiz taken, assignment submitted, and meeting held.' },
      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Quiz Summaries', body: 'Average scores, pass rates, and question-level breakdown. Identify which questions your team consistently gets wrong.' },
      { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'Improvement Insights', body: 'Use analytics to iterate on your onboarding program — replace low-completion videos, clarify confusing quiz questions.' },
    ],
    nextTitle: 'Certificates',
  },
  {
    id: 11,
    tag: 'Module 11 · Certificates',
    title: 'Certificates',
    subtitle: 'How Nest issues completion certificates — triggering them, customising content, and where learners download them.',
    sections: [
      { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', title: 'Auto-Issue', body: 'Certificates are automatically generated when a learner completes all videos in a module. No manual action needed.' },
      { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Certificate Content', body: 'Each certificate shows the learner\'s name, module title, completion date, and organisation name with logo.' },
      { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', title: 'Customise', body: 'Educators can set a custom message, choose which modules issue certificates, and tailor the certificate to their brand.' },
      { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', title: 'Download & Share', body: 'Learners access all their certificates from their profile. One-click PDF download or share a verification link.' },
    ],
    nextTitle: 'Payments & Billing',
  },
  {
    id: 12,
    tag: 'Module 12 · Payments',
    title: 'Payments & Billing',
    subtitle: 'How learners pay for access, how educators collect revenue, and how admins manage the full payment flow.',
    sections: [
      { icon: 'M12 18h.01M8 21h8a2 2 0 002-2v-2H6v2a2 2 0 002 2zM20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z', title: 'Payment Methods', body: 'Nest supports MTN MoMo, Orange Money, and bank transfers. Educators add their payment details in Organisation Settings.' },
      { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Submit Proof', body: 'Learners send payment directly to the educator\'s number, then upload a screenshot of the confirmation as proof.' },
      { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', title: 'Admin Approval', body: 'Admins review all pending payment submissions with proof screenshots. One click to approve or reject with a reason.' },
      { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: 'Access Granted', body: 'On approval, learner access is unlocked automatically. For educator subscriptions, org plan status updates instantly.' },
    ],
    nextTitle: 'You\'re all set!',
  },
];
