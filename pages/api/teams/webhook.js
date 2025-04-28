export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (req.query.validationToken) {
      console.log('Validation token received:', req.query.validationToken);
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(req.query.validationToken);
    } else {
      console.log('Notification received:', JSON.stringify(req.body));
      res.status(202).send('Accepted'); // 202 is better for notification ack
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
