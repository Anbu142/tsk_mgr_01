import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Upload, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  profile_picture_url: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [generatingSubtasks, setGeneratingSubtasks] = useState<string | null>(null);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
      } else {
        setUserId(user.id);
        setLoading(false);
        loadTasks(user.id);
        loadProfile(user.id);
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
      if (data) {
        data.forEach((task) => loadSubtasks(task.id));
      }
    }
  };

  const loadSubtasks = async (taskId: string) => {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading subtasks:', error);
    } else {
      setSubtasks((prev) => ({ ...prev, [taskId]: data || [] }));
    }
  };

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
    } else if (data) {
      setProfile(data);
      setProfilePictureUrl(data.profile_picture_url);
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

  const handleGenerateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingSubtasks(taskId);
    setSuggestedSubtasks((prev) => ({ ...prev, [taskId]: [] }));

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate subtasks');
      }

      const data = await response.json();
      setSuggestedSubtasks((prev) => ({ ...prev, [taskId]: data.subtasks }));
      setExpandedTasks((prev) => new Set(prev).add(taskId));
    } catch (error) {
      console.error('Error generating subtasks:', error);
      alert('Failed to generate subtasks. Please try again.');
    } finally {
      setGeneratingSubtasks(null);
    }
  };

  const handleSaveSubtask = async (taskId: string, subtaskTitle: string) => {
    const { error } = await supabase
      .from('subtasks')
      .insert([{
        task_id: taskId,
        user_id: userId,
        title: subtaskTitle,
        completed: false,
      }]);

    if (error) {
      console.error('Error saving subtask:', error);
      alert('Failed to save subtask');
    } else {
      loadSubtasks(taskId);
      setSuggestedSubtasks((prev) => ({
        ...prev,
        [taskId]: prev[taskId]?.filter((s) => s !== subtaskTitle) || [],
      }));
    }
  };

  const handleToggleSubtask = async (subtaskId: string, taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ completed: !completed })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error updating subtask:', error);
    } else {
      loadSubtasks(taskId);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string, taskId: string) => {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
    } else {
      loadSubtasks(taskId);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      if (profile?.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('profile-pictures')
          .remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (dbError) {
        throw dbError;
      }

      setProfilePictureUrl(publicUrl);
      await loadProfile(userId);
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="bg-white/10 text-white font-medium py-[0.65rem] px-6 rounded-[10px] transition-all duration-300 hover:bg-white/20"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-[#1E2A5A] font-bold py-[0.65rem] px-6 rounded-[10px] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 md:px-10 py-14">
        <div className="mb-10 bg-white/10 backdrop-blur-[10px] border border-white/[0.18] rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border-2 border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center justify-center flex-shrink-0">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white/40" />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="text-white text-lg font-semibold mb-1">Profile Picture</h3>
              <p className="text-white/60 text-sm mb-3">Upload or update your profile picture</p>
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-300 cursor-pointer ${
                  uploading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/20'
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>
        </div>

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

                <div className="flex flex-wrap gap-3 mb-4">
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

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <button
                    onClick={() => handleGenerateSubtasks(task.id, task.title)}
                    disabled={generatingSubtasks === task.id}
                    className="bg-white/5 text-white/80 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingSubtasks === task.id ? 'Generating...' : 'Generate Subtasks with AI'}
                  </button>

                  {suggestedSubtasks[task.id] && suggestedSubtasks[task.id].length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                      <p className="text-white/70 text-sm font-medium mb-2">Suggested Subtasks:</p>
                      {suggestedSubtasks[task.id].map((suggestion, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
                          <span className="text-white/80 text-sm flex-grow">{suggestion}</span>
                          <button
                            onClick={() => handleSaveSubtask(task.id, suggestion)}
                            className="bg-white/10 text-white text-xs font-medium py-1 px-3 rounded transition-all duration-300 hover:bg-white/20"
                          >
                            Save
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subtasks[task.id] && subtasks[task.id].length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-white/70 text-sm font-medium">Subtasks ({subtasks[task.id].length}):</p>
                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="text-white/60 text-xs hover:text-white/90 transition-colors"
                        >
                          {expandedTasks.has(task.id) ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      {expandedTasks.has(task.id) && (
                        <div className="space-y-2">
                          {subtasks[task.id].map((subtask) => (
                            <div
                              key={subtask.id}
                              className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3 flex-grow">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => handleToggleSubtask(subtask.id, task.id, subtask.completed)}
                                  className="w-4 h-4 rounded cursor-pointer"
                                />
                                <span className={`text-sm ${subtask.completed ? 'text-white/50 line-through' : 'text-white/80'}`}>
                                  {subtask.title}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteSubtask(subtask.id, task.id)}
                                className="text-red-400/70 hover:text-red-400 transition-colors text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
