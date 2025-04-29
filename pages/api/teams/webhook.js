import { fetchMessageDetails } from './fetchMessageDetails.js';
import db from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (req.query.validationToken) {
        // Validation token for webhook subscription setup
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(req.query.validationToken);
      } else {
        // Process notifications
        const notifications = req.body.value;

        for (const notification of notifications) {
          if (notification.resourceData && notification.resourceData.id) {
            const messageId = notification.resourceData.id;
            console.log(`Fetching details for message ID: ${messageId}`);

            // Fetch the message details
            const message = await fetchMessageDetails(
              process.env.TEAM_ID,
              process.env.CHANNEL_ID,
              messageId,
              process.env.ACCESS_TOKEN  // Ensure you have an access token (OAuth flow)
            );

            // Store the message in the database
            const query = `
              INSERT INTO messages (message_id, sender, content, timestamp)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (message_id) DO NOTHING;
            `;
            const values = [
              message.id,
              message.from.user.displayName,
              message.body.content,
              message.createdDateTime,
            ];

            await db.query(query, values);
            console.log('Message stored in database:', message.id);
          }
        }

        res.status(202).send('OK');
      }
    } else {
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('Error processing notification:', error.message);
    res.status(500).send('Error processing notification');
  }
}
