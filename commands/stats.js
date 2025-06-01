import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserServerData, getUserRank } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('개인 통계 정보를 조회합니다')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('조회할 사용자 (선택사항)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const serverId = interaction.guild.id;
      const userId = targetUser.id;

      // 데이터베이스에서 사용자 데이터 가져오기
      const userData = await getUserServerData(userId, serverId);
      
      if (!userData) {
        return await interaction.editReply({
          content: '해당 사용자의 통계를 찾을 수 없습니다. 서버에서 활동한 기록이 없을 수 있습니다.'
        });
      }

      // 사용자 순위 가져오기
      const rankData = await getUserRank(userId, serverId);

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${targetUser.username}님의 통계`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor('#5865F2')
        .addFields(
          {
            name: '🏆 기본 정보',
            value: `레벨: **${userData.level}**\n포인트: **${userData.points.toLocaleString()}P**\n랭킹: **#${rankData.rank || '순위없음'}**`,
            inline: true
          },
          {
            name: '💬 활동 통계',
            value: `메시지: **${userData.totalMessages.toLocaleString()}개**\n음성채팅: **${Math.round((userData.totalVoiceTime || 0) / 60)}시간**`,
            inline: true
          },
          {
            name: '📈 경험치',
            value: `총 경험치: **${userData.xp.toLocaleString()}XP**`,
            inline: true
          }
        )
        .setFooter({
          text: `${interaction.guild.name} • 요청자: ${interaction.user.username}`,
          iconURL: interaction.guild.iconURL()
        });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Stats command error:', error);
      
      try {
        const errorMessage = '통계를 불러오는 중 오류가 발생했습니다.';
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
};