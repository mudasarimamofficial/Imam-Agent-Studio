import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id: leadId } = await params;
  try {
    const { reason } = await req.json();

    const { error } = await supabase
      .from("hunt_leads")
      .update({
        status: 'failed',
        error_log: reason || "Rejected by operator",
        updated_at: new Date().toISOString()
      })
      .eq("place_id", leadId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
