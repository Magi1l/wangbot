import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { levelSystem } from './utils/levelSystem.js';
import { connectDatabase } from './utils/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();
client.voiceSessions = new Map(); // Track voice sessions

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(filePath);
  if ('data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(filePath);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

// Ready event
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is online!`);
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Set bot status
    client.user.setActivity('레벨링 시스템 | /profile', { type: 'WATCHING' });
    
    console.log('🎉 봇이 완전히 준비되었습니다!');
  } catch (error) {
    console.error('❌ 봇 초기화 중 오류:', error);
    // 데이터베이스 연결 실패해도 봇은 계속 실행
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = '명령어 실행 중 오류가 발생했습니다.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Enhanced error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
});

// Login to Discord with proper error handling
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN이 설정되지 않았습니다!');
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Discord 로그인 실패:', error);
  process.exit(1);
});

export { client };
