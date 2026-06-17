export function buildBrandedEmailHtml(bodyText: string): string {
  const agentName = process.env.AGENT_NAME || "Muzamil Imam";
  const agencyName = process.env.AGENCY_NAME || "ShuMuz Labs";
  const agencyWebsite = process.env.AGENCY_WEBSITE_URL || "https://shumuzlabs.com";
  const logoUrl = process.env.AGENCY_LOGO_URL || "https://cdn.shopify.com/s/files/1/0689/2611/1809/files/ShuMUZ_Labs_logo_icon_19a36d6f-22b7-4318-9c90-a6d9cb1dfb38.png?v=1780939993";
  const logoSrc = `${logoUrl}&width=96`;

  // Format paragraphs
  const paragraphs = bodyText
    .split("\n\n")
    .map(p => `<p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${p.replace(/\n/g, "<br />")}</p>`)
    .join("");

  const initials = agentName.split(" ").map(n => n[0]).join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Outreach Observation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-text-size-adjust: 100%;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 24px 32px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <img src="${logoSrc}" alt="${agencyName} Logo" width="48" style="display: block; border: 0;" />
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <div style="color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; font-weight: bold;">${agencyName}</div>
                    <div style="color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; margin-top: 2px;">Your technical co-founder, on demand</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Accent Line -->
          <tr>
            <td height="4" style="background-color: #00E5FF; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff;">
              ${paragraphs}
              
              <!-- Signature -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px; width: 100%;">
                <tr>
                  <td width="48" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #a3e635; color: #0f1a02; text-align: center; line-height: 40px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; font-weight: bold;">
                      ${initials}
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; font-weight: bold; color: #111827;">${agentName}</div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; color: #6b7280; margin-top: 2px;">Growth &amp; AI Engineer at ${agencyName}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
              <table align="center" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #0A0A0A; border-radius: 6px;">
                    <a href="${agencyWebsite}" target="_blank" style="display: inline-block; padding: 10px 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none;">
                      Visit Our Website &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; color: #9ca3af; margin-top: 24px;">
                &copy; ${new Date().getFullYear()} ${agencyName}. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function deliverEmail(to: string, subject: string, bodyText: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const emailMode = process.env.EMAIL_MODE || "dry_run";
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT || "";

  const html = buildBrandedEmailHtml(bodyText);

  // If in dry run, reroute or skip actual sending
  if (emailMode === 'dry_run') {
    const finalTo = testRecipient || to;
    console.log(`[DRY RUN] Sending email to ${finalTo} (originally: ${to})`);
    console.log(`[DRY RUN] Subject: ${subject}`);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));

    return {
      success: true,
      messageId: `dry_run_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }

  if (!resendApiKey) {
    return {
      success: false,
      error: "Missing RESEND_API_KEY environment configuration"
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      return { success: false, error: `Resend error code ${res.status}: ${txt}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed calling Resend outbox" };
  }
}
