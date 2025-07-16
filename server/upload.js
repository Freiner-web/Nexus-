const axios = require('axios');

axios.post('https://Nexus-ai.railway.app/api/upload/youtube', {
  title: 'Nexus Test Upload',
  description: 'Uploaded with Nexus AI',
  filePath: './server/videos/test.mp4'
})
.then(res => {
  console.log('✅ Uploaded:', res.data);
})
.catch(err => {
  console.error('❌ Upload failed:', err.response?.data || err.message);
});
