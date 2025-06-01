import { connectDatabase, createUserServerData, ensureUserExists, ensureServerExists } from './utils/database.js';

async function createTestData() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    // Create test user
    await ensureUserExists('719536686140227674', 'TestUser', '0000', null);
    console.log('User created/ensured');

    // Create test server
    await ensureServerExists('719536686140227674', 'Test Server', null, '719536686140227674');
    console.log('Server created/ensured');

    // Create user-server data
    const userData = {
      userId: '719536686140227674',
      serverId: '719536686140227674',
      xp: 1250,
      level: 5,
      points: 500,
      totalMessages: 123,
      totalVoiceTime: 180
    };

    await createUserServerData(userData);
    console.log('User server data created:', userData);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestData();