-- ============================================================
-- Quota — Migración: Sistema de planes y roles
-- Ejecutar en phpMyAdmin una sola vez
-- ============================================================

ALTER TABLE `usuarios`
  ADD COLUMN `trial_expira_en`     DATETIME     NULL          AFTER `plan`,
  ADD COLUMN `plan_origen`         VARCHAR(30)  NOT NULL DEFAULT 'trial' AFTER `trial_expira_en`,
  ADD COLUMN `trial_aviso_enviado` TINYINT(1)   NOT NULL DEFAULT 0 AFTER `plan_origen`,
  ADD COLUMN `rol`                 ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER `activo`;

-- Setear el administrador
UPDATE `usuarios` SET `rol` = 'admin' WHERE `email` = 'fededav1975@hotmail.com';
