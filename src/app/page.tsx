import { getDashboardData } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearMoneda, formatearFechaCorta, METODOS_PAGO } from "@/lib/utils-app";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Monitor,
  Shield,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMoneda(data.totalInvertido)}</div>
            <p className="text-xs text-muted-foreground">Costo total de componentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMoneda(data.totalVendido)}</div>
            <p className="text-xs text-muted-foreground">Ingresos por ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.gananciaBruta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatearMoneda(data.gananciaBruta)}
            </div>
            <p className="text-xs text-muted-foreground">Ventas - Inversión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.gananciaNeta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatearMoneda(data.gananciaNeta)}
            </div>
            <p className="text-xs text-muted-foreground">Bruta - Gastos ({formatearMoneda(data.totalGastos)})</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Inventario Valorizado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario Disponible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMoneda(data.inventarioDisponible)}</div>
            <p className="text-xs text-muted-foreground">Valor de componentes disponibles</p>
          </CardContent>
        </Card>

        {/* PCs listas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PCs Listas para Vender</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.ensamblesListos.length}</div>
            {data.ensamblesListos.length > 0 && (
              <div className="mt-2 space-y-1">
                {data.ensamblesListos.slice(0, 3).map((e: any) => (
                  <div key={e.id} className="flex justify-between text-xs">
                    <span className="truncate">{e.nombre}</span>
                    <span className="text-muted-foreground">
                      {e.precioVentaSugerido ? formatearMoneda(e.precioVentaSugerido) : formatearMoneda(e.costoTotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Garantías próximas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garantías por Vencer</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.garantiasProximas.length}</div>
            {data.garantiasProximas.length > 0 && (
              <div className="mt-2 space-y-1">
                {data.garantiasProximas.slice(0, 3).map((g: any) => (
                  <div key={g.id} className="flex justify-between text-xs">
                    <span className="truncate">
                      {g.componente?.modelo || g.ensamble?.nombre || "N/A"}
                    </span>
                    <span className="text-orange-600">{formatearFechaCorta(g.fechaFin)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Ventas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Últimas Ventas</CardTitle>
            <Link href="/ventas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.ultimasVentas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas registradas</p>
          ) : (
            <div className="space-y-3">
              {data.ultimasVentas.map((venta: any) => (
                <div key={venta.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      Venta #{venta.id} - {venta.cliente?.nombre || "Anónimo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFechaCorta(venta.fechaVenta)} · {venta.detalles.length} item(s) · {METODOS_PAGO.find(m => m.value === venta.metodoPago)?.label || venta.metodoPago}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatearMoneda(venta.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
