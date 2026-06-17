import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { 
  getFallbackABTests, 
  saveFallbackABTest, 
  ABTest 
} from '@/lib/campaign/runner';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    let tests: ABTest[] = [];
    try {
      const { data, error } = await supabase
        .from("ab_tests")
        .select("*")
        .eq("campaign_id", id);
      if (!error && data) {
        tests = data;
      } else {
        tests = getFallbackABTests(id);
      }
    } catch {
      tests = getFallbackABTests(id);
    }

    return NextResponse.json({ success: true, data: tests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    if (!body.variant_name || !body.subject || !body.body) {
      return NextResponse.json({ success: false, error: { message: "variant_name, subject, and body are required" } }, { status: 400 });
    }

    const testId = "ab_" + Math.random().toString(36).substring(2, 9);
    const newTest: ABTest = {
      id: testId,
      campaign_id: id,
      variant_name: body.variant_name,
      subject: body.subject,
      body: body.body,
      sent_count: 0,
      reply_count: 0,
      status: 'active'
    };

    try {
      const { error } = await supabase
        .from("ab_tests")
        .insert(newTest);
      if (error) throw error;
    } catch {
      saveFallbackABTest(newTest);
    }

    return NextResponse.json({ success: true, data: newTest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
