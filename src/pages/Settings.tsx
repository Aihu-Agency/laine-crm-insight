import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const users = [
    {
      id: 1,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@lainehomes.com",
      lastLogin: "2024-01-29 14:30",
      isAdmin: true
    },
    {
      id: 2,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@lainehomes.com",
      lastLogin: "2024-01-29 09:15",
      isAdmin: false
    },
    {
      id: 3,
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@lainehomes.com",
      lastLogin: "2024-01-28 16:45",
      isAdmin: false
    },
    {
      id: 4,
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.davis@lainehomes.com",
      lastLogin: "2024-01-29 11:20",
      isAdmin: true
    },
    {
      id: 5,
      firstName: "David",
      lastName: "Wilson",
      email: "david.wilson@lainehomes.com",
      lastLogin: "2024-01-27 13:10",
      isAdmin: false
    },
    {
      id: 6,
      firstName: "Lisa",
      lastName: "Anderson",
      email: "lisa.anderson@lainehomes.com",
      lastLogin: "2024-01-29 08:45",
      isAdmin: false
    }
  ];

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
                <Input id="firstName" defaultValue="Current User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="user@lainehomes.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="Leave blank to keep current password" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;