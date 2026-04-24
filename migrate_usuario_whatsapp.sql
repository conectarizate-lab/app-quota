-- ============================================================
-- Quota — Migración: WhatsApp del emisor del presupuesto
-- Ejecutar en phpMyAdmin una sola vez
-- ============================================================

ALTER TABLE `usuarios`
  ADD COLUMN `whatsapp` VARCHAR(30) NULL AFTER `empresa`;
