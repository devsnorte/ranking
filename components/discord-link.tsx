'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserClient } from '@/lib/supabase-browser'
import { createDiscordUserMapping } from '@/lib/discord-bot'

export default function DiscordLink() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleDiscordLink = async () => {
    setIsLoading(true)

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error('Failed to get user session')
      }

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to link your Discord account.',
          variant: 'destructive',
        })
        return
      }

      // Open Discord OAuth window
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        `/api/discord/auth?userId=${user.id}`,
        'Discord Link',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.')
      }

      // Listen for the OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'DISCORD_LINK_SUCCESS') {
          const { discordUserId } = event.data

          try {
            await createDiscordUserMapping(discordUserId, user.id)
            toast({
              title: 'Success!',
              description: 'Your Discord account has been linked successfully.',
            })
          } catch (error) {
            console.error('Error creating Discord user mapping:', error)
            toast({
              title: 'Error',
              description: 'Failed to link your Discord account. Please try again.',
              variant: 'destructive',
            })
          }
        }
      })
    } catch (error: any) {
      console.error('Error linking Discord account:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to start Discord linking process. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDiscordLink}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? 'Linking...' : 'Link Discord Account'}
    </Button>
  )
}
