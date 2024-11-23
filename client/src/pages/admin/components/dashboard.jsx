import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageCircle,
  Home,
  UserCheck,
  GitBranch,
  Pin,
  UserPlus,
  Mail,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiClient } from "@/lib/api-client";

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

const Dashboard = () => {
  const [overallStats, setOverallStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [messageStats, setMessageStats] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overall, users, messages, rooms] = await Promise.all([
          apiClient.get("/api/admin/dashboard/stats", {
            withCredentials: true,
          }),
          apiClient.get("/api/admin/dashboard/user-stats", {
            withCredentials: true,
          }),
          apiClient.get("/api/admin/dashboard/message-stats", {
            withCredentials: true,
          }),
          apiClient.get("/api/admin/dashboard/room-stats", {
            withCredentials: true,
          }),
        ]);

        setOverallStats(overall.data.data);
        setUserStats(users.data.data);
        setMessageStats(messages.data.data);
        setRoomStats(rooms.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Message Activity</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={messageStats.messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Top Active Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roomStats.roomsWithMessageCount.slice(0, 5).map((room) => (
                    <div key={room._id} className="flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.messageCount} messages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="New Users"
              value={userStats.newUsersLastWeek}
              description="Joined last 7 days"
              icon={UserPlus}
            />
            {userStats.verificationStats.map((stat) => (
              <DashboardCard
                key={stat._id}
                title={stat._id ? "Verified Users" : "Unverified Users"}
                value={stat.count}
                description={
                  stat._id ? "Email verified" : "Pending verification"
                }
                icon={Mail}
              />
            ))}
          </div>
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats.usersByRole.map((role) => (
                  <div key={role._id} className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium capitalize">
                        {role._id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role.count} users
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Message Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageStats.messageTypes.map((type) => (
                    <div key={type._id} className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium capitalize">
                          {type._id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type.count} messages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Pinned Messages</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center">
                  <Pin className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">
                      {messageStats.pinnedMessages}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total pinned messages
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>Top Rooms by Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roomStats.roomsWithMemberCount.slice(0, 5).map((room) => (
                    <div key={room._id} className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.memberCount} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Top Rooms by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roomStats.roomsWithMessageCount.slice(0, 5).map((room) => (
                    <div key={room._id} className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.messageCount} messages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
