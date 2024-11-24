import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemList } from "./ItemList";
import { MessageCircle, Pin } from "lucide-react";

export const MessagesTab = ({ messageStats }) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ItemList
        title="Message Types"
        items={messageStats.messageTypes}
        icon={MessageCircle}
        primaryKey="_id"
        secondaryKey="count"
        secondaryLabel="messages"
      />

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
  </div>
);
