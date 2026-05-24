import { buildApp } from './app';

async function start() {
  const app = buildApp();
  const port = Number(process.env.PORT || '3000');
  const host = '0.0.0.0';

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
