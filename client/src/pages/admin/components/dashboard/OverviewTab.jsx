import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Home, UserCheck } from "lucide-react";
import { ActivityChart } from "./ActivityChart";
import { ItemList } from "./ItemList";

const DashboardCard = ({ title, value, description, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export const OverviewTab = ({ overallStats, messageStats, roomStats }) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Total Users"
        value={overallStats.totalUsers}
        description={`${overallStats.activeUsersPercentage}% active users`}
        icon={Users}
      />
      <DashboardCard
        title="Active Users"
        value={overallStats.activeUsers}
        description="Active in last 7 days"
        icon={UserCheck}
      />
      <DashboardCard
        title="Total Rooms"
        value={overallStats.totalRooms}
        description="Active chat rooms"
        icon={Home}
      />
      <DashboardCard
        title="Total Messages"
        value={overallStats.totalMessages}
        description="Messages exchanged"
        icon={MessageCircle}
      />
    </div>

    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <ActivityChart data={messageStats.messagesByDay} />
      <ItemList
        title="Top Active Rooms"
        items={roomStats.roomsWithMessageCount.slice(0, 5)}
        icon={Home}
        primaryKey="name"
        secondaryKey="messageCount"
        secondaryLabel="messages"
      />
    </div>
  </div>
);
