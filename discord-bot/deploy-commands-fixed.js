import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load all command files
const commandsPath = join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(filePath);
  if ('data' in command.default && 'execute' in command.default) {
    commands.push(command.default.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log('🔍 환경 변수 확인 중...');
    
    // 봇 정보로부터 올바른 애플리케이션 ID 가져오기
    const botInfo = await rest.get(Routes.user('@me'));
    const applicationId = botInfo.id;
    
    console.log('실제 애플리케이션 ID:', applicationId);
    console.log('환경변수 CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
    
    console.log(`📋 로드된 명령어: ${commands.length}개`);
    commands.forEach(cmd => console.log(`  - ${cmd.name}: ${cmd.description}`));

    // 1단계: 기존 명령어 모두 삭제
    console.log('🗑️ 기존 슬래시 명령어들을 삭제하는 중...');
    await rest.put(Routes.applicationCommands(applicationId), { body: [] });
    console.log('✅ 기존 명령어 삭제 완료');

    console.log(`🚀 ${commands.length}개의 새로운 슬래시 명령어를 등록하는 중...`);

    // 2단계: 새 명령어 등록
    const data = await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commands },
    );

    console.log(`🎉 ${data.length}개의 슬래시 명령어가 성공적으로 등록되었습니다!`);
    console.log('⏰ 명령어가 Discord에 나타나기까지 최대 1시간이 걸릴 수 있습니다.');
    
    // 올바른 CLIENT_ID 출력
    console.log('\n🔧 .env 파일을 다음과 같이 업데이트하세요:');
    console.log(`DISCORD_CLIENT_ID=${applicationId}`);
    
  } catch (error) {
    console.error('❌ 명령어 배포 중 오류 발생:', error);
    if (error.code) {
      console.error('오류 코드:', error.code);
    }
    if (error.status) {
      console.error('HTTP 상태:', error.status);
    }
  }
})();