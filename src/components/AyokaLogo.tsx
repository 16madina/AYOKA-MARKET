import ayokaLogo from "@/assets/ayoka-logo.png";

interface AyokaLogoProps {
  className?: string;
}

const AyokaLogo = ({ className = "" }: AyokaLogoProps) => {
  return (
    <img 
      src={ayokaLogo}
      alt="AYOKA MARKET"
      className={className}
    />
  );
};

export default AyokaLogo;
