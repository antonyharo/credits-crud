// app/api/webhooks/clerk/route.js
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  console.log('Webhook received - Starting processing')
  
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('Error: CLERK_WEBHOOK_SECRET is missing from environment variables')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get headers
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  console.log('Headers received:', {
    svix_id,
    svix_timestamp,
    svix_signature
  })

  // Verify headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Error: Missing Svix headers')
    return new Response(JSON.stringify({ error: 'Bad request - missing headers' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get payload
  let payload
  try {
    payload = await req.json()
    console.log('Payload received:', JSON.stringify(payload, null, 2))
  } catch (err) {
    console.error('Error parsing JSON payload:', err)
    return new Response(JSON.stringify({ error: 'Bad request - invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const body = JSON.stringify(payload)

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
    console.log('Webhook verified successfully. Event type:', evt.type)
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Process event
  const eventType = evt.type
  console.log(`Processing event: ${eventType}`)

  try {
    // User created or updated
    if (eventType === 'user.created' || eventType === 'user.updated') {
      if (!evt.data) {
        console.error('Error: Missing event data')
        return new Response(JSON.stringify({ error: 'Missing event data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const { id, email_addresses, first_name, last_name } = evt.data
      
      if (!id) {
        console.error('Error: Missing user ID in event data')
        return new Response(JSON.stringify({ error: 'Missing user ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const email = email_addresses?.[0]?.email_address || null
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null

      console.log('Processing user:', { id, email, fullName })

      // Upsert user data
      const { error } = await supabase
        .from('users')
        .upsert({
          clerk_user_id: id,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'clerk_user_id'
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('User successfully processed:', id)

    } 
    // User deleted
    else if (eventType === 'user.deleted') {
      if (!evt.data || !evt.data.id) {
        console.error('Error: Missing user ID for deletion')
        return new Response(JSON.stringify({ error: 'Missing user ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const { id } = evt.data
      console.log('Deleting user:', id)

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('User successfully deleted:', id)
    }

    // Return success for all processed events
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing webhook event:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}