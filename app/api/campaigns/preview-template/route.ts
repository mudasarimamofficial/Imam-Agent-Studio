import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const { templates, leadMock } = await req.json();
    if (!templates) {
      return NextResponse.json({ success: false, error: { message: "Templates are required" } }, { status: 400 });
    }

    const mock = leadMock || {
      business_name: "Mockingbird Cafe",
      website_url: "https://mockingbirdcafe.com",
      agent_name: process.env.AGENT_NAME || "Muzamil Imam"
    };

    const render = (tmpl: string) => {
      if (!tmpl) return '';
      return tmpl
        .replace(/\{\{business_name\}\}/g, mock.business_name)
        .replace(/\{\{website_url\}\}/g, mock.website_url)
        .replace(/\{\{agent_name\}\}/g, mock.agent_name);
    };

    const preview = {
      email: {
        subject: render(templates.email?.subject || ''),
        body: render(templates.email?.body || '')
      },
      whatsapp: render(templates.whatsapp || ''),
      instagram: render(templates.instagram || '')
    };

    return NextResponse.json({ success: true, data: preview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
