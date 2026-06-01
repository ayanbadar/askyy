import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Conversation } from "@/data/dashboardTypes";
import { cn } from "@/lib/utils";

type RecentConversationsProps = {
  conversations: Conversation[];
  showUserColumn?: boolean;
  title?: string;
  description?: string;
};

const statusStyles: Record<Conversation["status"], string> = {
  resolved: "bg-chart-4/15 text-chart-4",
  active: "bg-primary/15 text-primary",
  escalated: "bg-destructive/15 text-destructive",
};

const statusLabels: Record<Conversation["status"], string> = {
  resolved: "Resolved",
  active: "Active",
  escalated: "Escalated",
};

export function RecentConversations({
  conversations,
  showUserColumn = false,
  title = "Recent conversations",
  description = "Latest chatbot interactions",
}: RecentConversationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {showUserColumn && (
                  <th className="px-4 pb-3 font-normal">User</th>
                )}
                <th className="px-4 pb-3 font-normal">Topic</th>
                <th className="px-4 pb-3 font-normal">Messages</th>
                <th className="px-4 pb-3 font-normal">Status</th>
                <th className="px-4 pb-3 font-normal">Rating</th>
                <th className="px-4 pb-3 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length === 0 && (
                <tr>
                  <td
                    colSpan={showUserColumn ? 6 : 5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No conversations yet. Start a chat to see activity here.
                  </td>
                </tr>
              )}
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="border-b last:border-0">
                  {showUserColumn && (
                    <td className="px-4 py-3 font-medium">
                      {conversation.user ?? "—"}
                    </td>
                  )}
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                    {conversation.topic}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {conversation.messages}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        statusStyles[conversation.status],
                      )}
                    >
                      {statusLabels[conversation.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {conversation.satisfaction !== null
                      ? `${conversation.satisfaction}/5`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {conversation.timeAgo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
