import fetch from 'node-fetch';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

async function fetchMessageDetails(teamId, channelId, messageId, accessToken) {
  const response = await fetch(`${GRAPH_API_URL}/teams/${teamId}/channels/${channelId}/messages/${messageId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch message');
  }

  const message = await response.json();
  return message;
}

export { fetchMessageDetails };
