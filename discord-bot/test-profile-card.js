import fetch from 'node-fetch';

async function testProfileCard() {
  try {
    const dashboardUrl = 'http://localhost:5000';
    
    const profileData = {
      user: {
        id: '719536686140227674',
        username: 'TestUser',
        discriminator: '0000',
        avatar: null
      },
      stats: {
        level: 5,
        totalXp: 1250,
        points: 500,
        totalMessages: 123,
        voiceTime: 3
      },
      style: {
        backgroundColor: '#36393F',
        accentColor: '#5865F2',
        textColor: '#FFFFFF',
        progressGradient: ['#5865F2', '#FF73FA']
      }
    };

    console.log('Testing profile card generation...');
    
    const response = await fetch(`${dashboardUrl}/api/profile-card/719536686140227674/719536686140227674`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    
    if (response.ok) {
      const svgContent = await response.text();
      console.log('✅ Profile card generated successfully!');
      console.log('SVG length:', svgContent.length, 'characters');
      console.log('First 100 characters:', svgContent.substring(0, 100));
    } else {
      console.error('❌ Failed to generate profile card:', response.status);
      console.error('Response:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error testing profile card:', error);
  }
}

testProfileCard();