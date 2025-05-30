import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { getUserServerData } from '../utils/database.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('사용자의 프로필 카드를 표시합니다')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('프로필을 확인할 유저')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const guild = interaction.guild;

      // Get user data from database
      const userData = await getUserServerData(targetUser.id, guild.id);
      
      if (!userData) {
        return await interaction.editReply({
          content: '해당 유저의 데이터를 찾을 수 없습니다. 서버에서 활동한 후 다시 시도해주세요.',
          ephemeral: true
        });
      }

      // Calculate current level progress
      const currentLevelXP = Math.pow(userData.level, 2) * 100;
      const nextLevelXP = Math.pow(userData.level + 1, 2) * 100;
      const progressXP = userData.xp - currentLevelXP;
      const neededXP = nextLevelXP - currentLevelXP;

      // Get user's achievements (latest 3) - placeholder for now
      const achievements = [];

      // Prepare profile data
      const profileData = {
        user: {
          username: targetUser.username,
          discriminator: targetUser.discriminator,
          avatar: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
          id: targetUser.id
        },
        stats: {
          level: userData.level,
          xp: progressXP,
          maxXp: neededXP,
          totalXp: userData.xp,
          points: userData.points,
          rank: 1, // Will be calculated properly later
          totalMessages: userData.totalMessages,
          voiceTime: Math.floor(userData.totalVoiceTime / 60) // Convert to hours
        },
        style: userData.profileCard || {
          accentColor: '#5865F2',
          progressGradient: ['#5865F2', '#FF73FA'],
          backgroundColor: undefined,
          backgroundImage: undefined
        },
        achievements: achievements.map(achievement => ({
          name: achievement.name,
          icon: achievement.icon,
          rarity: achievement.type
        }))
      };

      // Try to get profile card from dashboard API, fallback to default settings
      const dashboardUrl = 'https://wangbotdash.up.railway.app'; // 대시보드 URL
      const profileCardUrl = `${dashboardUrl}/api/profile-card/${targetUser.id}/${guild.id}`;
      
      let cardBuffer;
      let useDefaultSettings = false;
      
      try {
        const response = await fetch(profileCardUrl);
        if (response.ok) {
          cardBuffer = await response.buffer();
        } else {
          useDefaultSettings = true;
        }
      } catch (error) {
        console.error('Error fetching profile card from dashboard:', error);
        useDefaultSettings = true;
      }
      
      // If dashboard API failed, use default settings to generate profile card
      if (useDefaultSettings) {
        console.log('Using default profile settings for user:', targetUser.id);
        // Set default profile card settings
        profileData.style = {
          backgroundColor: '#36393F',
          accentColor: '#5865F2',
          progressGradient: ['#5865F2', '#FF73FA']
        };
        
        try {
          const defaultResponse = await fetch(profileCardUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });
          
          if (defaultResponse.ok) {
            cardBuffer = await defaultResponse.buffer();
          } else {
            throw new Error('Failed to generate default profile card');
          }
        } catch (defaultError) {
          console.error('Error generating default profile card:', defaultError);
          return await interaction.editReply({
            content: '프로필 카드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
          });
        }
      }

      const attachment = new AttachmentBuilder(cardBuffer, { name: 'profile.png' });

      await interaction.editReply({
        files: [attachment]
      });

    } catch (error) {
      console.error('Profile command error:', error);
      
      await interaction.editReply({
        content: '프로필 카드를 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        ephemeral: true
      });
    }
  }
};

async function getUserAchievements(userId, guildId, limit = 3) {
  try {
    // This would query the database for user achievements
    // For now, return empty array - will be implemented with database integration
    return [];
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
}

async function getUserRank(userId, guildId) {
  try {
    // This would calculate user's rank in the server
    // For now, return a placeholder - will be implemented with database integration
    return 1;
  } catch (error) {
    console.error('Error calculating user rank:', error);
    return 0;
  }
}
