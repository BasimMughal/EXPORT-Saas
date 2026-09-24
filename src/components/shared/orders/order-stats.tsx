import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type OrderStatsProps = {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  abandonedOrders: number;
};

export function OrderStats({
  totalOrders,
  pendingOrders,
  inProgressOrders,
  completedOrders,
  abandonedOrders,
}: OrderStatsProps) {
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card className="border-primary/15 bg-gradient-to-br from-white to-teal-50/60">
        <CardHeader className="pb-2">
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="font-display text-3xl">{totalOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending</CardDescription>
          <CardTitle className="font-display text-3xl text-amber-700">{pendingOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>In Progress</CardDescription>
          <CardTitle className="font-display text-3xl text-sky-700">{inProgressOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completed</CardDescription>
          <CardTitle className="font-display text-3xl text-emerald-700">
            {completedOrders}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completion Rate</CardDescription>
          <CardTitle className="font-display text-3xl text-primary">{completionRate}%</CardTitle>
          <CardDescription>{abandonedOrders} abandoned</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
