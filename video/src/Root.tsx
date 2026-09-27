import React from 'react';
import { Composition } from 'remotion';
import { Ad, BASE_FRAMES, SLOW } from './Ad';
import { Brand } from './Brand';

export const Root: React.FC = () => (
  <>
    <Composition id="Ad" component={Ad} durationInFrames={Math.ceil(BASE_FRAMES * SLOW)} fps={30} width={1920} height={1080} />
    <Composition id="Brand" component={Brand} durationInFrames={1} fps={30} width={2400} height={1240} />
  </>
);
