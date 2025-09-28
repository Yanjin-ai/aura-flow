export default function handler(req, res) {
  console.log('Test API called');
  res.status(200).json({ 
    success: true, 
    message: 'Simple test API works',
    timestamp: new Date().toISOString()
  });
}
