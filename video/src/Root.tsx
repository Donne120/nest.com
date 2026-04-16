import React from 'react';
import { Composition, Still } from 'remotion';
import { TutorialThumbnail } from './tutorial/TutorialThumbnail';
import { NestPromo } from './NestPromo';
import { NestCourseIntro } from './NestCourseIntro';
import { Onboarding01 } from './onboarding/Onboarding01';
import { Onboarding02 } from './onboarding/Onboarding02';
import { Onboarding03 } from './onboarding/Onboarding03';
import { Onboarding04 } from './onboarding/Onboarding04';
import { Onboarding05 } from './onboarding/Onboarding05';
import { Onboarding06 } from './onboarding/Onboarding06';
import { Onboarding07 } from './onboarding/Onboarding07';
import { Onboarding08 } from './onboarding/Onboarding08';
import { Onboarding09 } from './onboarding/Onboarding09';
import { Onboarding10 } from './onboarding/Onboarding10';
import { Onboarding11 } from './onboarding/Onboarding11';
import { Onboarding12 } from './onboarding/Onboarding12';
import { T01_Welcome }      from './tutorial/videos/T01_Welcome';
import { T02_OrgSetup }     from './tutorial/videos/T02_OrgSetup';
import { T03_ManageTeam }   from './tutorial/videos/T03_ManageTeam';
import { T04_CreateCourse } from './tutorial/videos/T04_CreateCourse';
import { T05_Transcription } from './tutorial/videos/T05_Transcription';
import { T06_Quizzes }      from './tutorial/videos/T06_Quizzes';
import { T07_Assignments }  from './tutorial/videos/T07_Assignments';
import { T08_Progress }     from './tutorial/videos/T08_Progress';
import { T09_Meetings }     from './tutorial/videos/T09_Meetings';
import { T10_Analytics }    from './tutorial/videos/T10_Analytics';
import { T11_Certificates } from './tutorial/videos/T11_Certificates';
import { T12_Payments }     from './tutorial/videos/T12_Payments';

const ONBOARDING_TITLES = [
  'Welcome to Nest',
  'Setting Up Your Organisation',
  'Managing Your Team',
  'Creating Courses & Videos',
  'Transcription & AI Q&A',
  'Quizzes & Assessments',
  'Assignments & Tasks',
  'Progress Tracking',
  '1-on-1 Meetings',
  'Analytics & Reporting',
  'Certificates',
  'Payments & Billing',
];

const ONBOARDING_COMPONENTS = [
  Onboarding01, Onboarding02, Onboarding03, Onboarding04,
  Onboarding05, Onboarding06, Onboarding07, Onboarding08,
  Onboarding09, Onboarding10, Onboarding11, Onboarding12,
];

const TUTORIAL_COMPONENTS = [
  { id: 'T01', title: 'Welcome-to-Nest',              component: T01_Welcome },
  { id: 'T02', title: 'Setting-Up-Your-Organisation', component: T02_OrgSetup },
  { id: 'T03', title: 'Managing-Your-Team',            component: T03_ManageTeam },
  { id: 'T04', title: 'Creating-Courses-and-Videos',  component: T04_CreateCourse },
  { id: 'T05', title: 'Transcription-and-AI-QA',      component: T05_Transcription },
  { id: 'T06', title: 'Quizzes-and-Assessments',      component: T06_Quizzes },
  { id: 'T07', title: 'Assignments-and-Tasks',         component: T07_Assignments },
  { id: 'T08', title: 'Progress-Tracking',             component: T08_Progress },
  { id: 'T09', title: 'One-on-One-Meetings',           component: T09_Meetings },
  { id: 'T10', title: 'Analytics-and-Reporting',       component: T10_Analytics },
  { id: 'T11', title: 'Certificates',                  component: T11_Certificates },
  { id: 'T12', title: 'Payments-and-Billing',          component: T12_Payments },
];

export const Root: React.FC = () => (
  <>
    {/* Course pre-roll intro — 10 seconds, 1920×1080 */}
    <Composition
      id="NestCourseIntro"
      component={NestCourseIntro}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />

    {/* Promo video */}
    <Composition
      id="NestPromo"
      component={NestPromo}
      durationInFrames={900}
      fps={30}
      width={1280}
      height={720}
    />

    {/* Onboarding overview videos — 30s each */}
    {ONBOARDING_COMPONENTS.map((Component, i) => (
      <Composition
        key={i + 1}
        id={`Onboarding${String(i + 1).padStart(2, '0')}-${ONBOARDING_TITLES[i].replace(/[^a-zA-Z0-9]/g, '-')}`}
        component={Component}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
    ))}

    {/* Tutorial step-by-step videos — dynamic duration from steps */}
    {TUTORIAL_COMPONENTS.map(({ id, title, component: Component }) => (
      <Composition
        key={id}
        id={`Tutorial-${id}-${title}`}
        component={Component}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
    ))}

    {/* Tutorial thumbnails — 1280×720 PNG stills */}
    <Still id="Thumb-T01-Welcome"            component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 1,  title: 'Welcome to Nest',                steps: ['The Learner Dashboard', 'Navigating to My Courses', 'Opening a Course'],          icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T02-OrgSetup"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 2,  title: 'Setting Up Your Organisation',   steps: ['Go to Settings', 'Upload Your Logo', 'Save Your Settings'],                      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }} />
    <Still id="Thumb-T03-ManageTeam"         component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 3,  title: 'Managing Your Team',             steps: ['View Your Team', 'Invite a New Member', 'Change a Member\'s Role'],             icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }} />
    <Still id="Thumb-T04-CreateCourse"       component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 4,  title: 'Creating Courses & Videos',      steps: ['Create a New Course', 'Upload a Video', 'Set Video Details'],                   icon: 'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' }} />
    <Still id="Thumb-T05-Transcription"      component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 5,  title: 'Transcription & AI Q&A',         steps: ['View Auto-Generated Transcript', 'Ask the AI a Question'],                      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }} />
    <Still id="Thumb-T06-Quizzes"            component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 6,  title: 'Quizzes & Assessments',          steps: ['Add a Quiz to a Video', 'Taking a Quiz as a Learner'],                          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }} />
    <Still id="Thumb-T07-Assignments"        component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 7,  title: 'Assignments & Tasks',            steps: ['Create an Assignment', 'Submit an Assignment', 'Review & Grade Submissions'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }} />
    <Still id="Thumb-T08-Progress"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 8,  title: 'Progress Tracking',              steps: ['Your Progress Overview', 'Educator Progress View'],                              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T09-Meetings"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 9,  title: '1-on-1 Meetings',                steps: ['Schedule a Meeting', 'Join a Meeting'],                                          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }} />
    <Still id="Thumb-T10-Analytics"          component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 10, title: 'Analytics & Reporting',          steps: ['Organisation Analytics Overview', 'Course-Level Insights'],                    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T11-Certificates"       component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 11, title: 'Certificates',                   steps: ['Earn a Certificate', 'Download or Share Your Certificate'],                     icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }} />
    <Still id="Thumb-T12-Payments"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 12, title: 'Payments & Billing',             steps: ['Purchase Learner Access', 'Submit Payment Proof', 'Billing History'],          icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }} />
  </>
);
