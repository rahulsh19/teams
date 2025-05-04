// let cachedToken = null;
// let tokenExpiry = null;

// async function getAccessToken() {
//   const now = Date.now();
//   console.log('Access token started');

//   // If token is still valid, return it
//   if (cachedToken && tokenExpiry && now < tokenExpiry) {
//     return cachedToken;
//   }

//   const response = await fetch('https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       client_id: process.env.CLIENT_ID,
//       client_secret: process.env.CLIENT_SECRET,
//       grant_type: 'client_credentials',
//       scope: 'https://graph.microsoft.com/.default'
//     })
//   });

//   const data = await response.json();

//   if (data.access_token) {
//     cachedToken = data.access_token;
//     tokenExpiry = now + (data.expires_in - 60) * 1000; // 60s buffer
//     return cachedToken;
//   } else {
//     throw new Error('Failed to retrieve access token');
//   }
// }

// async function fetchMessageDetails(messageId, teamId, channelId, token) {
//   const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}`;

//   const response = await fetch(url, {
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to fetch message: ${response.statusText}`);
//   }

//   const messageData = await response.json();
//   return messageData;
// }

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     if (req.query.validationToken) {
//       res.setHeader('Content-Type', 'text/plain');
//       return res.status(200).send(req.query.validationToken);
//     }

//     try {
//       console.log('Access token started');
//       console.log('Notification received:');
//       console.log('Access token started');

//       const token = await getAccessToken();
      

//       // Adjust this part to parse the message, team, and channel IDs from the notification payload
//       const resource = req.body?.value?.[0]?.resource; // example: "teams/{teamId}/channels/{channelId}/messages/{messageId}"
//       const [, teamId, , channelId, , messageId] = resource.split('/');

//       const message = await fetchMessageDetails(messageId, teamId, channelId, token);
//       console.log('Fetched message details:', message);

//       return res.status(200).send('Message fetched');
//     } catch (err) {
//       console.error('Error handling notification:', err);
//       return res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     return res.status(405).send('Method Not Allowed');
//   }
// }

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     // Step 1: Validate subscription
//     if (req.query?.validationToken) {
//       console.log("start");
//       console.log('Validation token received:', req.query.validationToken);
//       return res.status(200).send(req.query.validationToken);
//     }

//     // Step 2: Handle incoming notifications
//     console.log('--- LOG: Entered Notification Handler ---');
//     console.log('--- LOG: Notification Payload ---', JSON.stringify(req.body));
//     return res.status(200).send('OK');
//   } else {
//     res.status(405).send('Method Not Allowed');
//   }
// }

import axios from 'axios';
import { Pool } from 'pg';

// Replace with your actual credentials
const TENANT_ID = process.env.TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const pool = new Pool({
  user: process.env.PGUSER,         // Your Neon DB username
  host: process.env.PGHOST,         // Your Neon DB host (e.g., ep-falling-frog...)
  database: process.env.PGDATABASE, // Your Neon DB name (e.g., teamDB)
  password: process.env.PGPASSWORD, // Your Neon DB password
  port: process.env.PGPORT || 5432, // Default port for PostgreSQL
  ssl: { rejectUnauthorized: false }, // Required for Neon (SSL)
});

// Function to get an access token
async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'https://graph.microsoft.com/.default');

  try {
    const res = await axios.post(url, params);
    console.log('Access token retrieved successfully');
    return res.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw new Error('Failed to fetch access token');
  }
}

// Function to fetch message details from Graph API
async function fetchMessageDetails(teamId, channelId, messageId) {
  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.get(url, { headers });
    console.log('Fetched Message Details:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error fetching message details:', error.response?.data || error.message);
    throw new Error('Failed to fetch message details');
  }
}

async function saveMessageToDB(messageData) {
  const text = 'INSERT INTO message_store(id, content, created_at) VALUES($1, $2, $3)';
  const values = [
    messageData.id,
    messageData.body?.content || '',
    messageData.createdDateTime,
  ];
  await pool.query(text, values);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Step 1: Validate subscription
    if (req.query?.validationToken) {
        console.log("Validation token received:", req.query.validationToken);
        res.setHeader('Content-Type', 'text/plain'); // This line is critical
        return res.status(200).send(req.query.validationToken);
      }


    // Step 2: Handle incoming notifications
    console.log('--- LOG: Entered Notification Handler ---');
    console.log('--- LOG: Notification Payload ---', JSON.stringify(req.body));

    try {
      const notification = req.body.value?.[0];

      if (!notification) {
        return res.status(400).send('No notification data');
      }

      const messageId = notification.resourceData?.id;
      const teamMatch = notification.resource.match(/teams\('([^']+)'\)/);
      const channelMatch = notification.resource.match(/channels\('([^']+)'\)/);

      const teamId = teamMatch?.[1];
      const channelId = channelMatch?.[1];

      if (!teamId || !channelId || !messageId) {
        console.error('Missing required IDs');
        return res.status(400).send('Invalid notification structure');
      }

      console.log('Team ID:', teamId);
      console.log('Channel ID:', channelId);
      console.log('Message ID:', messageId);

      // Fetch message details
      // await fetchMessageDetails(teamId, channelId, messageId);
       const fullMessage = await fetchMessageDetails(teamId, channelId, messageId);
       await saveMessageToDB(fullMessage);
       console.log('Message saved:', fullMessage.body?.content);

      return res.status(200).send('OK');
    } catch (err) {
      console.error('Error processing notification:', err.message);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}

