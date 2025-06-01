import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

async function checkBotStatus() {
  try {
    console.log('🔍 봇 상태 확인 중...');
    
    // 봇 정보 확인
    const botInfo = await rest.get(Routes.user('@me'));
    console.log('✅ 봇 정보:', {
      name: botInfo.username,
      id: botInfo.id,
      discriminator: botInfo.discriminator
    });
    
    // 애플리케이션 정보 확인  
    const appInfo = await rest.get(Routes.oauth2CurrentApplication());
    console.log('✅ 애플리케이션 정보:', {
      name: appInfo.name,
      id: appInfo.id,
      owner: appInfo.owner?.username || appInfo.team?.name
    });
    
    // 현재 등록된 명령어 확인
    const commands = await rest.get(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID));
    console.log(`📋 등록된 명령어: ${commands.length}개`);
    commands.forEach(cmd => console.log(`  - ${cmd.name}: ${cmd.description}`));
    
    // 환경변수 검증
    console.log('\n🔧 환경변수 검증:');
    console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
    console.log('애플리케이션 ID 일치:', process.env.DISCORD_CLIENT_ID === appInfo.id ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    if (error.code) {
      console.error('오류 코드:', error.code);
    }
  }
}

checkBotStatus();