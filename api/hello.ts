// api/hello.ts
export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send('hello');
}
