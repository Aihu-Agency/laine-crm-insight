
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type UserRow = {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  last_login: string | null;
  is_admin: boolean;
};

const Settings = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserId(session?.user?.id ?? null);
      setCurrentEmail(session?.user?.email ?? "");
    });
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
      setCurrentEmail(data.session?.user?.email ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .then(({ data }) => {
        const admin = (data ?? []).some((r) => r.role === "admin");
        setIsAdmin(admin);
      });
  }, [currentUserId]);

  const fetchUsers = async (): Promise<UserRow[]> => {
    const { data, error } = await supabase.functions.invoke("user-admin", {
      body: { action: "list" },
    });
    if (error) throw error;
    return (data?.users ?? []) as UserRow[];
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const createUser = useMutation({
    mutationFn: async (payload: { email: string; password: string; first_name?: string; last_name?: string; is_admin?: boolean }) => {
      const { error } = await supabase.functions.invoke("user-admin", {
        body: { action: "create", payload },
      });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    meta: { onError: (_: unknown) => {} },
  });

  const updateUser = useMutation({
    mutationFn: async (payload: { user_id: string; email?: string; password?: string; first_name?: string; last_name?: string; is_admin?: boolean }) => {
      const { error } = await supabase.functions.invoke("user-admin", {
        body: { action: "update", payload },
      });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    meta: { onError: (_: unknown) => {} },
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.functions.invoke("user-admin", {
        body: { action: "delete", payload: { user_id } },
      });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    meta: { onError: (_: unknown) => {} },
  });

  // Form state for add/edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", is_admin: false });

  useEffect(() => {
    if (editing) {
      setForm({
        email: editing.email ?? "",
        password: "",
        first_name: editing.first_name ?? "",
        last_name: editing.last_name ?? "",
        is_admin: editing.is_admin,
      });
    } else {
      setForm({ email: "", password: "", first_name: "", last_name: "", is_admin: false });
    }
  }, [editing]);

  const canSeeUserManagement = isAdmin;

  const onOpenAdd = () => {
    setEditing(null);
    setForm({ email: "", password: "", first_name: "", last_name: "", is_admin: false });
    setDialogOpen(true);
  };

  const onOpenEdit = (u: UserRow) => {
    setEditing(u);
    setDialogOpen(true);
  };

  const onSubmitForm = async () => {
    if (editing) {
      await updateUser.mutateAsync({
        user_id: editing.id,
        email: form.email || undefined,
        password: form.password || undefined,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        is_admin: form.is_admin,
      });
      toast({ title: "User updated" });
    } else {
      if (!form.email || !form.password) {
        toast({ title: "Email and password required", variant: "destructive" });
        return;
      }
      await createUser.mutateAsync({
        email: form.email,
        password: form.password,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        is_admin: form.is_admin,
      });
      toast({ title: "User created" });
    }
    setDialogOpen(false);
  };

  const onDelete = async (u: UserRow) => {
    if (currentUserId === u.id) {
      toast({ title: "You cannot delete yourself", variant: "destructive" });
      return;
    }
    await deleteUser.mutateAsync(u.id);
    toast({ title: "User deleted" });
  };

  // Profile form (current user only, uses direct table access)
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile({
          first_name: data?.first_name ?? "",
          last_name: data?.last_name ?? "",
        });
      });
  }, [currentUserId]);

  const saveProfile = async () => {
    if (!currentUserId) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", currentUserId);
    if (error) {
      toast({ title: "Failed to save profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-laine-grey">
      <Navigation />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* User Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.first_name}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.last_name}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={currentEmail} readOnly placeholder="-" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={updatePassword}>Update Password</Button>
              <Button onClick={saveProfile}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management Section - Admin only */}
        {canSeeUserManagement && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all users in the system</CardDescription>
              </div>
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setEditing(null);
                    setForm({ email: "", password: "", first_name: "", last_name: "", is_admin: false });
                  } else if (!editing) {
                    setForm({ email: "", password: "", first_name: "", last_name: "", is_admin: false });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={onOpenAdd}>Add User</Button>
                </DialogTrigger>
                <DialogContent key={editing ? editing.id : "add"}>
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{editing ? "New Password (optional)" : "Password"}</Label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder={editing ? "Leave blank to keep" : "Enter password"}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First name</Label>
                        <Input
                          value={form.first_name}
                          onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last name</Label>
                        <Input
                          value={form.last_name}
                          onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="is_admin"
                        type="checkbox"
                        className="h-4 w-4"
                        checked={form.is_admin}
                        onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                      />
                      <Label htmlFor="is_admin">Admin</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={onSubmitForm}>{editing ? "Save" : "Create"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.first_name}</TableCell>
                        <TableCell>{user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? "default" : "secondary"}>
                            {user.is_admin ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => onOpenEdit(user)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onDelete(user)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
