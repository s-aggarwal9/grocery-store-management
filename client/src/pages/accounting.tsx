import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CURRENCY_FORMATTER } from "@/lib/constants";
import type { Invoice } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export default function Accounting() {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  if (isLoading) {
    return (
      <Layout heading="Accounting">
        <div>Loading...</div>
      </Layout>
    );
  }

  const invoicesByStatus = (invoices || []).reduce(
    (acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + Number(invoice.total);
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(invoicesByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Group invoices by month
  const monthlyRevenue = (invoices || []).reduce((acc, invoice) => {
    const date = new Date(invoice.date);
    const month = date.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + Number(invoice.total);
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(monthlyRevenue).map(([month, total]) => ({
    month,
    total,
  }));

  const totalRevenue = (invoices || []).reduce(
    (acc, inv) => acc + Number(inv.total),
    0
  );

  const paidRevenue = (invoices || [])
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + Number(inv.total), 0);

  const pendingRevenue = (invoices || [])
    .filter((inv) => inv.status === "pending")
    .reduce((acc, inv) => acc + Number(inv.total), 0);

  return (
    <Layout heading="Accounting">
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMATTER.format(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {CURRENCY_FORMATTER.format(paidRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {CURRENCY_FORMATTER.format(pendingRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) =>
                      CURRENCY_FORMATTER.format(value).replace(".00", "")
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      CURRENCY_FORMATTER.format(value),
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="total" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      name,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          className="text-xs"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {name} ({CURRENCY_FORMATTER.format(value)})
                        </text>
                      );
                    }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
