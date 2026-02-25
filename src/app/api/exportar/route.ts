import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all data
    const [componentes, ensambles, ventas, gastos, clientes, proveedores] = await Promise.all([
      prisma.componente.findMany({
        include: { categoria: true, proveedor: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ensamble.findMany({
        include: { componentes: { include: { categoria: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.venta.findMany({
        include: {
          cliente: true,
          detalles: { include: { componente: true, ensamble: true } },
        },
        orderBy: { fechaVenta: "desc" },
      }),
      prisma.gastoOperativo.findMany({ orderBy: { fecha: "desc" } }),
      prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
      prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
    ]);

    const wb = XLSX.utils.book_new();

    // Sheet: Componentes
    const compData = componentes.map((c: any) => ({
      ID: c.id,
      Categoría: c.categoria.nombre,
      Marca: c.marca,
      Modelo: c.modelo,
      "Número de Serie": c.numeroSerie || "",
      Estado: c.estado,
      Proveedor: c.proveedor?.nombre || "",
      "Fecha Compra": c.fechaCompra.toISOString().split("T")[0],
      "Costo Original": c.costoOriginal,
      Moneda: c.monedaCompra,
      "Tipo Cambio": c.tipoCambio,
      "Costo MXN": c.costoOriginal * c.tipoCambio,
      Notas: c.notas || "",
    }));
    const wsComp = XLSX.utils.json_to_sheet(compData);
    XLSX.utils.book_append_sheet(wb, wsComp, "Componentes");

    // Sheet: Ensambles
    const ensData = ensambles.map((e: any) => {
      const costoComp = e.componentes.reduce(
        (s: number, c: any) => s + c.costoOriginal * c.tipoCambio,
        0
      );
      return {
        ID: e.id,
        Nombre: e.nombre,
        Estado: e.estado,
        "# Componentes": e.componentes.length,
        "Costo Componentes": costoComp,
        "Mano de Obra": e.costoManoObra,
        "Costo Total": costoComp + e.costoManoObra,
        "Precio Sugerido": e.precioVentaSugerido || "",
        "Fecha Ensamble": e.fechaEnsamble.toISOString().split("T")[0],
        Notas: e.notas || "",
      };
    });
    const wsEns = XLSX.utils.json_to_sheet(ensData);
    XLSX.utils.book_append_sheet(wb, wsEns, "Ensambles");

    // Sheet: Ventas
    const ventasData = ventas.map((v: any) => ({
      ID: v.id,
      Cliente: v.cliente?.nombre || "Sin cliente",
      "Tipo Venta": v.tipoVenta,
      Subtotal: v.subtotal,
      Descuento: v.descuento,
      Total: v.total,
      "Método Pago": v.metodoPago,
      "Fecha Venta": v.fechaVenta.toISOString().split("T")[0],
      "# Items": v.detalles.length,
      Notas: v.notas || "",
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasData);
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

    // Sheet: Detalle Ventas
    const detallesData = ventas.flatMap((v: any) =>
      v.detalles.map((d: any) => ({
        "Venta ID": v.id,
        Tipo: d.componenteId ? "Componente" : "Ensamble",
        Item: d.componente
          ? `${d.componente.marca} ${d.componente.modelo}`
          : d.ensamble?.nombre || "",
        "Precio Unitario": d.precioUnitario,
        Cantidad: d.cantidad,
        Subtotal: d.precioUnitario * d.cantidad,
      }))
    );
    const wsDetalles = XLSX.utils.json_to_sheet(detallesData);
    XLSX.utils.book_append_sheet(wb, wsDetalles, "Detalle Ventas");

    // Sheet: Gastos
    const gastosData = gastos.map((g: any) => ({
      ID: g.id,
      Concepto: g.concepto,
      Categoría: g.categoria,
      Monto: g.monto,
      Fecha: g.fecha.toISOString().split("T")[0],
      Notas: g.notas || "",
    }));
    const wsGastos = XLSX.utils.json_to_sheet(gastosData);
    XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

    // Sheet: Clientes
    const clientesData = clientes.map((c: any) => ({
      ID: c.id,
      Nombre: c.nombre,
      Teléfono: c.telefono || "",
      Email: c.email || "",
      Dirección: c.direccion || "",
      Notas: c.notas || "",
    }));
    const wsClientes = XLSX.utils.json_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");

    // Sheet: Proveedores
    const proveedoresData = proveedores.map((p: any) => ({
      ID: p.id,
      Nombre: p.nombre,
      Teléfono: p.telefono || "",
      Email: p.email || "",
      Dirección: p.direccion || "",
      Notas: p.notas || "",
    }));
    const wsProveedores = XLSX.utils.json_to_sheet(proveedoresData);
    XLSX.utils.book_append_sheet(wb, wsProveedores, "Proveedores");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fecha = new Date().toISOString().split("T")[0];
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="inventario-pc-${fecha}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}
