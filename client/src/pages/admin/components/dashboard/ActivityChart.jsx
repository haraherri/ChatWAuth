import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfDay } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card p-2 shadow-sm">
      <p className="font-medium">{format(new Date(label), "MMM dd, yyyy")}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {entry.dataKey === "count" ? "Messages: " : ""}
          {entry.value}
        </p>
      ))}
    </div>
  );
};

const TimeRangeSelect = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="Select range" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="7">Last 7 days</SelectItem>
      <SelectItem value="14">Last 14 days</SelectItem>
      <SelectItem value="30">Last 30 days</SelectItem>
    </SelectContent>
  </Select>
);

export const ActivityChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState("7");
  const [hoveredDate, setHoveredDate] = useState(null);

  // Process and filter data based on time range
  const filteredData = data.filter((item) => {
    const date = new Date(item._id);
    return date >= subDays(startOfDay(new Date()), parseInt(timeRange));
  });

  // Format dates and ensure continuous data points
  const processedData = filteredData.map((item) => ({
    date: format(new Date(item._id), "yyyy-MM-dd"),
    count: item.count,
  }));

  return (
    <Card className="p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Message Activity</CardTitle>
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </div>
        {hoveredDate && (
          <p className="text-sm text-muted-foreground mt-2">{hoveredDate}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={processedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onMouseMove={(e) => {
                if (e?.activeLabel) {
                  setHoveredDate(
                    format(new Date(e.activeLabel), "MMMM dd, yyyy")
                  );
                }
              }}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Messages"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8, fill: "#8884d8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
