import { Client, Events, GatewayIntentBits, TextChannel, Message, ClientEvents } from 'discord.js'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// Map of Discord channel IDs to event IDs
const eventChannels = new Map<string, string>()

export async function initializeDiscordBot() {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('Missing Discord bot token')
    }

    client.once(Events.ClientReady, (readyClient: Client) => {
      if (readyClient.user) {
        console.log(`Ready! Logged in as ${readyClient.user.tag}`)
      } else {
        console.log('Ready! Bot is logged in but user is null')
      }
    })

    client.on(Events.MessageCreate, async (message: Message) => {
      // Ignore messages from bots
      if (message.author.bot) return

      // Check if the message is in an event channel
      const eventId = eventChannels.get(message.channelId)
      if (!eventId) return

      try {
        // Record the activity using the database function
        const { data, error } = await supabaseAdmin.rpc('record_discord_activity', {
          p_discord_user_id: message.author.id,
          p_activity_type: 'event_participation',
          p_channel: message.channelId,
          p_points: 5
        })

        if (error) {
          console.error('Error recording Discord activity:', error)
          return
        }

        if (data) {
          // Send a confirmation message
          await message.reply('🎉 Event participation recorded! You earned 5 points!')
        } else {
          // User not mapped
          await message.reply('Please link your Discord account to your platform account to earn points!')
        }
      } catch (error) {
        console.error('Error recording event participation:', error)
        await message.reply('Sorry, there was an error recording your participation.')
      }
    })

    // Connect to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN)
  } catch (error) {
    console.error('Error initializing Discord bot:', error)
    throw error
  }
}

// Function to map a Discord channel to an event
export function mapEventChannel(channelId: string, eventId: string) {
  eventChannels.set(channelId, eventId)
}

// Function to get the Discord client instance
export function getDiscordClient() {
  return client
}

// Function to create a Discord user mapping
export async function createDiscordUserMapping(discordUserId: string, platformUserId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('discord_user_mappings')
      .insert({
        discord_user_id: discordUserId,
        platform_user_id: platformUserId
      })

    if (error) {
      console.error('Error creating Discord user mapping:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createDiscordUserMapping:', error)
    throw error
  }
}

// Function to get a Discord user mapping
export async function getDiscordUserMapping(discordUserId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('discord_user_mappings')
      .select('platform_user_id')
      .eq('discord_user_id', discordUserId)
      .single()

    if (error) {
      console.error('Error getting Discord user mapping:', error)
      throw error
    }

    return data?.platform_user_id
  } catch (error) {
    console.error('Error in getDiscordUserMapping:', error)
    throw error
  }
}
