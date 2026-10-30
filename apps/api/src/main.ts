import { createApp } from './app';

async function main() {
  const app = await createApp();
  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`GridTrip API on http://localhost:${port}/api`);
}

main();
