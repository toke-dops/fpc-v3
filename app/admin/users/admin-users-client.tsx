"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function AdminUsersClient() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const users = useQuery(api["admin_users"].listAllUsers);
  const updateUser = useMutation(api["admin_users"].updateUser);
  const deleteUser = useMutation(api["admin_users"].deleteUser);
  const setUserAsAdmin = useMutation(api["admin_users"].setUserAsAdmin);
  const createAdminUser = useMutation(api["admin_users"].createAdminUser);

  const [editingUser, setEditingUser] = useState<Id<"users"> | null>(null);
  const [deletingUser, setDeletingUser] = useState<Id<"users"> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    auth_provider_user_id: "",
    role: "club_owner" as "club_owner" | "admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (userId: Id<"users">) => {
    const user = users?.find((u) => u._id === userId);
    if (user) {
      setEditingUser(userId);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await updateUser({
        userId: editingUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteUser({ userId: deletingUser });
      setDeletingUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.auth_provider_user_id || !formData.email || !formData.name) {
      setError("All fields are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAdminUser({
        auth_provider_user_id: formData.auth_provider_user_id,
        email: formData.email,
        name: formData.name,
      });
      setShowCreateDialog(false);
      setFormData({ name: "", email: "", auth_provider_user_id: "", role: "club_owner" });
    } catch (err: any) {
      setError(err.message || "Failed to create admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeAdmin = async (userId: Id<"users">) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await setUserAsAdmin({ userId });
    } catch (err: any) {
      setError(err.message || "Failed to set user as admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading and error states
  if (users === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle query errors (users will be null if query throws an error)
  if (users === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only admins can access user management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Back to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">User Management</h1>
              <p className="text-muted-foreground">
                Manage all users in the system
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Admin User
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No users found.</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="mt-1">{user.email}</CardDescription>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Clerk User ID</p>
                      <p className="font-mono text-xs break-all">{user.auth_provider_user_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Has Listed Club</p>
                      <Badge variant={user.has_listed_club ? "default" : "outline"}>
                        {user.has_listed_club ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Has Claimed Club</p>
                      <Badge variant={user.has_claimed_club ? "default" : "outline"}>
                        {user.has_claimed_club ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user._id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeAdmin(user._id)}
                        disabled={isSubmitting}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Make Admin
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingUser(user._id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as "club_owner" | "admin" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club_owner">Club Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Admin Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user from the current Clerk user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="create-auth-id">Clerk User ID *</Label>
                <Input
                  id="create-auth-id"
                  value={formData.auth_provider_user_id}
                  onChange={(e) => setFormData({ ...formData, auth_provider_user_id: e.target.value })}
                  placeholder="user_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get this from Clerk Dashboard → Users
                </p>
              </div>
              <div>
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAdmin} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deletingUser !== null} onOpenChange={(open) => !open && setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
