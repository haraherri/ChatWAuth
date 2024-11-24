import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "./dashboard/UsersTab";
import { OverviewTab } from "./dashboard/OverviewTab";
import { useDashboardData } from "@/hooks/useDashboardData";
import { RoomsTab } from "./dashboard/RoomsTab";
import { MessagesTab } from "./dashboard/MessagesTab";
import { ErrorState } from "./dashboard/ErrorState";
import { RefreshButton } from "./dashboard/RefreshButton";
import { TabContentSkeleton } from "./dashboard/Skeleton";

const Dashboard = () => {
  const {
    overallStats,
    userStats,
    messageStats,
    roomStats,
    loading,
    error,
    refetch,
  } = useDashboardData();

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <RefreshButton onRefresh={refetch} loading={loading} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        {loading ? (
          <TabContentSkeleton />
        ) : (
          <>
            <TabsContent value="overview">
              <OverviewTab
                overallStats={overallStats}
                messageStats={messageStats}
                roomStats={roomStats}
              />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab userStats={userStats} />
            </TabsContent>
            <TabsContent value="messages">
              <MessagesTab messageStats={messageStats} />
            </TabsContent>
            <TabsContent value="rooms">
              <RoomsTab roomStats={roomStats} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;
