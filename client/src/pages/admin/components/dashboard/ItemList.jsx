import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ItemList = ({
  title,
  items,
  icon: Icon,
  primaryKey = "name",
  secondaryKey,
  secondaryLabel,
}) => (
  <Card className="p-4">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item._id} className="flex items-center">
            <Icon className="h-4 w-4 mr-2" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium capitalize">
                {item[primaryKey]}
              </p>
              <p className="text-xs text-muted-foreground">
                {item[secondaryKey]} {secondaryLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
