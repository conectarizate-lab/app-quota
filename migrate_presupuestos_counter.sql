-- ============================================================
-- Quota — Migración: Contador histórico de presupuestos
-- Ejecutar en phpMyAdmin una sola vez
-- ============================================================

ALTER TABLE `usuarios`
  ADD COLUMN `presupuestos_creados` INT NOT NULL DEFAULT 0;

-- Inicializar con los presupuestos ya existentes
UPDATE `usuarios` u
SET `presupuestos_creados` = (
  SELECT COUNT(*) FROM `presupuestos` p WHERE p.usuario_id = u.id
);
