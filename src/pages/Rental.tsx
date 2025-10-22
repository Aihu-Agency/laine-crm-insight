import Navigation from "@/components/Navigation";

interface RentalProps {
  onLogout?: () => void;
}

const Rental = ({ onLogout }: RentalProps) => {
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      <div className="p-6">
        <p className="text-lg text-gray-700">Work in progress</p>
      </div>
    </div>
  );
};

export default Rental;