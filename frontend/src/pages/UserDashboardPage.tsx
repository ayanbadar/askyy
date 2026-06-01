import { Bookmark, FileText, MessageSquare, Zap } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { MyDocuments } from "@/components/dashboard/MyDocuments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { StatCard } from "@/components/dashboard/StatCard";
import { TopTopics } from "@/components/dashboard/TopTopics";
import { LoadingState } from "@/components/LoadingState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDashboardQuery } from "@/hooks/useDashboard";

export function UserDashboardPage() {
  const { user } = useAuth();
  const dashboardQuery = useUserDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <LoadingState label="Loading dashboard…" className="py-16" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load dashboard</CardTitle>
          <CardDescription>
            {dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "Something went wrong while fetching your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => void dashboardQuery.refetch()}
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const { stats, weeklyActivity, recentConversations, topTopics, documents } =
    dashboardQuery.data;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}. Here&apos;s your
          chatbot activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My conversations"
          value={stats.myConversations.toLocaleString()}
          change={stats.myConversationsChange}
          icon={MessageSquare}
        />
        <StatCard
          title="Messages this week"
          value={stats.messagesThisWeek.toLocaleString()}
          change={stats.messagesThisWeekChange}
          icon={Zap}
        />
        <StatCard
          title="My documents"
          value={stats.myDocuments.toLocaleString()}
          change={stats.myDocumentsChange}
          changeFormat="count"
          changeLabel="new this week"
          icon={FileText}
        />
        <StatCard
          title="Saved answers"
          value={stats.savedAnswers.toLocaleString()}
          change={stats.savedAnswersChange}
          icon={Bookmark}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityChart data={weeklyActivity} />
        </div>
        <div className="lg:col-span-2">
          <TopTopics
            topics={topTopics}
            title="My top questions"
            description="Topics you ask about most"
          />
        </div>
      </div>

      <RecentConversations
        conversations={recentConversations}
        title="Recent chats"
        description="Your latest conversations with the assistant"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MyDocuments documents={documents} />
        <QuickActions />
      </div>
    </section>
  );
}
