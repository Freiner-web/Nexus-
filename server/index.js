const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'nexus_secret',
  resave: false,
  saveUninitialized: true,
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `https://${process.env.PROJECT_DOMAIN}.railway.app/auth/google/callback`
);

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens;
  res.send('✅ YouTube connected! You can now upload videos with Nexus.');
});

app.post('/api/upload/youtube', async (req, res) => {
  try {
    const { title, description, filePath } = req.body;

    if (!req.session.tokens) return res.status(401).send('Not authenticated');

    oauth2Client.setCredentials(req.session.tokens);

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title || 'Nexus AI Upload',
          description: description || 'Uploaded by Nexus AI automation',
        },
        status: { privacyStatus: 'unlisted' },
      },
      media: {
        body: fs.createReadStream(path.resolve(filePath)),
      },
    });

    res.json({ success: true, videoId: response.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload failed');
  }
});

app.listen(3000, () => {
  console.log('✅ Nexus running');
});
