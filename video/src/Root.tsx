import React from 'react';
import { Composition } from 'remotion';
import { NestPromo } from './NestPromo';

export const Root: React.FC = () => (
  <Composition
    id="NestPromo"
    component={NestPromo}
    durationInFrames={900}
    fps={30}
    width={1280}
    height={720}
  />
);
