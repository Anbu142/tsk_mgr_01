import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Dashboard() {
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [tasks] = useState([
    { id: 1, text: 'Finalize marketing strategy deck', completed: false },
    { id: 2, text: 'Review Q4 financial report', completed: false },
    { id: 3, text: 'Conduct performance reviews', completed: false },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E2A5A] to-[#1A2847] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleAddTask = () => {
    setNewTask('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E2A5A] to-[#1A2847]">
      <header className="h-[75px] bg-white/10 backdrop-blur-[10px] border-b border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.15)] sticky top-0 z-50">
        <div className="h-full max-w-6xl mx-auto px-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Task Manager</h1>
          <button
            onClick={handleLogout}
            className="bg-white text-[#1E2A5A] font-bold py-[0.65rem] px-6 rounded-[10px] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-[750px] mx-auto px-6 md:px-10 py-14">
        <h2 className="text-[2.2rem] font-bold text-white mb-8">Your Tasks</h2>

        <div className="mb-10">
          <div className="flex">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add New Task"
              className="flex-grow px-[0.85rem] py-[0.85rem] rounded-l-xl bg-white/[0.08] border border-white/15 text-white placeholder:text-white/70 focus:outline-none focus:border-white/30 transition-all duration-300"
            />
            <button
              onClick={handleAddTask}
              className="bg-white text-[#1E2A5A] font-bold py-[0.85rem] px-8 rounded-r-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-5 animate-fadeInUp">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="bg-white/10 backdrop-blur-[10px] border border-white/[0.18] rounded-[14px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-250 hover:bg-white/[0.13] hover:border-white/30 hover:scale-[1.02] cursor-pointer"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-[1.15rem] font-medium">
                  {task.text}
                </span>
                <CheckCircle2 className="w-6 h-6 text-white/60" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
