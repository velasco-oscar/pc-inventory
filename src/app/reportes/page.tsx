"use client";

import { useState, useTransition, useEffect } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { formatearMoneda, formatearFechaInput, formatearFechaCorta } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  BarChart3,
  CalendarDays,
} from "lucide-react";
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

export default function ReportesPage() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<any>(null);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatearFechaInput(d);
  });
  const [fechaFin, setFechaFin] = useState(formatearFechaInput(new Date()));

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    startTransition(async () => {
      const resultado = await getDashboardData();
      setData(resultado);
    });
  };

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const gananciaBruta = data.totalVendido - data.totalInvertido;
  const margen = data.totalVendido > 0 ? (gananciaBruta / data.totalVendido) * 100 : 0;

  const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6", "#ec4899"];

  // Mock chart data based on dashboard data
  const ventasMensuales = data.ventasMes || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Análisis financiero y estadísticas del negocio</p>
        </div>
        <a href="/api/exportar" target="_blank">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(data.totalInvertido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(data.totalVendido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(data.gananciaBruta)}</p>
            <p className="text-xs text-muted-foreground">Margen: {margen.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.gananciaNeta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatearMoneda(data.gananciaNeta)}
            </p>
            <p className="text-xs text-muted-foreground">Después de gastos operativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nombre: "Invertido", monto: data.totalInvertido },
                    { nombre: "Vendido", monto: data.totalVendido },
                    { nombre: "Ganancia Bruta", monto: data.gananciaBruta },
                    { nombre: "Ganancia Neta", monto: data.gananciaNeta },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value: any) => formatearMoneda(Number(value))} />
                  <Bar dataKey="monto" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Componentes disponibles", value: data.inventarioDisponible },
                      { name: "PCs listas", value: data.ensamblesListos },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {[0, 1].map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      {data.ultimasVentas && data.ultimasVentas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ultimasVentas.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">#{v.id}</TableCell>
                    <TableCell>{v.cliente?.nombre || "Sin cliente"}</TableCell>
                    <TableCell>{v.detalles?.length || 0} items</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatearMoneda(v.total)}
                    </TableCell>
                    <TableCell>{formatearFechaCorta(v.fechaVenta)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Warranties status */}
      {data.garantiasProximas > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">
              ⚠ Garantías próximas a vencer: {data.garantiasProximas}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Hay {data.garantiasProximas} garantía{data.garantiasProximas !== 1 ? "s" : ""} que
              vence{data.garantiasProximas !== 1 ? "n" : ""} en los próximos 30 días. Revisa la
              sección de Garantías para más detalles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
