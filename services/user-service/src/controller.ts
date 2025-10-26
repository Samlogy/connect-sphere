import { Request, Response } from "express";
import utils from "./utils";
import { pool } from "./db"
import service from "./services"
import { redisClient } from "./cache";


const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows[0]) return res.status(400).json({ error: "Email already exists" });

    const user = await service.createUser(username, email, password);
    return res.status(201).json(user);
  } catch (err) {
    console.error("Error Register => ", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await utils.hash.comparePassword(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = utils.jwt.generateToken(user.id);
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Error Login => ", err);
    res.status(500).json({ error: "Login failed" });
  }
};


const getUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const cachedUser = await redisClient.get(`user:${id}`);
    if (cachedUser) {
      console.log('📦 Cache hit');
      return res.status(200).json(JSON.parse(cachedUser));
    }

    console.log('💾 Cache miss - querying DB');
    const { rows } = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // 2️⃣ Save to Redis for 1 hour
    await redisClient.setEx(`user:${id}`, 3600, JSON.stringify(user));

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const followUser = async (req: Request, res: Response) => {
  const { followerId, followingId } = req.body;

  if (followerId === followingId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
    res.status(201).json({ message: 'Followed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const unfollowUser = async (req: Request, res: Response) => {
  const { followerId, followingId } = req.body;

  try {
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, created_at',
      [username, email, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = rows[0];

    // ❌ Invalidate cache
    await redisClient.del(`user:${id}`);

    // ✅ Optionally, set fresh cache
    await redisClient.setEx(`user:${id}`, 3600, JSON.stringify(updatedUser));

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFollowers = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check cache
    const cacheKey = `followers:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('📦 Followers cache hit');
      return res.status(200).json(JSON.parse(cached));
    }

    console.log('💾 Followers cache miss');
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1`,
      [id]
    );

    // Store in cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(rows));
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFollowing = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const cacheKey = `following:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('📦 Following cache hit');
      return res.status(200).json(JSON.parse(cached));
    }

    console.log('💾 Following cache miss');
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1`,
      [id]
    );

    await redisClient.setEx(cacheKey, 300, JSON.stringify(rows));
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  user: {
    register,
    login,
    getUserProfile
  },
  follow: {
    followUser,
    unfollowUser,
    updateUserProfile,
    getFollowers,
    getFollowing
  }

}