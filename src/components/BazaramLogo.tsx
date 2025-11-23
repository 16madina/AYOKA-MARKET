interface BazaramLogoProps {
  className?: string;
}

const BazaramLogo = ({ className = "" }: BazaramLogoProps) => {
  return (
    <svg 
      viewBox="0 0 600 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`
            .brown-letter { fill: #8B4513; }
            .black-letter { fill: #000000; }
            .logo-text { 
              font-family: 'Arial Black', sans-serif; 
              font-weight: 900;
              font-size: 100px;
            }
          `}
        </style>
      </defs>
      
      {/* B - marron */}
      <text x="0" y="90" className="logo-text brown-letter">B</text>
      
      {/* A - noir */}
      <text x="75" y="90" className="logo-text black-letter">A</text>
      
      {/* Z - marron */}
      <text x="150" y="90" className="logo-text brown-letter">Z</text>
      
      {/* A - noir */}
      <text x="225" y="90" className="logo-text black-letter">A</text>
      
      {/* R - marron */}
      <text x="300" y="90" className="logo-text brown-letter">R</text>
      
      {/* A - noir */}
      <text x="375" y="90" className="logo-text black-letter">A</text>
      
      {/* M - marron */}
      <text x="450" y="90" className="logo-text brown-letter">M</text>
    </svg>
  );
};

export default BazaramLogo;
