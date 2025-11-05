-- Extensión para UUID (si no existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas básicas creadas por SQLAlchemy en el arranque. Este archivo sirve si prefieres crear a mano.
-- Vista de apoyo (igual a la que se crea en startup):
CREATE OR REPLACE VIEW v_taller_calculo AS
SELECT
  td.taller_id,
  c.nombre_corte,
  i.item_code,
  i.descripcion,
  i.precio_venta,
  td.peso,
  SUM(td.peso) OVER (PARTITION BY td.taller_id) AS peso_total,
  c.porcentaje_default,
  CASE 
    WHEN SUM(td.peso) OVER (PARTITION BY td.taller_id) > 0 
    THEN td.peso / SUM(td.peso) OVER (PARTITION BY td.taller_id) * 100
    ELSE 0
  END AS porcentaje_real,
  (CASE 
    WHEN SUM(td.peso) OVER (PARTITION BY td.taller_id) > 0 
    THEN td.peso / SUM(td.peso) OVER (PARTITION BY td.taller_id) * 100
    ELSE 0
  END - c.porcentaje_default) AS delta_pct,
  td.peso * i.precio_venta AS valor_estimado
FROM taller_detalles td
JOIN cortes c ON c.id = td.corte_id
JOIN talleres t ON t.id = td.taller_id
JOIN items i ON i.id = t.item_id;
