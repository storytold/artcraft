import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChartBar, IconDashboard, IconWorld } from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const activeUsersData = [
  { date: "02/05", activeUsers: 812 },
  { date: "02/06", activeUsers: 945 },
  { date: "02/07", activeUsers: 1023 },
  { date: "02/08", activeUsers: 876 },
  { date: "02/09", activeUsers: 654 },
  { date: "02/10", activeUsers: 598 },
  { date: "02/11", activeUsers: 901 },
  { date: "02/12", activeUsers: 1102 },
  { date: "02/13", activeUsers: 1045 },
  { date: "02/14", activeUsers: 978 },
  { date: "02/15", activeUsers: 1134 },
  { date: "02/16", activeUsers: 756 },
  { date: "02/17", activeUsers: 689 },
  { date: "02/18", activeUsers: 1023 },
  { date: "02/19", activeUsers: 1187 },
  { date: "02/20", activeUsers: 1056 },
  { date: "02/21", activeUsers: 998 },
  { date: "02/22", activeUsers: 1210 },
  { date: "02/23", activeUsers: 834 },
  { date: "02/24", activeUsers: 712 },
  { date: "02/25", activeUsers: 967 },
  { date: "02/26", activeUsers: 1089 },
  { date: "02/27", activeUsers: 1145 },
  { date: "02/28", activeUsers: 1034 },
  { date: "03/01", activeUsers: 1267 },
  { date: "03/02", activeUsers: 890 },
  { date: "03/03", activeUsers: 756 },
  { date: "03/04", activeUsers: 1123 },
  { date: "03/05", activeUsers: 1198 },
  { date: "03/06", activeUsers: 704 },
];

const countryData = [
  { country: "United States", activeUsers: 704 },
  { country: "India", activeUsers: 105 },
  { country: "Canada", activeUsers: 100 },
  { country: "China", activeUsers: 74 },
  { country: "Brazil", activeUsers: 59 },
  { country: "Argentina", activeUsers: 57 },
  { country: "Australia", activeUsers: 51 },
];

const activeUsersConfig = {
  activeUsers: {
    label: "Active Users",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig;

const countryConfig = {
  activeUsers: {
    label: "Active Users",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

const totalActiveUsers = activeUsersData.reduce(
  (sum, d) => sum + d.activeUsers,
  0,
);

export function DashboardHome() {
  usePageTitle("Dashboard");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconDashboard className="size-6 text-muted-foreground" />
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">Welcome to the admin dashboard.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Active Users Over Time */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <IconChartBar className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Active Users (DUMMY CONTENT RIGHT NOW)
              </CardTitle>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {totalActiveUsers.toLocaleString()}
            </span>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={activeUsersConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart data={activeUsersData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar
                  dataKey="activeUsers"
                  fill="var(--color-activeUsers)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Users by Country */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconWorld className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Users by Country (DUMMY CONTENT RIGHT NOW)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={countryConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart data={countryData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="country"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={100}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar
                  dataKey="activeUsers"
                  fill="var(--color-activeUsers)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
