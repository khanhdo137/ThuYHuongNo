import React from 'react';
import GradientBackground from './GradientBackground';

/**
 * Higher-Order Component (HOC) để wrap screen với GradientBackground
 * Sử dụng: export default withGradientBackground(YourScreen);
 */
export function withGradientBackground<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => (
    <GradientBackground>
      <Component {...props} />
    </GradientBackground>
  );
}

export default withGradientBackground;
