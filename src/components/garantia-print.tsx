"use client";

import { useRef, useState } from "react";
import { formatearFecha } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";

type GarantiaPrintProps = {
  garantia: {
    id: number;
    fechaInicio: Date | string;
    fechaFin: Date | string;
    condiciones?: string | null;
    estado: string;
    notas?: string | null;
    venta?: {
      id: number;
      fechaVenta: Date | string;
      cliente?: { nombre: string; telefono?: string | null; email?: string | null } | null;
    } | null;
    componente?: { marca: string; modelo: string; numeroSerie?: string | null; categoria?: { nombre: string } | null } | null;
    ensamble?: { nombre: string } | null;
  };
  trigger?: React.ReactNode;
};

export function GarantiaPrint({ garantia, trigger }: GarantiaPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [contacto, setContacto] = useState("");

  const itemNombre = garantia.componente
    ? `${garantia.componente.marca} ${garantia.componente.modelo}`
    : garantia.ensamble?.nombre || "—";

  const itemTipo = garantia.componente
    ? garantia.componente.categoria?.nombre || "Componente"
    : garantia.ensamble
      ? "Ensamble (PC)"
      : "—";

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Garantía #${garantia.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #1a1a1a;
              padding: 24px 32px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1a1a1a;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .header h1 {
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .header .subtitle {
              font-size: 11px;
              color: #666;
            }
            .section {
              margin-bottom: 12px;
            }
            .section-title {
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
              margin-bottom: 5px;
              border-bottom: 1px solid #e5e5e5;
              padding-bottom: 2px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px;
            }
            .field {
              margin-bottom: 4px;
            }
            .field-label {
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #888;
            }
            .field-value {
              font-size: 12px;
              font-weight: 500;
              margin-top: 1px;
            }
            .conditions-box {
              background: #f8f8f8;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              padding: 10px;
              font-size: 11px;
              line-height: 1.5;
            }
            .dates-highlight {
              display: flex;
              justify-content: space-between;
              background: #f0f0f0;
              border-radius: 4px;
              padding: 10px 20px;
              margin-bottom: 14px;
            }
            .date-block {
              text-align: center;
            }
            .date-block .label {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
              font-weight: 600;
            }
            .date-block .value {
              font-size: 14px;
              font-weight: 700;
              margin-top: 2px;
            }
            .date-arrow {
              display: flex;
              align-items: center;
              font-size: 18px;
              color: #ccc;
            }
            .notes-box {
              border-left: 2px solid #ddd;
              padding-left: 10px;
              font-size: 11px;
              color: #555;
              font-style: italic;
            }
            .footer {
              margin-top: 24px;
              padding-top: 10px;
              border-top: 1px solid #e5e5e5;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 36px;
            }
            .signature-line {
              text-align: center;
              width: 180px;
            }
            .signature-line .line {
              border-top: 1px solid #1a1a1a;
              margin-bottom: 4px;
            }
            .signature-line .label {
              font-size: 10px;
              color: #666;
            }
            .footer-note {
              text-align: center;
              font-size: 9px;
              color: #999;
              margin-top: 16px;
            }
            .contact-box {
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              background: #f8f8f8;
              padding: 8px 16px;
              text-align: center;
              margin-bottom: 12px;
            }
            .contact-box .contact-label {
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #666;
              margin-bottom: 2px;
            }
            .contact-box .contact-phone {
              font-size: 14px;
              font-weight: 700;
            }
            .contact-box .contact-sub {
              font-size: 9px;
              color: #888;
              margin-top: 2px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de Garantía</DialogTitle>
        </DialogHeader>

        {/* Contact fields */}
        <div className="grid gap-3 sm:grid-cols-1 pb-2">
          <div className="space-y-1">
            <Label className="text-xs">Teléfono</Label>
            <Input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej: 55 1234 5678"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <Separator />

        {/* Preview */}
        <div ref={printRef} className="bg-white text-black rounded-lg p-6">
          <div className="header">
            <h1>Certificado de Garantía</h1>
            <p className="subtitle">Documento de cobertura del producto</p>
          </div>

          {/* Dates highlight */}
          <div className="dates-highlight">
            <div className="date-block">
              <p className="label">Fecha de inicio</p>
              <p className="value">{formatearFecha(garantia.fechaInicio)}</p>
            </div>
            <div className="date-arrow">→</div>
            <div className="date-block">
              <p className="label">Fecha de vencimiento</p>
              <p className="value">{formatearFecha(garantia.fechaFin)}</p>
            </div>
          </div>

          {/* Product info */}
          <div className="section">
            <p className="section-title">Producto</p>
            <div className="grid">
              <div className="field">
                <p className="field-label">Artículo</p>
                <p className="field-value">{itemNombre}</p>
              </div>
              <div className="field">
                <p className="field-label">Tipo</p>
                <p className="field-value">{itemTipo}</p>
              </div>
              {garantia.componente?.numeroSerie && (
                <div className="field">
                  <p className="field-label">No. de Serie</p>
                  <p className="field-value">{garantia.componente.numeroSerie}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client info */}
          {garantia.venta?.cliente && (
            <div className="section">
              <p className="section-title">Cliente</p>
              <div className="grid">
                <div className="field">
                  <p className="field-label">Nombre</p>
                  <p className="field-value">{garantia.venta.cliente.nombre}</p>
                </div>
                {garantia.venta.cliente.telefono && (
                  <div className="field">
                    <p className="field-label">Teléfono</p>
                    <p className="field-value">{garantia.venta.cliente.telefono}</p>
                  </div>
                )}
                {garantia.venta.cliente.email && (
                  <div className="field">
                    <p className="field-label">Email</p>
                    <p className="field-value">{garantia.venta.cliente.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generic limited warranty terms */}
          <div className="section">
            <p className="section-title">Términos y Limitaciones</p>
            <div className="conditions-box" style={{ fontSize: '10px', lineHeight: '1.5' }}>
              <p>Esta garantía limitada cubre únicamente defectos de fabricación y fallas en el funcionamiento normal del producto <strong>{itemNombre}</strong> durante el período indicado.</p>
              <p style={{ marginTop: '6px' }}><strong>Esta garantía NO cubre:</strong></p>
              <ul style={{ marginLeft: '16px', marginTop: '3px', listStyleType: 'disc' }}>
                <li>Daños por golpes, caídas, aplastamiento o impacto físico.</li>
                <li>Daños por contacto con líquidos, humedad excesiva o corrosión.</li>
                <li>Daños causados por sobrecarga eléctrica, variaciones de voltaje o conexión a fuentes de energía inadecuadas.</li>
                <li>Modificaciones, reparaciones o intervenciones realizadas por terceros no autorizados.</li>
                <li>Desgaste natural por uso prolongado.</li>
                <li>Daños por uso indebido, negligencia o incumplimiento de las instrucciones del fabricante.</li>
                <li>Daños por desastres naturales, incendios o condiciones ambientales extremas.</li>
                <li>Software, virus, o problemas derivados de la configuración del usuario.</li>
              </ul>
              <p style={{ marginTop: '6px' }}>Para hacer válida esta garantía, el cliente deberá presentar este documento. El vendedor se reserva el derecho de inspeccionar el producto antes de autorizar cualquier reparación o reemplazo. La resolución podrá consistir en reparación, reemplazo o reembolso conforme a la evaluación técnica del producto y disponibilidad.</p>
            </div>
          </div>

          {/* Notes */}
          {garantia.notas && (
            <div className="section">
              <p className="section-title">Notas</p>
              <div className="notes-box">{garantia.notas}</div>
            </div>
          )}

          {/* Contact info */}
          {contacto && (
            <div className="contact-box">
              <p className="contact-label">✆ Para hacer válida su garantía, llámenos</p>
              <p className="contact-phone">{contacto}</p>
              <p className="contact-sub">Presente este documento al momento de contactarnos</p>
            </div>
          )}

          {/* Signatures */}
          <div className="footer">
            <div className="signatures">
              <div className="signature-line">
                <div className="line"></div>
                <p className="label">Vendedor</p>
              </div>
              <div className="signature-line">
                <div className="line"></div>
                <p className="label">Cliente</p>
              </div>
            </div>
            <p className="footer-note">
              Este documento es un comprobante de garantía. Consérvelo para hacer válida su cobertura.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
