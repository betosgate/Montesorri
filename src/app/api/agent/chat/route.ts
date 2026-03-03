import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { agentTools } from '@/lib/agent/tools'
import { executeTool } from '@/lib/agent/tool-handlers'
import { buildSystemPrompt } from '@/lib/agent/system-prompt'

const MAX_TOOL_ITERATIONS = 5
const MAX_MESSAGES = 20

// Simple rate limiter: userId -> timestamps[]
const rateLimits = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 20

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = rateLimits.get(userId) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimits.set(userId, recent)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), { status: 429 })
    }

    // Parse body
    const { messages: rawMessages } = await request.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), { status: 400 })
    }

    // Truncate to last MAX_MESSAGES
    const messages = rawMessages.slice(-MAX_MESSAGES)

    // Build system prompt with user context
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, phone, state_code, state_name, address_line1')
      .eq('id', user.id)
      .single()

    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, grade_band')
      .eq('parent_id', user.id)
      .eq('enrollment_status', 'active')

    // Fetch subscription data for customer service context
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('student_id, status, cancel_at_period_end, created_at')
      .eq('parent_id', user.id)

    const studentMap = new Map((students || []).map(s => [s.id, s.first_name]))

    const systemPrompt = buildSystemPrompt({
      name: profile?.display_name || '',
      email: user.email || '',
      stateCode: profile?.state_code || null,
      stateName: profile?.state_name || null,
      phone: profile?.phone || null,
      hasAddress: !!profile?.address_line1,
      studentNames: (students || []).map(s => s.first_name),
      studentGrades: (students || []).map(s => s.grade_band),
      subscriptions: (subscriptions || []).map(sub => ({
        studentName: studentMap.get(sub.student_id) || 'Unknown',
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        enrollmentDate: sub.created_at,
      })),
    })

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Tool loop: resolve all tool calls before streaming final response
    let conversationMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        tools: agentTools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as Anthropic.Tool['input_schema'],
        })),
        messages: conversationMessages,
      })

      // Check if response contains tool use
      const hasToolUse = response.content.some(block => block.type === 'tool_use')

      if (!hasToolUse) {
        // No more tool calls — we can stream the final text response
        break
      }

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            supabase,
            user.id
          )
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        }
      }

      // Append assistant response + tool results to conversation
      conversationMessages = [
        ...conversationMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ]
    }

    // Stream the final response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            tools: agentTools.map(t => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema as Anthropic.Tool['input_schema'],
            })),
            messages: conversationMessages,
          })

          for await (const event of streamResponse) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const data = JSON.stringify({ type: 'text_delta', text: event.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Streaming failed'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Agent chat error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
