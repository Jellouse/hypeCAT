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
    const now = new Date(nowIso)
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const day = now.getDate()
    const month = monthNames[now.getMonth()]
    const year = now.getFullYear()
    const formattedTime = `${hours}:${minutes}, ${day}. ${month} ${year}`
    const subject = 'HypeCat Reply!'
    const text = [formattedTime, prompt || 'Tiny prompt', `"${answer}"`].join('\n')

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
        text,
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
