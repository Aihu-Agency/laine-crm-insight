// Send Daily Task Reminder Emails
// Triggered by pg_cron weekday mornings (04:00 & 05:00 UTC) OR manually by an admin via the Settings UI.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const APP_URL = "https://laine-crm-insight.lovable.app";
const FROM_ADDRESS = "Laine Homes CRM <onboarding@resend.dev>";

// === TEST MODE ===
// While Resend domain is not yet verified, all emails are routed to TEST_REDIRECT_TO.
// Each email shows a clearly visible banner explaining who it WOULD have gone to in production.
// To go live: set TEST_MODE = false and update FROM_ADDRESS to a verified-domain address.
const TEST_MODE = true;
const TEST_REDIRECT_TO = "mikko.tuominen+laineresend@aihuagency.com";

interface AirtableAction {
  id: string;
  fields: Record<string, any>;
}

interface AirtableCustomer {
  id: string;
  fields: Record<string, any>;
}

// Get current Helsinki date as YYYY-MM-DD
function helsinkiToday(): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // sv-SE produces YYYY-MM-DD
}

function helsinkiHumanDate(): string {
  const fmt = new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  return fmt.format(new Date());
}

// Helsinki hour for safety guard against duplicate cron runs across DST
function helsinkiHour(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(fmt.format(new Date()), 10);
}

async function fetchAirtable(path: string, token: string, baseId: string): Promise<any> {
  const url = `https://api.airtable.com/v0/${baseId}/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Airtable ${res.status}: ${txt}`);
  }
  return await res.json();
}

async function fetchAllPages(table: string, query: string, token: string, baseId: string): Promise<AirtableAction[]> {
  const records: AirtableAction[] = [];
  let offset = "";
  do {
    const sep = query.includes("?") ? "&" : "?";
    const path = `${table}${query}${offset ? `${sep}offset=${offset}` : ""}`;
    const data = await fetchAirtable(path, token, baseId);
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);
  return records;
}

