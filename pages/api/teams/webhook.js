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

// import axios from 'axios';
// import { Pool } from 'pg';

// // Replace with your actual credentials
// const TENANT_ID = process.env.TENANT_ID;
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;

// const pool = new Pool({
//   user: process.env.PGUSER,         // Your Neon DB username
//   host: process.env.PGHOST,         // Your Neon DB host (e.g., ep-falling-frog...)
//   database: process.env.PGDATABASE, // Your Neon DB name (e.g., teamDB)
//   password: process.env.PGPASSWORD, // Your Neon DB password
//   port: process.env.PGPORT || 5432, // Default port for PostgreSQL
//   ssl: { rejectUnauthorized: false }, // Required for Neon (SSL)
// });

// // Function to get an access token
// async function getAccessToken() {
//   const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

//   const params = new URLSearchParams();
//   params.append('client_id', CLIENT_ID);
//   params.append('client_secret', CLIENT_SECRET);
//   params.append('grant_type', 'client_credentials');
//   params.append('scope', 'https://graph.microsoft.com/.default');

//   try {
//     const res = await axios.post(url, params);
//     console.log('Access token retrieved successfully');
//     return res.data.access_token;
//   } catch (error) {
//     console.error('Error fetching access token:', error.response?.data || error.message);
//     throw new Error('Failed to fetch access token');
//   }
// }

// // Function to fetch message details from Graph API
// async function fetchMessageDetails(teamId, channelId, messageId) {
//   const token = await getAccessToken();
//   const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}`;

//   const headers = {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };

//   try {
//     const response = await axios.get(url, { headers });
//     console.log('Fetched Message Details:', JSON.stringify(response.data, null, 2));
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching message details:', error.response?.data || error.message);
//     throw new Error('Failed to fetch message details');
//   }
// }

// function stripHtml(html) {
//   return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
// }

// async function replyToChannelMessage(teamId, channelId, messageId) {
//   const token = await getAccessToken();
//   const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`;

//   const headers = {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };

//   const body = {
//     body: {
//       content: "Thank you!",
//     },
//   };

//   try {
//     await axios.post(url, body, { headers });
//     console.log("✅ Replied with 'Thank you!'");
//   } catch (err) {
//     console.error("❌ Error sending reply:", err.response?.data || err.message);
//   }
// }


// async function saveMessageToDB(messageData) {
//   const rawContent = messageData.body?.content || '';
//   const plainText = stripHtml(rawContent);

//   const text = `
//     INSERT INTO message_store(id, content, created_at)
//     VALUES($1, $2, $3)
//     ON CONFLICT (id) DO NOTHING
//   `;
//   const values = [
//     messageData.id,
//     plainText,
//     messageData.createdDateTime,
//   ];

//   try {
//     await pool.query(text, values);
//     console.log('Message saved:', plainText);
//   } catch (err) {
//     console.error('DB insert error:', err.message);
//   }
// }


// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     // Step 1: Validate subscription
//     if (req.query?.validationToken) {
//         console.log("Validation token received:", req.query.validationToken);
//         res.setHeader('Content-Type', 'text/plain'); // This line is critical
//         return res.status(200).send(req.query.validationToken);
//       }


//     // Step 2: Handle incoming notifications
//     console.log('--- LOG: Entered Notification Handler ---');
//     console.log('--- LOG: Notification Payload ---', JSON.stringify(req.body));

//     try {
//       const notification = req.body.value?.[0];

//       if (!notification) {
//         return res.status(400).send('No notification data');
//       }

//       const messageId = notification.resourceData?.id;
//       const teamMatch = notification.resource.match(/teams\('([^']+)'\)/);
//       const channelMatch = notification.resource.match(/channels\('([^']+)'\)/);

//       const teamId = teamMatch?.[1];
//       const channelId = channelMatch?.[1];

//       if (!teamId || !channelId || !messageId) {
//         console.error('Missing required IDs');
//         return res.status(400).send('Invalid notification structure');
//       }

