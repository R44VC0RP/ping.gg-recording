import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, validateUser, getUsers, saveUsers } from '../models/users.js';
import { JWT_SECRET_KEY } from '../middleware/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Settings storage
let authSettings = {
  allowSignups: true,
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user?.username === 'ryanvogel') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

router.post('/signup', async (req, res) => {
  try {
    // Check if signups are allowed
    if (!authSettings.allowSignups && req.body.username !== 'ryanvogel') {
      return res.status(403).json({ error: 'New user registration is currently disabled' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await createUser(username, password);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET_KEY, {
      expiresIn: '7d',
    });

    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await validateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET_KEY, {
      expiresIn: '7d',
    });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET_KEY);
    res.json({ user: { id: verified.id, username: verified.username } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin routes
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = getUsers().map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = getUsers();
    const updatedUsers = users.filter(user => user.id !== userId);

    if (users.length === updatedUsers.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    saveUsers(updatedUsers);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings', verifyToken, isAdmin, (req, res) => {
  res.json(authSettings);
});

router.post('/settings', verifyToken, isAdmin, (req, res) => {
  const { allowSignups } = req.body;

  if (typeof allowSignups !== 'boolean') {
    return res.status(400).json({ error: 'Invalid settings format' });
  }

  authSettings.allowSignups = allowSignups;
  res.json(authSettings);
});

export default router;
