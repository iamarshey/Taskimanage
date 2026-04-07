import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/tasks';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fetch initial tasks
  useEffect(() => {
    // If not logged in, wait for redirect
    if (!user) return;
    
    fetchTasks();
    
    // Setup Socket.io
    const socket = io('http://localhost:3001');

    socket.on('task_created', (newTask) => {
      // Only add to our state if it belongs to us.
      // (For privacy, the backend should ideally send to specific rooms, 
      // but for learning we filter on the client side based on userId)
      if (newTask.userId === user.id) {
        setTasks((prev) => [newTask, ...prev]);
      }
    });

    socket.on('task_updated', (updatedTask) => {
      if (updatedTask.userId === user.id) {
        setTasks((prev) => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      }
    });

    socket.on('task_deleted', ({ id, userId }) => {
      if (userId === user.id) {
        setTasks((prev) => prev.filter(t => t.id != id));
      }
    });

    return () => socket.disconnect();
  }, [user?.id, token]); // Adding basic dependencies

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        if (res.status === 401) logout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });
      // Task addition is handled by socket
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      // Status update is handled by socket
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Deletion is handled by socket
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div style={{padding:'2rem',textAlign:'center'}}>Loading user...</div>;

  return (
    <div className="container animate-fade-in">
      <div className="header">
        <h1>taskimanage</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>Hi, {user.username}</span>
          <button onClick={logout} className="btn" style={{ padding: '0.5rem 1rem', width: 'auto' }}>Logout</button>
        </div>
      </div>

      <div className="task-grid">
        <div className="glass-panel task-form">
          <h3>Create New Task</h3>
          <form onSubmit={createTask}>
            <div className="input-group">
              <label>Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="What needs to be done?"
              />
            </div>
            <div className="input-group">
              <label>Description (optional)</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows="3"
              />
            </div>
            <button type="submit" className="btn">Add Task</button>
          </form>
        </div>

        <div className="task-list">
          <h3>Your Tasks ({tasks.length})</h3>
          {tasks.length === 0 && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tasks yet. Create one to get started!
            </div>
          )}
          {tasks.map(task => (
            <div key={task.id} className="glass-panel task-card">
              <div className="task-info">
                <h4 style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>
                  {task.title}
                </h4>
                {task.description && <p>{task.description}</p>}
                <span className={`task-status status-${task.status}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
              </div>
              <div className="task-actions">
                <button 
                  className="btn" 
                  style={{ background: task.status === 'completed' ? 'var(--surface-border)' : 'var(--success)' }}
                  onClick={() => toggleStatus(task)}
                >
                  {task.status === 'completed' ? 'Undo' : 'Done'}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
