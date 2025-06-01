import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserServerData, getUserRank } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('개인 통계 정보를 조회합니다')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('조회할 사용자 (선택사항)')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const serverId = interaction.guild.id;
    const userId = targetUser.id;

    try {
      await interaction.deferReply();

      // 데이터베이스에서 직접 사용자 데이터 가져오기
      const userData = await getUserServerData(userId, serverId);
      
      if (!userData) {
        return await interaction.editReply({
          content: '해당 사용자의 통계를 찾을 수 없습니다. 서버에서 활동한 기록이 없을 수 있습니다.'
        });
      }

      // 사용자 순위 가져오기
      const rankData = await getUserRank(userId, serverId);

      const stats = {
        level: userData.level,
        xp: userData.xp,
        points: userData.points,
        totalMessages: userData.totalMessages || 0,
        voiceTime: Math.round((userData.totalVoiceTime || 0) / 60), // 분 -> 시간
        rank: rankData.rank || 0
      };

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${targetUser.username}님의 통계`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor('#5865F2')
        .addFields(
          {
            name: '🏆 기본 정보',
            value: `레벨: **${stats.level}**\n포인트: **${stats.points.toLocaleString()}P**\n랭킹: **#${stats.rank}**`,
            inline: true
          },
          {
            name: '💬 활동 통계',
            value: `메시지: **${stats.totalMessages.toLocaleString()}개**\n음성채팅: **${stats.voiceTime}시간**`,
            inline: true
          },
          {
            name: '📈 경험치',
            value: `총 경험치: **${stats.xp.toLocaleString()}XP**`,
            inline: true
          }
        );

      // 주 활동 시간대 추가
      if (mostActiveHour.count > 0) {
        embed.addFields({
          name: '⏰ 주 활동 시간대',
          value: `**${mostActiveHour.hour}시** (${mostActiveHour.count}회 활동)`,
          inline: true
        });
      }

      // 가장 활발한 채널 추가
      if (topChannel) {
        embed.addFields({
          name: '📢 가장 활발한 채널',
          value: `<#${topChannel.channelId}> (${topChannel.messageCount}개 메시지)`,
          inline: true
        });
      }

      // 업적 목록 (최대 5개)
      if (stats.achievements && stats.achievements.length > 0) {
        const achievementList = stats.achievements
          .slice(0, 5)
          .map(achievement => `🏅 ${achievement.name}`)
          .join('\n');
        
        embed.addFields({
          name: '🏅 최근 획득 업적',
          value: achievementList + (stats.achievements.length > 5 ? `\n... 그 외 ${stats.achievements.length - 5}개` : ''),
          inline: false
        });
      }

      // 24시간 활동 히트맵 (간단 버전)
      if (stats.hourlyActivity) {
        const heatmapData = [];
        for (let i = 0; i < 24; i += 4) {
          const activity = stats.hourlyActivity[i] || 0;
          const intensity = activity > 10 ? '🟢' : activity > 5 ? '🟡' : activity > 0 ? '🟠' : '⚫';
          heatmapData.push(`${i}시${intensity}`);
        }
        
        embed.addFields({
          name: '📈 일일 활동 패턴',
          value: heatmapData.join(' '),
          inline: false
        });
      }

      embed.setFooter({ 
        text: `${interaction.guild.name} • 통계는 실시간으로 업데이트됩니다`,
        iconURL: interaction.guild.iconURL() 
      })
      .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('통계 명령어 오류:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ 오류 발생')
        .setDescription('통계 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        .setColor('#FF0000');

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};