function buildEmailHtml(
  salespersonFirstName: string,
  dateText: string,
  items: Array<{
    description: string;
    customerName: string;
    customerAirtableId: string;
  }>,
  intendedRecipient?: string,
): string {
  const taskListHtml = items
    .map((it) => {
      const desc = (it.description || "(ei kuvausta)").replace(/</g, "&lt;");
      const cname = (it.customerName || "Tuntematon asiakas").replace(/</g, "&lt;");
      const link = `${APP_URL}/customer/${encodeURIComponent(it.customerAirtableId)}`;
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <a href="${link}" style="text-decoration: none; color: #1e3a5f; font-weight: 600; font-size: 15px;">
              ${cname}
            </a>
            <div style="color: #475569; font-size: 14px; margin-top: 4px; line-height: 1.5;">
              ${desc}
            </div>
          </td>
        </tr>`;
    })
    .join("");

  const testBanner = TEST_MODE && intendedRecipient
    ? `
          <tr>
            <td style="background:#fef3c7; border-bottom:2px solid #f59e0b; padding:14px 32px; color:#78350f; font-size:13px;">
              <strong>⚠️ TESTITILA</strong> — Tuotannossa tämä meili olisi lähetetty:
              <strong>${(salespersonFirstName || "").replace(/</g, "&lt;")}</strong>
              (<code style="background:#fde68a; padding:1px 5px; border-radius:3px;">${intendedRecipient.replace(/</g, "&lt;")}</code>)
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Päivän tehtävät</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:#1e3a5f; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:600;">Laine Homes CRM</h1>
              <p style="margin:4px 0 0 0; color:#cbd5e1; font-size:14px;">Päivän tehtävät — ${dateText}</p>
            </td>
          </tr>
          ${testBanner}
          <tr>
            <td style="padding: 32px;">
              <p style="margin:0 0 16px 0; font-size:16px;">Hei ${salespersonFirstName.replace(/</g, "&lt;")},</p>
              <p style="margin:0 0 24px 0; font-size:15px; color:#334155;">
                Sinulla on tänään <strong>${items.length} ${items.length === 1 ? "tehtävä" : "tehtävää"}</strong>:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${taskListHtml}
              </table>
              <div style="margin-top: 32px; text-align:center;">
                <a href="${APP_URL}" style="display:inline-block; background:#1e3a5f; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
                  Avaa CRM →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 24px; text-align:center; color:#94a3b8; font-size:12px;">
              Tämä on automaattinen aamumuistutus.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendResendEmail(to: string, subject: string, html: string, apiKey: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const airtableToken = Deno.env.get("AIRTABLE_API_KEY")!;
  const airtableBaseId = Deno.env.get("AIRTABLE_BASE_ID")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Auth: cron secret OR admin user ---
  const cronHeader = req.headers.get("x-cron-secret") || "";
  const isCron = cronSecret && cronHeader === cronSecret;
  let isAdminTest = false;
  let adminUserEmail: string | null = null;

  if (!isCron) {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    adminUserEmail = (claimsData.claims.email as string) || null;

    // Check admin role using service client
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    isAdminTest = true;
  }

  // Determine mode
  let mode: "cron" | "test" = isCron ? "cron" : "cron";
  let testRecipient: string | null = null;
  if (isAdminTest) {
    try {
      const body = await req.json();
      if (body && body.test === true) {
        mode = "test";
        testRecipient = body.recipient || adminUserEmail;
      }
    } catch {
      // No body provided — treat admin call as a real run
    }
  }

  // Safety: skip cron run if Helsinki time is way past 7am window (avoid duplicates)
  if (mode === "cron") {
    const hour = helsinkiHour();
    if (hour < 6 || hour > 8) {
      console.log(`[send-daily-task-emails] Skipping cron run, Helsinki hour=${hour} outside 6-8 window`);
      return new Response(JSON.stringify({ skipped: true, reason: "outside_window", hour }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const todayHelsinki = helsinkiToday();
  const dateText = helsinkiHumanDate();

  try {
    // 1. Fetch salespeople: profiles + auth.users emails
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name");
    if (profilesError) throw profilesError;

    const { data: usersList, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersError) throw usersError;

    const emailById = new Map<string, string>();
    for (const u of usersList.users) {
      if (u.id && u.email) emailById.set(u.id, u.email);
    }

    type Salesperson = { fullName: string; firstName: string; email: string };
    const salespeople: Salesperson[] = [];
    for (const p of profiles || []) {
      const email = emailById.get(p.id);
      if (!email) continue;
      const first = (p.first_name || "").trim();
      const last = (p.last_name || "").trim();
      const fullName = `${first} ${last}`.trim();
      if (!fullName) continue;
      salespeople.push({ fullName, firstName: first || fullName, email });
    }

    // 2. Fetch today's pending Customer Actions from Airtable
    // Filter: IS_SAME({Action Date}, TODAY(), 'day') AND {Completed} != 'Done'
    // Use Helsinki-aware boundaries via direct date comparison string
    const filter = `AND(DATESTR({Action Date}) = '${todayHelsinki}', {Completed} != 'Done')`;
    const query = `?filterByFormula=${encodeURIComponent(filter)}&pageSize=100`;
    const actions = await fetchAllPages("Customer%20Actions", query, airtableToken, airtableBaseId);

    // 3. Collect linked customer IDs and fetch in batches
    const customerIds = new Set<string>();
    for (const a of actions) {
      const linked = a.fields?.Customer;
      if (Array.isArray(linked)) linked.forEach((id: string) => customerIds.add(id));
    }

    const customersById = new Map<string, AirtableCustomer>();
    const idsArr = Array.from(customerIds);
    // Fetch each customer record individually (API is fine for small daily volumes)
    await Promise.all(
      idsArr.map(async (id) => {
        try {
          const data = await fetchAirtable(`Customers/${id}`, airtableToken, airtableBaseId);
          customersById.set(id, data);
        } catch (e) {
          console.warn(`[send-daily-task-emails] Could not fetch customer ${id}:`, e);
        }
      }),
    );

    // 4. Group actions by salesperson (case-insensitive name match on Customer.Sales person)
    type TaskItem = { description: string; customerName: string; customerAirtableId: string };
    const grouped = new Map<string, TaskItem[]>(); // key: lowercased fullName
    for (const sp of salespeople) {
      grouped.set(sp.fullName.toLowerCase(), []);
    }

    for (const action of actions) {
      const linked = action.fields?.Customer;
      if (!Array.isArray(linked) || linked.length === 0) continue;
      const customerId = linked[0];
      const customer = customersById.get(customerId);
      if (!customer) continue;
      const sp = (customer.fields?.["Sales person"] || "").toString().trim();
      if (!sp) continue;
      const key = sp.toLowerCase();
      const bucket = grouped.get(key);
      if (!bucket) continue;
      const customerName = `${customer.fields?.["First name"] || ""} ${customer.fields?.["Last name"] || ""}`.trim() || "Tuntematon asiakas";
      bucket.push({
        description: (action.fields?.["Action Description"] || "").toString(),
        customerName,
        customerAirtableId: customerId,
      });
    }

    // 5. Send emails
    const summary: Array<{ recipient: string; status: string; count: number; error?: string }> = [];

    if (mode === "test") {
      // Test mode: send ONE email to the admin (or TEST_REDIRECT_TO when in test mode) with the first non-empty bucket or sample data
      const intendedRecipient = testRecipient || adminUserEmail || "admin@example.com";
      const actualRecipient = TEST_MODE ? TEST_REDIRECT_TO : intendedRecipient;
      // Pick first non-empty bucket OR fall back to sample
      let items: TaskItem[] = [];
      let firstName = "Testi";
      let intendedFullName = intendedRecipient;
      for (const sp of salespeople) {
        const bucket = grouped.get(sp.fullName.toLowerCase()) || [];
        if (bucket.length > 0) {
          items = bucket;
          firstName = sp.firstName;
          intendedFullName = sp.fullName;
          break;
        }
      }
      if (items.length === 0) {
        items = [
          { description: "Esimerkkitehtävä — ei oikeita tehtäviä tänään", customerName: "Esimerkkiasiakas", customerAirtableId: "rec000" },
        ];
      }
      const subject = `[TESTI] Päivän tehtävät — ${dateText} (${items.length} ${items.length === 1 ? "tehtävä" : "tehtävää"})`;
      const html = buildEmailHtml(firstName, dateText, items, TEST_MODE ? `${intendedFullName} → ${intendedRecipient}` : undefined);
      try {
        await sendResendEmail(actualRecipient, subject, html, resendApiKey);
        summary.push({ recipient: actualRecipient, status: "sent", count: items.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        summary.push({ recipient: actualRecipient, status: "failed", count: items.length, error: msg });
      }
      return new Response(JSON.stringify({ mode: "test", date: todayHelsinki, test_mode: TEST_MODE, summary }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real run — send one email per salesperson with ≥1 task
    for (const sp of salespeople) {
      const items = grouped.get(sp.fullName.toLowerCase()) || [];
      if (items.length === 0) continue;

      // Idempotency check: skip if already logged as 'sent' today (uses intended recipient = salesperson email, not the redirected test address)
      const { data: existing } = await adminClient
        .from("email_send_log")
        .select("id, status")
        .eq("email_type", "daily_tasks")
        .eq("recipient_email", sp.email)
        .eq("send_date", todayHelsinki)
        .maybeSingle();
      if (existing && existing.status === "sent") {
        summary.push({ recipient: sp.email, status: "skipped", count: items.length });
        continue;
      }

      const baseSubject = `Päivän tehtävät — ${dateText} (${items.length} ${items.length === 1 ? "tehtävä" : "tehtävää"})`;
      const subject = TEST_MODE ? `[TESTI → ${sp.firstName}] ${baseSubject}` : baseSubject;
      const html = buildEmailHtml(sp.firstName, dateText, items, TEST_MODE ? `${sp.fullName} → ${sp.email}` : undefined);
      const actualRecipient = TEST_MODE ? TEST_REDIRECT_TO : sp.email;

      try {
        await sendResendEmail(actualRecipient, subject, html, resendApiKey);
        await adminClient.from("email_send_log").upsert(
          {
            email_type: "daily_tasks",
            recipient_email: sp.email,
            send_date: todayHelsinki,
            task_count: items.length,
            status: "sent",
            error_message: TEST_MODE ? `TEST_MODE: redirected to ${TEST_REDIRECT_TO}` : null,
          },
          { onConflict: "email_type,recipient_email,send_date" },
        );
        summary.push({ recipient: sp.email, status: "sent", count: items.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await adminClient.from("email_send_log").upsert(
          {
            email_type: "daily_tasks",
            recipient_email: sp.email,
            send_date: todayHelsinki,
            task_count: items.length,
            status: "failed",
            error_message: msg.slice(0, 500),
          },
          { onConflict: "email_type,recipient_email,send_date" },
        );
        summary.push({ recipient: sp.email, status: "failed", count: items.length, error: msg });
      }
    }

    console.log(`[send-daily-task-emails] Done. Date=${todayHelsinki}, mode=${mode}, sent=${summary.filter(s => s.status === "sent").length}`);
    return new Response(JSON.stringify({ mode, date: todayHelsinki, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-daily-task-emails] Fatal error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
