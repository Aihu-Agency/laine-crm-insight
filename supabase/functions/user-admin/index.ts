
/**
 * User Admin Edge Function
 * Actions: list, create, update, delete
 * Only accessible to authenticated admins.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Action =
  | { action: "list" }
  | {
      action: "create";
      payload: { email: string; password: string; first_name?: string; last_name?: string; is_admin?: boolean };
    }
  | {
      action: "update";
      payload: {
        user_id: string;
        email?: string;
        password?: string;
        first_name?: string;
        last_name?: string;
        is_admin?: boolean;
      };
    }
  | { action: "delete"; payload: { user_id: string } };

function getClients(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  // Client bound to caller's JWT for verifying identity/role
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  // Admin client for privileged operations
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  return { userClient, adminClient };
}

async function ensureAdmin(userClient: any, adminClient: any) {
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  const userId = userData.user.id;

  // Check admin role using security definer function (or user_roles)
  const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (roleErr) {
    console.error("has_role error", roleErr);
    return { ok: false, status: 500, message: "Role check failed" };
  }
  if (!isAdmin) {
    return { ok: false, status: 403, message: "Forbidden: admin only" };
  }
  return { ok: true, userId };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Action;
    const { userClient, adminClient } = getClients(req);

    const adminCheck = await ensureAdmin(userClient, adminClient);
    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.message }), {
        status: adminCheck.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle actions
    if (body.action === "list") {
      // 1) list auth users (email + id)
      const { data: listRes, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) {
        console.error("listUsers error", listErr);
        return new Response(JSON.stringify({ error: "Failed to list users" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const authUsers = listRes?.users ?? [];

      // 2) load profiles and roles
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        adminClient.from("profiles").select("*"),
        adminClient.from("user_roles").select("user_id, role"),
      ]);

      if (pErr || rErr) {
        console.error("profiles/roles error", { pErr, rErr });
        return new Response(JSON.stringify({ error: "Failed to load profiles/roles" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const rolesMap = new Map<string, string[]>();
      (roles ?? []).forEach((row: any) => {
        const arr = rolesMap.get(row.user_id) ?? [];
        arr.push(row.role);
        rolesMap.set(row.user_id, arr);
      });

      const profilesMap = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => profilesMap.set(p.id, p));

      const combined = authUsers.map((u: any) => {
        const p = profilesMap.get(u.id) || {};
        const userRoles = rolesMap.get(u.id) || [];
        return {
          id: u.id,
          email: u.email,
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          last_login: p.last_login ?? null,
          is_admin: userRoles.includes("admin"),
          created_at: p.created_at ?? null,
        };
      });

      // Sort by first_name, last_name
      combined.sort((a: any, b: any) => {
        const af = (a.first_name || "").toLowerCase();
        const bf = (b.first_name || "").toLowerCase();
        if (af === bf) {
          const al = (a.last_name || "").toLowerCase();
          const bl = (b.last_name || "").toLowerCase();
          return al.localeCompare(bl);
        }
        return af.localeCompare(bf);
      });

      return new Response(JSON.stringify({ users: combined }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "create") {
      const { email, password, first_name, last_name, is_admin } = body.payload;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: created, error: cErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name },
      });

      if (cErr || !created?.user) {
        console.error("createUser error", cErr);
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const newUserId = created.user.id;

      // Ensure profile has names (trigger should have done this, but update to be safe)
      if (first_name || last_name) {
        await adminClient.from("profiles").update({ first_name, last_name }).eq("id", newUserId);
      }

      if (is_admin) {
        // insert admin role if not present
        await adminClient.from("user_roles").insert({ user_id: newUserId, role: "admin" });
      }

      return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "update") {
      const { user_id, email, password, first_name, last_name, is_admin } = body.payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (email || password || first_name || last_name) {
        const adminUpdatePayload: any = {};
        if (email) adminUpdatePayload.email = email;
        if (password) adminUpdatePayload.password = password;
        if (first_name || last_name) {
          adminUpdatePayload.user_metadata = { first_name, last_name };
        }

        if (Object.keys(adminUpdatePayload).length > 0) {
          const { error: uErr } = await adminClient.auth.admin.updateUserById(user_id, adminUpdatePayload);
          if (uErr) {
            console.error("updateUserById error", uErr);
            return new Response(JSON.stringify({ error: "Failed to update auth user" }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        }

        // Update profile fields to mirror metadata
        if (first_name !== undefined || last_name !== undefined) {
          await adminClient
            .from("profiles")
            .update({ first_name, last_name, updated_at: new Date().toISOString() })
            .eq("id", user_id);
        }
      }

      if (typeof is_admin === "boolean") {
        if (is_admin) {
          await adminClient
            .from("user_roles")
            .insert({ user_id, role: "admin" })
            .then(async ({ error }) => {
              if (error && !String(error.message).includes("duplicate key")) {
                console.error("insert admin role error", error);
              }
            });
        } else {
          await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "delete") {
      const { user_id } = body.payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const { error: dErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (dErr) {
        console.error("deleteUser error", dErr);
        return new Response(JSON.stringify({ error: "Failed to delete user" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("Unhandled error in user-admin function", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
