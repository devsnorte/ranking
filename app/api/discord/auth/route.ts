import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/discord/callback`

// Define the required Discord OAuth2 scopes
const DISCORD_SCOPES = [
  'identify',
  'guilds',
  'guilds.join'
].join(' ')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing userId parameter',
          message: 'Please provide a userId in the query parameters'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing Discord credentials',
          message: 'Discord OAuth2 credentials are not properly configured'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Generate a random state to prevent CSRF attacks
    const state = Math.random().toString(36).substring(7)

    // Store the state and userId in the database for verification
    const supabase = createServerClient()
    const { error } = await supabase
      .from('discord_auth_states')
      .insert({
        state,
        user_id: userId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing auth state:', error)
      return new NextResponse(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to store authentication state'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Construct the Discord OAuth URL
    const authUrl = new URL('https://discord.com/api/oauth2/authorize')
    authUrl.searchParams.append('client_id', DISCORD_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', DISCORD_SCOPES)
    authUrl.searchParams.append('state', state)

    // Redirect to Discord
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Error in Discord auth route:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
