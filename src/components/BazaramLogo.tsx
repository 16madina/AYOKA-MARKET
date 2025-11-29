import bazaramNewLogo from "@/assets/bazaram-new-logo.png";

interface BazaramLogoProps {
  className?: string;
}

const BazaramLogo = ({ className = "" }: BazaramLogoProps) => {
  return (
    <img 
      src={bazaramNewLogo}
      alt="BAZARAM"
      className={className}
    />
  );
};

export default BazaramLogo;
