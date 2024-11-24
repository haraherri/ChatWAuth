import { MessageCircle, Users } from "lucide-react";
import { ItemList } from "./ItemList";

export const RoomsTab = ({ roomStats }) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <ItemList
        title="Top Rooms by Members"
        items={roomStats.roomsWithMemberCount.slice(0, 5)}
        icon={Users}
        primaryKey="name"
        secondaryKey="memberCount"
        secondaryLabel="members"
      />

      <ItemList
        title="Top Rooms by Activity"
        items={roomStats.roomsWithMessageCount.slice(0, 5)}
        icon={MessageCircle}
        primaryKey="name"
        secondaryKey="messageCount"
        secondaryLabel="messages"
      />
    </div>
  </div>
);
