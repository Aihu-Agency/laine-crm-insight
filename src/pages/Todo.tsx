import Navigation from "@/components/Navigation";

const Todo = () => {
  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      <div className="p-6">
        <p className="text-lg text-gray-700">All your scheduled action will be listed here.</p>
      </div>
    </div>
  );
};

export default Todo;