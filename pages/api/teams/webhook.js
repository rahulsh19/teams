export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (req.body?.validationToken) {
        console.log('Validation token received:', req.body.validationToken);
        
        // Send the validation token back as expected by the service
        return res.status(200).json({
          validationToken: req.body.validationToken, // Example structure
        });
      } else {
        console.log('Notification received:', JSON.stringify(req.body));
        return res.status(200).send('OK');
      }
    } else {
      res.status(405).send('Method Not Allowed');
    }
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
}