//       console.log('Team ID:', teamId);
//       console.log('Channel ID:', channelId);
//       console.log('Message ID:', messageId);

//       // Fetch message details
//       // await fetchMessageDetails(teamId, channelId, messageId);
//        const fullMessage = await fetchMessageDetails(teamId, channelId, messageId);
//        await saveMessageToDB(fullMessage);
//        console.log('Message saved:', fullMessage.body?.content);
//        if (!fullMessage) {
//             console.log("message is not recieved")
             
             
//        } else {
//              await replyToChannelMessage(teamId, channelId, messageId)
//        }

//       return res.status(200).send('OK');
//     } catch (err) {
//       console.error('Error processing notification:', err.message);
//       return res.status(500).send('Internal Server Error');
//     }
//   } else { 
//     res.status(405).send('Method Not Allowed');
//   }
// }

import fetch from "node-fetch";
export default async function handler(req, res) {
    if (req.query?.validationToken) {
        console.log("Validation token received:", req.query.validationToken);
        res.setHeader('Content-Type', 'text/plain'); // This line is critical
        return res.status(200).send(req.query.validationToken);
      }

  if (req.method === 'POST') {
    const notifications = req.body.value || [];

    //const token = await getToken(); // Get ROPC token again
      const token = "eyJ0eXAiOiJKV1QiLCJub25jZSI6IkdrVW9hWFVkNFBmZ25VWHJmNDV0Qkp3Mml0SzFydlJ1VFFya0pidTlPNjQiLCJhbGciOiJSUzI1NiIsIng1dCI6IkNOdjBPSTNSd3FsSEZFVm5hb01Bc2hDSDJYRSIsImtpZCI6IkNOdjBPSTNSd3FsSEZFVm5hb01Bc2hDSDJYRSJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82YmEyNjRiOC1lMmZlLTQ2MGEtYmJiNC01NzFiNTIxYzYwMzcvIiwiaWF0IjoxNzQ3NjI5MTI2LCJuYmYiOjE3NDc2MjkxMjYsImV4cCI6MTc0NzYzNDE0NywiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhaQUFBQU5sOE1pM0l4bU9iWmRsUVRTc2J1S0xXUUpyZEdQUzFZYTBzMDNJRTdCRVY2dTVvUDdaWnpVaTNRQjFtZ283aWN4SVhHTHd0ZDl4d2FWNWoxSVF0cUpYc1NMNm1rdG93RENEUEUrdDRXcFFmQi85UE1JaW53Yk1DeFBxcEVTcGU4dkpwZ2tJNkZYc2F1eXl4c1dGZ2lDdz09IiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJuZXdlbC10ZWFtcyIsImFwcGlkIjoiNGYzZTM3YTItMWI3ZC00ZDc5LWFkZDctMmE5N2U4MmYzNzNiIiwiYXBwaWRhY3IiOiIxIiwiZmFtaWx5X25hbWUiOiJTaGluZGUiLCJnaXZlbl9uYW1lIjoiUmFodWwiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIxMTAuMjI2LjE4MS44MiIsIm5hbWUiOiJSYWh1bCBTaGluZGUiLCJvaWQiOiIxMzU1NmY1MS00MWFlLTRiNjktOGRmYy1lOGFmYzMwNmNjMWQiLCJwbGF0ZiI6IjE0IiwicHVpZCI6IjEwMDMyMDA0ODY1QUFGRjYiLCJyaCI6IjEuQVhFQXVHU2lhXzdpQ2thN3RGY2JVaHhnTndNQUFBQUFBQUFBd0FBQUFBQUFBQUF2QVhGeEFBLiIsInNjcCI6IkNoYW5uZWxNZXNzYWdlLlNlbmQgQ2hhdC5SZWFkIENoYXQuUmVhZFdyaXRlIENoYXQuUmVhZFdyaXRlLkFsbCBDaGF0TWVzc2FnZS5TZW5kIEdyb3VwLlJlYWQuQWxsIG9wZW5pZCBwcm9maWxlIFVzZXIuUmVhZCBlbWFpbCIsInNpZCI6IjAwNGYzOTU5LWQ3NjktNjRlNC01ZDEwLWE1YmFiN2JlNTFiZCIsInN1YiI6IlA3UzRBeGI1NC12MjBiTzQwTUIyTk15WTBRMmtUbmdzWkdPdnBYemEzdzAiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiQVMiLCJ0aWQiOiI2YmEyNjRiOC1lMmZlLTQ2MGEtYmJiNC01NzFiNTIxYzYwMzciLCJ1bmlxdWVfbmFtZSI6IlJhaHVsLnNAbmV3ZWx0ZWNobm9sb2dpZXMuY29tIiwidXBuIjoiUmFodWwuc0BuZXdlbHRlY2hub2xvZ2llcy5jb20iLCJ1dGkiOiJtTzZkQS1rT2JrcUVTUnRKLU1nZUFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX2lkcmVsIjoiMSAxOCIsInhtc19zdCI6eyJzdWIiOiJQQjdTRzhkWTVfRGR5Z0VYMHo3R19WdVZWN2VjVGp1QXNWS0otemExQVgwIn0sInhtc190Y2R0IjoxNjIxNjc1NDA1fQ.JlljY41HKs2E3A18Y8cNQouBIu4IILZ6wBj32qvLYfx_7x4UhDtZzU-aXJX9-iKSZTaRjxwqFDUMd-lcmzULflP-5cwmaxE49NnUPgQVKtwzFYPhMSq41QziIoEq5JmgJroCAf4g0_IBPa0I-E-3e4KnGfzYY9Xc02FneXqRm-oPJq-Q2kBePXavSUbsqk-vGclMGrw9X0pKC_kGeOckj8TUXiUt2jDp5rvQC5VvGBTjJqEMQlxoyjv7U-cn5kA9LuqmQb1fUPsj1sWWGfdQBRrW6Sy4Ed3P0-wMxMpJPMQknB9Xp5reLIxcaG3NR3uRzsfKaHWBjGx5PMa69i2pEQ"

    for (const note of notifications) {
        // Prefer `note.resource`, fallback to `@odata.id` if undefined
        const resource = note.resource || note.resourceData?.['@odata.id'];
      
        if (!resource) {
          console.error("No resource found in notification:", note);
          continue;
        }
      
        // Extract IDs using regex
        const chatMatch = resource.match(/chats\('([^']+)'\)/);
        const messageMatch = resource.match(/messages\('([^']+)'\)/);
        console.log(chatMatch,"chatmatch");
        console.log(messageMatch,"messagematch");
      
        if (!chatMatch || !messageMatch) {
          console.error("Missing required IDs", { resource });
          continue;
        }
      
        const chatId = chatMatch[1];
        const messageId = messageMatch[1];
        console.log(chatId, "chatID");
        console.log(messageId,"messageID");
      
      
        const message = await getMessage(chatId, messageId, token);
        console.log(message, "message");
        console.log("Received message:", message?.body?.content);
      
        await sendThankYou(chatId, token);
      }



    return res.status(202).end();
  }

  res.status(405).end(); // Method not allowed
} // Ensure you're using node-fetch in Node.js

async function getToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default offline_access openid");
  params.append("username", "Rahul.s@neweltechnologies.com");
  params.append("password", "Luhar@4495");

  const res = await fetch(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();
  console.log(data);

  if (!res.ok) {
    throw new Error(`Token request failed: ${data.error_description || res.statusText}`);
  }

  return data.access_token;
}


async function getMessage(chatId, messageId, token) {
  console.log("message read function called here")
  const res = await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("responce",res)


  return res.ok ? await res.json() : null;
}

async function sendThankYou(chatId, token) {
  await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: { content: "Thank you" } }),
  });
}
