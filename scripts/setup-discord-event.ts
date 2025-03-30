import { mapEventChannel } from '../lib/discord-bot'

async function main() {
  try {
    // Replace this with your Discord channel ID
    const channelId = process.argv[2]
    const eventId = '08e7b848-c1de-404a-b9c5-34f025ee8ca0'

    if (!channelId) {
      console.error('Please provide a Discord channel ID')
      process.exit(1)
    }

    mapEventChannel(channelId, eventId)
    console.log(`Successfully mapped Discord channel ${channelId} to event ${eventId}`)
  } catch (error) {
    console.error('Error setting up Discord event:', error)
    process.exit(1)
  }
}

main()
