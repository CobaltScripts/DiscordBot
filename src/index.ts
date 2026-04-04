import 'dotenv/config';
import { ExtendedClient } from './structures/client.js';

new ExtendedClient({
  token: process.env.DISCORD_TOKEN!,
  smeeUrl: process.env.SMEE_URL!,
});
