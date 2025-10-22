import Navigation from "@/components/Navigation";

interface TodoProps {
  onLogout?: () => void;
}

const Todo = ({ onLogout }: TodoProps) => {
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation onLogout={onLogout} />
      <div className="p-6">
        <p className="text-lg text-gray-700">All your scheduled action will be listed here.</p>
      </div>
    </div>
  );
};

export default Todo;