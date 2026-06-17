import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabase = await createClient();

    const { type, data } = payload;
    if (!type || !data || !data.email_id) {
      return NextResponse.json({ success: false, error: "Invalid payload format" }, { status: 400 });
    }

    console.log(`[RESEND WEBHOOK] Event received: ${type} for email ${data.email_id}`);

    // Log the event to memories/reflection
    await supabase.from("memories").insert({
      user_id: "system",
      agent_label: "OUTREACH_ENGINE",
      type: "reflection",
      content: `Resend event "${type}" logged for message ${data.email_id}. Subject: "${data.subject || 'N/A'}"`,
    });

    // Update statuses if there are matching leads (based on email / place_id)
    if (type === 'email.bounced' || type === 'email.delivery_failed') {
      const emailRecipient = data.to?.[0];
      if (emailRecipient) {
        await supabase
          .from("hunt_leads")
          .update({
            status: 'failed',
            error_log: `Resend webhook bounce: ${type}`,
            updated_at: new Date().toISOString()
          })
          .eq("email", emailRecipient);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
