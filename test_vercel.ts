import handler from './api/index.ts';

async function run() {
  try {
    const req = { originalUrl: '/api/health', method: 'GET', url: '/api/health', headers: {} };
    const res = {
      status: (code: number) => ({
        json: (data: any) => console.log(code, data),
        end: (data: any) => console.log(code, data),
        set: () => res.status(code)
      }),
      json: (data: any) => console.log(200, data),
      end: (data: any) => console.log(200, data),
      setHeader: () => {},
      end0: () => console.log('end')
    };
    await handler(req, res);
  } catch (e) {
    console.error(e);
  }
}
run();
