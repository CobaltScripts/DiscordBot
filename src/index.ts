import 'dotenv/config';
import { ExtendedClient } from './structures/Client.js';

new ExtendedClient({
  token: process.env.DISCORD_TOKEN!,
  smeeUrl: process.env.SMEE_URL!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  prefix: '.',
});
