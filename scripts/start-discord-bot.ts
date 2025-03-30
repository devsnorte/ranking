import 'dotenv/config'
import { initializeDiscordBot } from '../lib/discord-bot'

async function main() {
  try {
    console.log('Starting Discord bot...')
    await initializeDiscordBot()
    console.log('Discord bot is running!')
  } catch (error) {
    console.error('Failed to start Discord bot:', error)
    process.exit(1)
  }
}

main()
