import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let pool;

export async function connectDatabase() {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function getUserServerData(userId, serverId) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(
      'SELECT * FROM user_servers WHERE user_id = $1 AND server_id = $2',
      [userId, serverId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user server data:', error);
    return null;
  }
}

export async function createUserServerData(userData) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(`
      INSERT INTO user_servers (user_id, server_id, xp, level, points, total_messages, total_voice_time, profile_card)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userData.userId,
      userData.serverId,
      userData.xp || 0,
      userData.level || 1,
      userData.points || 0,
      userData.totalMessages || 0,
      userData.totalVoiceTime || 0,
      userData.profileCard || { accentColor: '#5865F2', progressGradient: ['#5865F2', '#FF73FA'] }
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user server data:', error);
    return null;
  }
}

export async function updateUserServerData(userId, serverId, updates) {
  try {
    if (!pool) await connectDatabase();
    
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      setClause.push(`${dbKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    values.push(userId, serverId);
    
    const query = `
      UPDATE user_servers 
      SET ${setClause.join(', ')}
      WHERE user_id = $${paramIndex} AND server_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user server data:', error);
    return null;
  }
}

export async function ensureUserExists(userId, username, discriminator, avatar) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(`
      INSERT INTO users (id, username, discriminator, avatar)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        discriminator = EXCLUDED.discriminator,
        avatar = EXCLUDED.avatar
      RETURNING *
    `, [userId, username, discriminator, avatar]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return null;
  }
}

export async function ensureServerExists(serverId, serverName, iconUrl, ownerId) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(`
      INSERT INTO servers (id, name, icon, owner_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon
      RETURNING *
    `, [serverId, serverName, iconUrl, ownerId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error ensuring server exists:', error);
    return null;
  }
}

export async function getChannelConfig(channelId, serverId) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(
      'SELECT * FROM channel_configs WHERE channel_id = $1 AND server_id = $2',
      [channelId, serverId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching channel config:', error);
    return null;
  }
}

export async function logActivity(activityData) {
  try {
    if (!pool) await connectDatabase();
    
    await pool.query(`
      INSERT INTO activity_logs (user_id, server_id, channel_id, type, xp_gained, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      activityData.userId,
      activityData.serverId,
      activityData.channelId,
      activityData.type,
      activityData.xpGained || 0,
      JSON.stringify(activityData.metadata || {})
    ]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getUserRank(userId, serverId) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(`
      SELECT COUNT(*) + 1 as rank
      FROM user_servers 
      WHERE server_id = $1 AND xp > (
        SELECT xp FROM user_servers WHERE user_id = $2 AND server_id = $1
      )
    `, [serverId, userId]);
    
    return parseInt(result.rows[0].rank) || 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return 1;
  }
}

export async function getTopUsers(serverId, limit = 10) {
  try {
    if (!pool) await connectDatabase();
    
    const result = await pool.query(`
      SELECT us.*, u.username, u.discriminator, u.avatar
      FROM user_servers us
      JOIN users u ON us.user_id = u.id
      WHERE us.server_id = $1
      ORDER BY us.xp DESC
      LIMIT $2
    `, [serverId, limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
}
