interface DjassaLogoProps {
  className?: string;
}

const DjassaLogo = ({ className = "" }: DjassaLogoProps) => {
  return (
    <svg 
      viewBox="0 0 400 80" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        {/* D */}
        <path d="M 10 10 L 10 70 L 35 70 Q 55 70 55 50 Q 55 30 35 30 Q 55 30 55 10 L 35 10 Z M 20 20 L 35 20 Q 45 20 45 30 Q 45 40 35 40 L 20 40 Z M 20 50 L 35 50 Q 45 50 45 60 Q 45 60 35 60 L 20 60 Z" />
        
        {/* J */}
        <path d="M 75 10 L 85 10 L 85 55 Q 85 70 70 70 L 65 70 L 65 60 L 70 60 Q 75 60 75 55 Z" />
        
        {/* A (triangle inversé) */}
        <path d="M 115 70 L 105 10 L 115 10 L 120 45 L 125 10 L 135 10 L 125 70 Z" 
              strokeWidth="0" />
        <path d="M 110 55 L 130 55 L 120 25 Z" 
              fill="hsl(var(--background))" 
              stroke="currentColor" 
              strokeWidth="2" />
        
        {/* S */}
        <path d="M 155 25 Q 155 10 170 10 L 180 10 Q 195 10 195 25 Q 195 35 180 40 L 170 40 Q 155 40 155 50 Q 155 60 170 60 L 180 60 Q 195 60 195 70 L 180 70 Q 155 70 155 55 Q 155 45 170 40 L 180 40 Q 195 40 195 30 Q 195 20 180 20 L 170 20 Q 155 20 155 25 Z" />
        
        {/* S */}
        <path d="M 215 25 Q 215 10 230 10 L 240 10 Q 255 10 255 25 Q 255 35 240 40 L 230 40 Q 215 40 215 50 Q 215 60 230 60 L 240 60 Q 255 60 255 70 L 240 70 Q 215 70 215 55 Q 215 45 230 40 L 240 40 Q 255 40 255 30 Q 255 20 240 20 L 230 20 Q 215 20 215 25 Z" />
        
        {/* A (triangle inversé) */}
        <path d="M 285 70 L 275 10 L 285 10 L 290 45 L 295 10 L 305 10 L 295 70 Z" 
              strokeWidth="0" />
        <path d="M 280 55 L 300 55 L 290 25 Z" 
              fill="hsl(var(--background))" 
              stroke="currentColor" 
              strokeWidth="2" />
      </g>
    </svg>
  );
};

export default DjassaLogo;
