import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return new NextResponse('Missing required parameters', { status: 400 })
    }

    // Verify the state and get the userId
    const supabase = createServerClient()
    const { data: authState, error: stateError } = await supabase
      .from('discord_auth_states')
      .select('user_id')
      .eq('state', state)
      .single()

    if (stateError || !authState) {
      console.error('Error verifying auth state:', stateError)
      return new NextResponse('Invalid state', { status: 400 })
    }

    // Exchange the code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/discord/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Error exchanging code for token:', await tokenResponse.text())
      return new NextResponse('Failed to exchange code for token', { status: 500 })
    }

    const { access_token } = await tokenResponse.json()

    // Get the user's Discord ID
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Error getting Discord user:', await userResponse.text())
      return new NextResponse('Failed to get Discord user', { status: 500 })
    }

    const { id: discordUserId } = await userResponse.json()

    // Clean up the auth state
    await supabase
      .from('discord_auth_states')
      .delete()
      .eq('state', state)

    // Return success page that will communicate with the parent window
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Link Success</title>
        </head>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'DISCORD_LINK_SUCCESS', discordUserId: '${discordUserId}' },
              '${process.env.NEXT_PUBLIC_APP_URL}'
            );
            window.close();
          </script>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    console.error('Error in Discord callback route:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
