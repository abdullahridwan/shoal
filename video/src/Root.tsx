import React from 'react';
import { Composition } from 'remotion';
import { Ad } from './Ad';

export const Root: React.FC = () => (
  <Composition id="Ad" component={Ad} durationInFrames={930} fps={30} width={1920} height={1080} />
);
