import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher instance (for sending events)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side Pusher instance (for receiving events)
export const getPusherClient = () => {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  })
}

// Event types for type safety
export type PusherEvent =
  | { type: 'item-created'; data: any }
  | { type: 'item-updated'; data: any }
  | { type: 'item-deleted'; data: { itemId: string } }
  | { type: 'vote-updated'; data: any }
  | { type: 'comment-added'; data: any }
  | { type: 'comment-deleted'; data: { commentId: string; itemId: string } }

// Helper to trigger events
export async function triggerBrainDumpEvent(
  brainDumpId: string,
  event: PusherEvent
) {
  try {
    await pusherServer.trigger(
      `brain-dump-${brainDumpId}`,
      event.type,
      event.data
    )
  } catch (error) {
    console.error('Failed to trigger Pusher event:', error)
    // Don't throw - we don't want real-time updates to break the API
  }
}
