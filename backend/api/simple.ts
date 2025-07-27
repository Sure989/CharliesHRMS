export default function handler(req: any, res: any) {
  res.json({
    status: 'success',
    message: 'Simple endpoint working',
    timestamp: new Date().toISOString(),
  });
}