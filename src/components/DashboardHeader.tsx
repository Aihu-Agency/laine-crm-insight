
import Navigation from "./Navigation";

interface DashboardHeaderProps {
  onLogout?: () => void;
}

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
    </div>
  );
};

export default DashboardHeader;
