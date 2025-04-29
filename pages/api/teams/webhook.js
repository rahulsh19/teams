let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  const now = Date.now();

  // If token is still valid, return it
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default'
    })
  });

  const data = await response.json();

  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiry = now + (data.expires_in - 60) * 1000; // 60s buffer
    return cachedToken;
  } else {
    throw new Error('Failed to retrieve access token');
  }
}

async function fetchMessageDetails(messageId, teamId, channelId, token) {
  const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch message: ${response.statusText}`);
  }

  const messageData = await response.json();
  return messageData;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (req.query.validationToken) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(req.query.validationToken);
    }

    try {
      console.log('Notification received:', JSON.stringify(req.body));

      const token = await getAccessToken();

      // Adjust this part to parse the message, team, and channel IDs from the notification payload
      const resource = req.body?.value?.[0]?.resource; // example: "teams/{teamId}/channels/{channelId}/messages/{messageId}"
      const [, teamId, , channelId, , messageId] = resource.split('/');

      const message = await fetchMessageDetails(messageId, teamId, channelId, token);
      console.log('Fetched message details:', message);

      return res.status(200).send('Message fetched');
    } catch (err) {
      console.error('Error handling notification:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
