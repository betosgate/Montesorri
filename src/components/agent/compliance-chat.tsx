'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from './chat-message'
import { QuickPrompts } from './quick-prompts'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ComplianceChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Handle pending messages (from external triggers like cancel button)
  useEffect(() => {
    if (isOpen && pendingMessage && !isStreaming) {
      const msg = pendingMessage
      setPendingMessage(null)
      sendMessage(msg)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMessage, isStreaming])

  // Listen for custom event to open chat with a message
  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string }>) => {
      setPendingMessage(e.detail.message)
      setIsOpen(true)
    }
    window.addEventListener('open-support-chat', handler as EventListener)
    return () => window.removeEventListener('open-support-chat', handler as EventListener)
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsStreaming(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const assistantId = `msg_${Date.now() + 1}`
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      abortRef.current = new AbortController()
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 30000)

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue

          try {
            const event = JSON.parse(json)
            if (event.type === 'text_delta' && event.text) {
              accumulated += event.text
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
              )
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
          } catch (parseErr) {
            // Skip malformed SSE lines
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }

      // If no text was accumulated, show a fallback
      if (!accumulated) {
        setMessages(prev =>
          prev.map(m => m.id === assistantId
            ? { ...m, content: 'I wasn\'t able to generate a response. Please try again.' }
            : m
          )
        )
      }
    } catch (err) {
      const message = err instanceof Error
        ? err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : err.message
        : 'Something went wrong'

      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: `Sorry, I encountered an error: ${message}` }
          : m
        )
      )
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // Auto-grow textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`
  }

  const clearChat = () => {
    setMessages([])
    setIsStreaming(false)
    abortRef.current?.abort()
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${
          isOpen
            ? 'bg-stone-600 hover:bg-stone-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        aria-label={isOpen ? 'Close support assistant' : 'Open support assistant'}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex w-[400px] max-sm:w-[calc(100vw-1.5rem)] max-sm:right-3 max-sm:bottom-20 flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl max-h-[80vh] max-sm:max-h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-green-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">Support</h3>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                  title="Clear conversation"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '300px', maxHeight: 'calc(80vh - 140px)' }}>
            {messages.length === 0 ? (
              <QuickPrompts onSelect={sendMessage} />
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-stone-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask about compliance or billing..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 disabled:opacity-50"
                style={{ maxHeight: '80px' }}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isStreaming}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition-colors hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-stone-400">
              AI assistant — not legal advice. Verify with your state.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
