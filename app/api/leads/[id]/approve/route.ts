import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { deliverEmail } from '@/lib/hunt/delivery';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id: leadId } = await params;
  if (!leadId) {
    return NextResponse.json({ success: false, error: { message: "lead ID is required" } }, { status: 400 });
  }

  try {
    const { data: lead, error: readErr } = await supabase
      .from("hunt_leads")
      .select("*")
      .eq("place_id", leadId)
      .single();

    if (readErr || !lead) {
      return NextResponse.json({ success: false, error: { message: "Lead not found" } }, { status: 404 });
    }

    // Extract subject/body from msg_email
    const msgEmail = lead.msg_email || lead.msgEmail || "";
    if (!msgEmail) {
      return NextResponse.json({ success: false, error: { message: "No email template generated for this lead yet" } }, { status: 400 });
    }

    const emailLines = msgEmail.split("\n\n");
    const subject = emailLines[0] || `Website performance suggestion for ${lead.business_name}`;
    const body = emailLines.slice(1).join("\n\n") || msgEmail;

    const recipient = lead.email || "onboarding@resend.dev";
    
    // Deliver outbox email
    const deliveryResult = await deliverEmail(recipient, subject, body);

    if (!deliveryResult.success) {
      // Mark as failed
      await supabase
        .from("hunt_leads")
        .update({
          status: 'failed',
          error_log: deliveryResult.error || "Resend outbox failed",
          updated_at: new Date().toISOString()
        })
        .eq("place_id", leadId);

      return NextResponse.json({
        success: false,
        error: { message: deliveryResult.error || "Email delivery failed" }
      }, { status: 500 });
    }

    // Update status to completed / sent
    await supabase
      .from("hunt_leads")
      .update({
        status: 'completed',
        last_contacted: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("place_id", leadId);

    // Save action log to memories
    await supabase.from("memories").insert({
      user_id: user.id,
      agent_label: "OUTREACH_ENGINE",
      type: "output",
      content: `Approved and sent outreach to ${lead.business_name} (${recipient}). Message ID: ${deliveryResult.messageId}`,
    });

    return NextResponse.json({ success: true, data: { status: 'completed' } });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
