export default async function handler(req: any, res: any): Promise<void> {
  const send = (status: number, body: unknown) => {
    res.status(status).json(body)
  }

  if (req.method !== 'POST') {
    send(405, { error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.TINY_PROMPT_TO_EMAIL
  const fromEmail = process.env.TINY_PROMPT_FROM_EMAIL ?? 'hypeCAT <onboarding@resend.dev>'

  if (!apiKey || !toEmail) {
    send(500, { error: 'Email integration is not configured on the server' })
    return
  }

  try {
    const rawBody = req.body
    const payload = (typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody ?? {}) as {
      cardId?: string
      prompt?: string
      answer?: string
    }

    const cardId = String(payload.cardId ?? '').slice(0, 32)
    const prompt = String(payload.prompt ?? '').trim().slice(0, 500)
    const answer = String(payload.answer ?? '').trim().slice(0, 2000)

    if (!cardId || !answer) {
      send(400, { error: 'Missing cardId or answer' })
      return
    }

    const nowIso = new Date().toISOString()
    const subject = `hypeCAT tiny prompt (${cardId})`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        text: [
          'A tiny prompt was answered in hypeCAT.',
          `Time: ${nowIso}`,
          `Card: ${cardId}`,
          `Prompt: ${prompt || '(not provided)'}`,
          '',
          'Answer:',
          answer,
        ].join('\n'),
      }),
    })

    if (!resendResponse.ok) {
      const message = await resendResponse.text()
      send(502, { error: 'Resend request failed', details: message })
      return
    }

    send(200, { ok: true })
  } catch {
    send(400, { error: 'Invalid request body' })
  }
}
