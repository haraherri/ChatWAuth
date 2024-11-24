import { GitBranch, Mail, UserPlus } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { ItemList } from "./ItemList";

export const UsersTab = ({ userStats }) => (
  <div className="space-y-4">
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
          description={stat._id ? "Email verified" : "Pending verification"}
          icon={Mail}
        />
      ))}
    </div>
    <ItemList
      title="Users by Role"
      items={userStats.usersByRole}
      icon={GitBranch}
      primaryKey="_id"
      secondaryKey="count"
      secondaryLabel="users"
    />
  </div>
);
