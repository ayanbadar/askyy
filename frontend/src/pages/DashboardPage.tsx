import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Protected route — only visible when authenticated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details from the API</CardDescription>
        </CardHeader>
        <CardContent>
          <dl>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">{user?.username}</dd>
            </div>
            <Separator />
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <Separator />
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
