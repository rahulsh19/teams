export default async function handler(req, res) {
    if (req.method === 'POST') {
      if (req.body?.validationToken) {
        console.log('Validation token received:', req.body.validationToken);
        res.status(200).send(req.body.validationToken);
      } else {
        console.log('Notification received:', JSON.stringify(req.body));
        res.status(200).send('OK');
      }
    } else {
      res.status(405).send('Method Not Allowed');
    }
  }
  