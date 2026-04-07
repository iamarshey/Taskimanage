const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get all tasks for the logged-in user
router.get('/', verifyToken, (req, res) => {
  db.all('SELECT * FROM tasks WHERE userId = ? ORDER BY id DESC', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(rows);
  });
});

// Create a task
router.post('/', verifyToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });

  db.run(`INSERT INTO tasks (title, description, userId) VALUES (?, ?, ?)`, 
    [title, description, req.userId], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error.' });
      
      const newTask = { id: this.lastID, title, description, status: 'pending', userId: req.userId };
      
      // Emit websocket event
      if (req.io) {
        req.io.emit('task_created', newTask);
      }
      
      res.status(201).json(newTask);
    });
});

// Update a task
router.put('/:id', verifyToken, (req, res) => {
  const taskId = req.params.id;
  const { title, description, status } = req.body;

  db.run(`UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status) WHERE id = ? AND userId = ?`, 
    [title, description, status, taskId, req.userId], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error.' });
      if (this.changes === 0) return res.status(404).json({ error: 'Task not found or not authorized.' });

      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
        if (!err && req.io) {
          req.io.emit('task_updated', row);
        }
        res.json(row);
      });
    });
});

// Delete a task
router.delete('/:id', verifyToken, (req, res) => {
  const taskId = req.params.id;

  db.run(`DELETE FROM tasks WHERE id = ? AND userId = ?`, [taskId, req.userId], function(err) {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found or not authorized.' });

    if (req.io) {
      req.io.emit('task_deleted', { id: taskId, userId: req.userId });
    }
    
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;
