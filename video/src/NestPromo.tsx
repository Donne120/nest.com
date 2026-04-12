import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Scene1Logo }     from './scenes/Scene1Logo';
import { Scene2Educator } from './scenes/Scene2Educator';
import { Scene3Invite }   from './scenes/Scene3Invite';
import { Scene4AI }       from './scenes/Scene4AI';
import { Scene5CTA }      from './scenes/Scene5CTA';

// 900 frames @ 30fps = 30 seconds
// Scenes overlap by 20 frames for smooth cross-fades
export const NestPromo: React.FC = () => (
  <AbsoluteFill style={{ background: '#0a0907', fontFamily: 'Georgia, serif' }}>
    {/* Voiceover */}
    <Audio src={staticFile('voiceover.mp3')} startFrom={0} />

    {/* Persistent noise grain */}
    <AbsoluteFill style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      opacity: 0.04,
      pointerEvents: 'none',
      zIndex: 999,
    }} />

    {/* Scene 1: Logo intro — frames 0-160 */}
    <Sequence from={0} durationInFrames={160}>
      <Scene1Logo />
    </Sequence>

    {/* Scene 2: Educator uploads — frames 140-340 */}
    <Sequence from={140} durationInFrames={200}>
      <Scene2Educator />
    </Sequence>

    {/* Scene 3: Student joins via invite — frames 320-570 */}
    <Sequence from={320} durationInFrames={250}>
      <Scene3Invite />
    </Sequence>

    {/* Scene 4: AI Q&A — frames 550-770 */}
    <Sequence from={550} durationInFrames={220}>
      <Scene4AI />
    </Sequence>

    {/* Scene 5: CTA — frames 750-900 */}
    <Sequence from={750} durationInFrames={150}>
      <Scene5CTA />
    </Sequence>
  </AbsoluteFill>
);
