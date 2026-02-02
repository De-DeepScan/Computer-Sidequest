import './AriaCat.css';

interface AriaCatProps {
  isEvil?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function AriaCat({ isEvil = false, className = '', size = 'medium' }: AriaCatProps) {
  const color = isEvil ? 'var(--color-danger)' : 'var(--color-primary)';

  const sizeClass = {
    small: 'aria-cat--small',
    medium: 'aria-cat--medium',
    large: 'aria-cat--large',
  }[size];

  // Good mode paths
  const goodHeadPath = "M 35 110 L 30 35 L 65 75 Q 100 55, 135 75 L 170 35 L 165 110 C 175 140, 145 175, 100 175 C 55 175, 25 140, 35 110 Z";
  const goodEyePath = "M 55 115 Q 65 100, 100 85 Q 135 100, 145 115 Q 135 130, 100 145 Q 65 130, 55 115 Z";
  const goodPupilY1 = 95;
  const goodPupilY2 = 135;

  // Evil mode paths (sharper ears, narrower eye)
  const evilHeadPath = "M 35 110 L 15 55 L 55 80 Q 100 60, 145 80 L 185 55 L 165 110 C 175 140, 145 175, 100 175 C 55 175, 25 140, 35 110 Z";
  const evilEyePath = "M 50 115 Q 65 105, 100 100 Q 135 105, 150 115 Q 135 125, 100 130 Q 65 125, 50 115 Z";
  const evilPupilY1 = 103;
  const evilPupilY2 = 127;

  const headPath = isEvil ? evilHeadPath : goodHeadPath;
  const eyePath = isEvil ? evilEyePath : goodEyePath;
  const pupilY1 = isEvil ? evilPupilY1 : goodPupilY1;
  const pupilY2 = isEvil ? evilPupilY2 : goodPupilY2;

  // Whisker positions
  const whiskerOffset = isEvil ? 10 : 0;

  return (
    <div className={`aria-cat-wrapper ${isEvil ? 'evil' : ''} ${sizeClass} ${className}`}>
      <svg
        viewBox="0 0 200 180"
        xmlns="http://www.w3.org/2000/svg"
        className="aria-cat-svg"
      >
        {/* Head */}
        <path
          d={headPath}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cat-line"
        />

        {/* Eye with animation */}
        <g className="eye-group">
          <path
            d={eyePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Animated pupil */}
          <line
            x1="100"
            y1={pupilY1}
            x2="100"
            y2={pupilY2}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            className="eye-pupil"
          />
        </g>

        {/* Closed eye line (visible only during blink) */}
        <line
          x1="55"
          y1="115"
          x2="145"
          y2="115"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          className="eye-closed-line"
        />

        {/* Left whiskers */}
        <line
          x1={isEvil ? -10 : 0}
          y1={100 - whiskerOffset}
          x2="45"
          y2="115"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-left-1"
        />
        <line
          x1={isEvil ? -15 : -5}
          y1="120"
          x2="45"
          y2={isEvil ? 120 : 125}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-left-2"
        />
        <line
          x1={isEvil ? -10 : 0}
          y1={140 + whiskerOffset}
          x2="45"
          y2="135"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-left-3"
        />

        {/* Right whiskers */}
        <line
          x1="155"
          y1="115"
          x2={isEvil ? 210 : 200}
          y2={100 - whiskerOffset}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-right-1"
        />
        <line
          x1="155"
          y1={isEvil ? 120 : 125}
          x2={isEvil ? 215 : 205}
          y2="120"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-right-2"
        />
        <line
          x1="155"
          y1="135"
          x2={isEvil ? 210 : 200}
          y2={140 + whiskerOffset}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="whisker whisker-right-3"
        />
      </svg>
    </div>
  );
}
