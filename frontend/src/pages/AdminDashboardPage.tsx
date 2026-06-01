import { FileText, MessageSquare, Star, Timer, Zap } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { KnowledgeSources } from "@/components/dashboard/KnowledgeSources";
import { ModelUsage } from "@/components/dashboard/ModelUsage";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { ResponseBreakdown } from "@/components/dashboard/ResponseBreakdown";
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
import { useAdminDashboardQuery } from "@/hooks/useDashboard";

export function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboardQuery();

  if (dashboardQuery.isLoading) {
    return <LoadingState label="Loading admin dashboard…" className="py-16" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load admin dashboard</CardTitle>
          <CardDescription>
            {dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "Something went wrong while fetching platform metrics."}
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

  const {
    stats,
    weeklyActivity,
    recentConversations,
    topTopics,
    responseBreakdown,
    knowledgeSources,
    modelUsage,
    totalChunks,
  } = dashboardQuery.data;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Admin dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Platform-wide chatbot performance, usage, and knowledge base health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total conversations"
          value={stats.totalConversations.toLocaleString()}
          change={stats.totalConversationsChange}
          icon={MessageSquare}
        />
        <StatCard
          title="Messages today"
          value={stats.messagesToday.toLocaleString()}
          change={stats.messagesTodayChange}
          changeLabel="vs yesterday"
          icon={Zap}
        />
        <StatCard
          title="Avg response time"
          value={
            stats.avgResponseTimeSec !== null
              ? `${stats.avgResponseTimeSec}s`
              : "—"
          }
          change={stats.avgResponseTimeChange ?? undefined}
          changeLabel="vs last week"
          icon={Timer}
          invertTrend
        />
        <StatCard
          title="Satisfaction rate"
          value={
            stats.satisfactionRate !== null ? `${stats.satisfactionRate}%` : "—"
          }
          change={stats.satisfactionChange ?? undefined}
          icon={Star}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityChart data={weeklyActivity} />
        </div>
        <div className="lg:col-span-2">
          <TopTopics topics={topTopics} />
        </div>
      </div>

      <RecentConversations
        conversations={recentConversations}
        showUserColumn
        title="Recent conversations"
        description="Latest chatbot interactions across all users"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <KnowledgeSources
          sources={knowledgeSources}
          totalDocuments={stats.documentsIndexed}
          totalChunks={totalChunks}
        />
        <ResponseBreakdown {...responseBreakdown} />
        <ModelUsage {...modelUsage} tokenUsageToday={stats.tokenUsageToday} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Documents indexed"
          value={stats.documentsIndexed.toLocaleString()}
          change={stats.documentsChange}
          changeFormat="count"
          changeLabel="new this week"
          icon={FileText}
        />
        <StatCard
          title="Token usage today"
          value={`${(stats.tokenUsageToday / 1000).toFixed(0)}k`}
          change={stats.tokenUsageChange}
          changeLabel="vs yesterday"
          icon={Zap}
        />
      </div>
    </section>
  );
}
