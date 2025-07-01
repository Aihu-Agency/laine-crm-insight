import React, { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

const Dashboard = ({ onLogout, onNavigate }: DashboardProps) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Follow up with John", completed: false },
    { id: 2, title: "Send proposal to Acme Corp", completed: true },
    { id: 3, title: "Schedule meeting with Jane", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onLogout={onLogout} onNavigate={onNavigate} />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="laine-card">
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
                </div>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="block hover:bg-gray-100 rounded-md p-2">Create New Customer</a>
                  </li>
                  <li>
                    <a href="#" className="block hover:bg-gray-100 rounded-md p-2">Add New Task</a>
                  </li>
                  <li>
                    <a href="#" className="block hover:bg-gray-100 rounded-md p-2">View Sales Report</a>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="laine-card">
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
                </div>
                <ul className="space-y-3">
                  <li>
                    <div className="flex items-center justify-between">
                      <span>Meeting with Acme Corp</span>
                      <span className="text-sm text-gray-500">Tomorrow, 10:00 AM</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center justify-between">
                      <span>Call with John Doe</span>
                      <span className="text-sm text-gray-500">Wednesday, 2:00 PM</span>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card className="laine-card">
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">To-Do List</h2>
                </div>
                <ul className="space-y-3">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-primary rounded"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span>{task.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
