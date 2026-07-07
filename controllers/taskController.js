import pool from '../config/db.js';

export const createTask = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user; // Retrieved directly from our protect middleware

    const newTask = await pool.query(
      'INSERT INTO tasks (user_id, title, description, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description, category || 'shopping']
    );

    res.status(201).json(newTask.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const userId = req.user;
    const { status, category } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    let queryParams = [userId];
    let paramCounter = 2;

    // Dynamically append SQL filtering conditions if they are provided in the URL query string
    if (status) {
      query += ` AND status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }

    if (category) {
      query += ` AND category = $${paramCounter}`;
      queryParams.push(category);
      paramCounter++;
    }

    // Always sort by newest tasks first
    query += ' ORDER BY created_at DESC';
    const tasks = await pool.query(query, queryParams);
    res.json(tasks.rows);
  } catch (error) {
    next(error);
  }
};


export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);

    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Tracking task not found or unauthorized' });
    }

    res.json(task.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user;
    const { title, description, category, status } = req.body;

    // First ensure the task exists and belongs to this user
    const taskCheck = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Use current values as placeholders if no updates were supplied in the body
    const updatedTitle = title || taskCheck.rows[0].title;
    const updatedDesc = description || taskCheck.rows[0].description;
    const updatedCat = category || taskCheck.rows[0].category;
    const updatedStatus = status || taskCheck.rows[0].status;

    const updatedTask = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, category = $3, status = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [updatedTitle, updatedDesc, updatedCat, updatedStatus, id, userId]
    );

    res.json(updatedTask.rows[0]);
  } catch (error) {
    next(error);
  }
};


export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const deleteCheck = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);

    if (deleteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Order tracking task successfully removed' });
  } catch (error) {
    next(error);
  }
};