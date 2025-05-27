import { createCanvas, loadImage, registerFont } from 'canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Canvas dimensions
const CARD_WIDTH = 800;
const CARD_HEIGHT = 400;
const CORNER_RADIUS = 20;

// Colors
const COLORS = {
  background: '#36393F',
  text: '#FFFFFF',
  textMuted: '#B9BBBE',
  accent: '#5865F2',
  progressBg: '#4F545C',
  overlay: 'rgba(0, 0, 0, 0.3)'
};

export async function generateProfileCard(profileData) {
  try {
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Enable font smoothing
    ctx.textDrawingMode = 'path';
    ctx.patternQuality = 'best';
    ctx.quality = 'best';

    // Draw background
    await drawBackground(ctx, profileData.style);

    // Draw user avatar and info
    await drawUserInfo(ctx, profileData.user);

    // Draw stats
    drawStats(ctx, profileData.stats);

    // Draw progress bar
    drawProgressBar(ctx, profileData.stats, profileData.style);

    // Draw achievements
    drawAchievements(ctx, profileData.achievements);

    // Draw border
    drawBorder(ctx, profileData.style);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating profile card:', error);
    return null;
  }
}

async function drawBackground(ctx, style) {
  // Clear canvas with rounded rectangle
  ctx.fillStyle = COLORS.background;
  roundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
  ctx.fill();

  // Draw custom background if provided
  if (style.backgroundImage) {
    try {
      const bgImage = await loadImage(style.backgroundImage);
      ctx.save();
      roundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
      ctx.clip();
      ctx.drawImage(bgImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      ctx.restore();
    } catch (error) {
      console.error('Error loading background image:', error);
    }
  } else if (style.backgroundColor) {
    ctx.fillStyle = style.backgroundColor;
    roundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
    ctx.fill();
  }

  // Add gradient overlay for better text readability
  if (style.backgroundImage || style.backgroundColor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    roundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
    ctx.fill();
  }
}

async function drawUserInfo(ctx, user) {
  const avatarSize = 120;
  const avatarX = 50;
  const avatarY = 50;

  try {
    // Load and draw avatar
    let avatarImage;
    try {
      avatarImage = await loadImage(user.avatar);
    } catch {
      // Fallback to default avatar
      avatarImage = await createDefaultAvatar(user.username);
    }

    // Draw avatar with circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Draw avatar border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw username
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(user.username, avatarX + avatarSize + 30, avatarY + 45);

    // Draw discriminator
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '24px sans-serif';
    ctx.fillText(user.discriminator, avatarX + avatarSize + 30, avatarY + 80);

  } catch (error) {
    console.error('Error drawing user info:', error);
  }
}

function drawStats(ctx, stats) {
  const startX = 50;
  const startY = 220;
  const statWidth = 200;
  const statHeight = 80;
  const spacing = 20;

  const statItems = [
    { label: '레벨', value: stats.level.toString() },
    { label: '경험치', value: stats.totalXp.toLocaleString() },
    { label: '포인트', value: stats.points.toLocaleString() }
  ];

  statItems.forEach((stat, index) => {
    const x = startX + (statWidth + spacing) * index;
    const y = startY;

    // Draw stat background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundedRect(ctx, x, y, statWidth, statHeight, 10);
    ctx.fill();

    // Draw stat value
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + statWidth / 2, y + 35);

    // Draw stat label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '16px sans-serif';
    ctx.fillText(stat.label, x + statWidth / 2, y + 60);
  });

  ctx.textAlign = 'left'; // Reset text alignment
}

function drawProgressBar(ctx, stats, style) {
  const barX = 50;
  const barY = 320;
  const barWidth = CARD_WIDTH - 100;
  const barHeight = 20;

  // Calculate progress percentage
  const currentLevelXP = stats.level === 1 ? 0 : Math.pow(stats.level, 2) * 100;
  const nextLevelXP = Math.pow(stats.level + 1, 2) * 100;
  const progressXP = stats.totalXp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const percentage = Math.min((progressXP / neededXP) * 100, 100);

  // Draw progress background
  ctx.fillStyle = COLORS.progressBg;
  roundedRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
  ctx.fill();

  // Draw progress fill with gradient
  if (percentage > 0) {
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, style.progressGradient[0] || style.accentColor);
    gradient.addColorStop(1, style.progressGradient[1] || style.accentColor);
    
    ctx.fillStyle = gradient;
    const fillWidth = (barWidth * percentage) / 100;
    roundedRect(ctx, barX, barY, fillWidth, barHeight, barHeight / 2);
    ctx.fill();
  }

  // Draw progress text
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${progressXP.toLocaleString()} / ${neededXP.toLocaleString()} XP`, barX + barWidth, barY - 5);
  
  ctx.textAlign = 'left';
  ctx.fillText('다음 레벨까지', barX, barY - 5);

  ctx.textAlign = 'left'; // Reset text alignment
}

function drawAchievements(ctx, achievements) {
  if (!achievements || achievements.length === 0) return;

  const startX = 50;
  const startY = 360;
  const achievementSize = 30;
  const spacing = 10;

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText('최근 업적', startX, startY - 5);

  achievements.slice(0, 5).forEach((achievement, index) => {
    const x = startX + (achievementSize + spacing) * index;
    const y = startY;

    // Draw achievement background
    const color = getAchievementColor(achievement.rarity);
    ctx.fillStyle = color;
    roundedRect(ctx, x, y, achievementSize, achievementSize, 8);
    ctx.fill();

    // Draw achievement icon (simplified)
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', x + achievementSize / 2, y + achievementSize / 2 + 5);
  });

  ctx.textAlign = 'left'; // Reset text alignment
}

function drawBorder(ctx, style) {
  ctx.strokeStyle = style.accentColor || COLORS.accent;
  ctx.lineWidth = 3;
  roundedRect(ctx, 1.5, 1.5, CARD_WIDTH - 3, CARD_HEIGHT - 3, CORNER_RADIUS);
  ctx.stroke();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getAchievementColor(rarity) {
  switch (rarity) {
    case 'legendary': return '#FF6B00';
    case 'epic': return '#8B5CF6';
    case 'rare': return '#3B82F6';
    case 'common': return '#10B981';
    default: return '#6B7280';
  }
}

async function createDefaultAvatar(username) {
  // Create a simple default avatar with user's initial
  const avatarCanvas = createCanvas(256, 256);
  const avatarCtx = avatarCanvas.getContext('2d');
  
  // Background
  avatarCtx.fillStyle = '#5865F2';
  avatarCtx.fillRect(0, 0, 256, 256);
  
  // Initial
  avatarCtx.fillStyle = '#FFFFFF';
  avatarCtx.font = 'bold 120px sans-serif';
  avatarCtx.textAlign = 'center';
  avatarCtx.textBaseline = 'middle';
  avatarCtx.fillText(username[0].toUpperCase(), 128, 128);
  
  return avatarCanvas;
}
