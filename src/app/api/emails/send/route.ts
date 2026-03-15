import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json()
    
    if (!process.env.RESEND_API_KEY) {
       console.log('Mocking Email Send to:', to)
       // Wait a little to simulate network
       await new Promise(resolve => setTimeout(resolve, 800))
       return NextResponse.json({ success: true, mocked: true })
    }

    const { data, error } = await resend.emails.send({
      from: 'FGB App <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
