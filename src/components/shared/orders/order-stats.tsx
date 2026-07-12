import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

type OrderStatsProps = {
  totalOrders: number;
  totalReceivedAmount: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  abandonedOrders: number;
};

export function OrderStats({
  totalOrders,
  totalReceivedAmount,
  pendingOrders,
  inProgressOrders,
  completedOrders,
  abandonedOrders,
}: OrderStatsProps) {
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-3xl">{totalOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Received Amount</CardDescription>
          <CardTitle className="text-3xl">{formatCurrency(totalReceivedAmount)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending</CardDescription>
          <CardTitle className="text-3xl">{pendingOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>In Progress</CardDescription>
          <CardTitle className="text-3xl">{inProgressOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completed</CardDescription>
          <CardTitle className="text-3xl">{completedOrders}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completion Rate</CardDescription>
          <CardTitle className="text-3xl">{completionRate}%</CardTitle>
          <CardDescription>{abandonedOrders} abandoned</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
