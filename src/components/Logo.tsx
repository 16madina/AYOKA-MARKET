import logoRevend from "@/assets/logo-revend.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className = "h-8 w-8", showText = true }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <img src={logoRevend} alt="ReVend Logo" className={className} />
      {showText && (
        <h1 className="text-2xl font-bold text-primary">ReVend</h1>
      )}
    </div>
  );
};

export default Logo;
