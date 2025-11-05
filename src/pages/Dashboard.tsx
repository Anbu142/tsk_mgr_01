import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
      } else {
        setUserId(user.id);
        setLoading(false);
        loadTasks(user.id);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadTasks = async (uid: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title: newTask,
          priority: newPriority,
          status: 'pending',
        },
      ]);

    if (error) {
      console.error('Error adding task:', error);
    } else {
      setNewTask('');
      setNewPriority('medium');
      loadTasks(userId);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      loadTasks(userId);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      loadTasks(userId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-white/10 text-white/60 border-white/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'pending':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      default:
        return 'bg-white/10 text-white/60 border-white/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E2A5A] to-[#1A2847] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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

      <main className="max-w-[900px] mx-auto px-6 md:px-10 py-14">
        <h2 className="text-[2.2rem] font-bold text-white mb-8">Your Tasks</h2>

        <div className="mb-10 bg-white/10 backdrop-blur-[10px] border border-white/[0.18] rounded-[14px] p-6">
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add New Task"
              className="w-full px-[0.85rem] py-[0.85rem] rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder:text-white/70 focus:outline-none focus:border-white/30 transition-all duration-300"
            />
            <div className="flex gap-3">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-4 py-[0.85rem] rounded-xl bg-white/[0.08] border border-white/15 text-white focus:outline-none focus:border-white/30 transition-all duration-300"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                onClick={handleAddTask}
                className="flex-grow bg-white text-[#1E2A5A] font-bold py-[0.85rem] px-8 rounded-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {tasks.length === 0 ? (
            <div className="text-center text-white/60 py-12">
              No tasks yet. Add your first task above!
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className="bg-white/10 backdrop-blur-[10px] border border-white/[0.18] rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-250 hover:bg-white/[0.13] hover:border-white/30"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-white text-[1.15rem] font-medium flex-grow">
                    {task.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm font-medium">Priority:</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm font-medium">Status:</span>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as 'pending' | 'in-progress' | 'done')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(task.status)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30`}
                    >
                      <option value="pending">PENDING</option>
                      <option value="in-progress">IN-PROGRESS</option>
                      <option value="done">DONE</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
