-- ============================================================
-- Quota — Setup de base de datos
-- Ejecutar en phpMyAdmin (Hostinger) o via MySQL CLI
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── usuarios ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`              INT UNSIGNED                    NOT NULL AUTO_INCREMENT,
  `nombre`          VARCHAR(120)                    NOT NULL,
  `email`           VARCHAR(200)                    NOT NULL,
  `password_hash`   VARCHAR(255)                    NOT NULL,
  `empresa`         VARCHAR(120)                    NOT NULL DEFAULT '',
  `moneda_default`  ENUM('ARS','USD','UYU')         NOT NULL DEFAULT 'ARS',
  `plan`            VARCHAR(30)                     NOT NULL DEFAULT 'free',
  `activo`          TINYINT(1)                      NOT NULL DEFAULT 1,
  `created_at`      TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── servicios ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `servicios` (
  `id`          INT UNSIGNED                    NOT NULL AUTO_INCREMENT,
  `usuario_id`  INT UNSIGNED                    NOT NULL,
  `nombre`      VARCHAR(200)                    NOT NULL,
  `descripcion` TEXT                            NULL,
  `precio`      DECIMAL(12,2)                   NOT NULL DEFAULT 0.00,
  `moneda`      ENUM('ARS','USD','UYU')         NOT NULL DEFAULT 'ARS',
  `categoria`   VARCHAR(100)                    NOT NULL DEFAULT '',
  `activo`      TINYINT(1)                      NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_servicios_usuario_activo` (`usuario_id`, `activo`),
  CONSTRAINT `fk_servicios_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── clientes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clientes` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `usuario_id`  INT UNSIGNED    NOT NULL,
  `nombre`      VARCHAR(200)    NOT NULL,
  `email`       VARCHAR(200)    NOT NULL DEFAULT '',
  `whatsapp`    VARCHAR(50)     NOT NULL DEFAULT '',
  `empresa`     VARCHAR(150)    NOT NULL DEFAULT '',
  `notas`       TEXT            NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clientes_usuario` (`usuario_id`),
  CONSTRAINT `fk_clientes_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── presupuestos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `presupuestos` (
  `id`                INT UNSIGNED                                              NOT NULL AUTO_INCREMENT,
  `usuario_id`        INT UNSIGNED                                              NOT NULL,
  `cliente_id`        INT UNSIGNED                                              NULL DEFAULT NULL,
  `numero`            VARCHAR(10)                                               NOT NULL,
  `estado`            ENUM('borrador','enviado','aceptado','rechazado','vencido') NOT NULL DEFAULT 'borrador',
  `descuento_pct`     DECIMAL(5,2)                                             NOT NULL DEFAULT 0.00,
  `subtotal`          DECIMAL(12,2)                                            NOT NULL DEFAULT 0.00,
  `total`             DECIMAL(12,2)                                            NOT NULL DEFAULT 0.00,
  `moneda`            ENUM('ARS','USD','UYU')                                  NOT NULL DEFAULT 'ARS',
  `nota_cliente`      TEXT                                                      NULL,
  `fecha_emision`     DATE                                                      NOT NULL,
  `fecha_vencimiento` DATE                                                      NULL DEFAULT NULL,
  `created_at`        TIMESTAMP                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_presupuestos_usuario`       (`usuario_id`),
  KEY `idx_presupuestos_cliente`       (`cliente_id`),
  KEY `idx_presupuestos_estado`        (`usuario_id`, `estado`),
  KEY `idx_presupuestos_fecha`         (`usuario_id`, `fecha_emision`),
  CONSTRAINT `fk_presupuestos_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presupuestos_cliente`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── presupuesto_items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `presupuesto_items` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `presupuesto_id`  INT UNSIGNED    NOT NULL,
  `servicio_id`     INT UNSIGNED    NULL DEFAULT NULL,
  `nombre`          VARCHAR(200)    NOT NULL,
  `descripcion`     TEXT            NULL,
  `precio`          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `cantidad`        SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `subtotal`        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_items_presupuesto` (`presupuesto_id`),
  CONSTRAINT `fk_items_presupuesto`
    FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_servicio`
    FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── password_resets ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(200)    NOT NULL,
  `token`       VARCHAR(64)     NOT NULL,
  `expires_at`  DATETIME        NOT NULL,
  `used`        TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── vencimientos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vencimientos` (
  `id`                INT UNSIGNED                                                                NOT NULL AUTO_INCREMENT,
  `usuario_id`        INT UNSIGNED                                                                NOT NULL,
  `tipo`              ENUM('cobro','pago')                                                        NOT NULL,
  `concepto`          VARCHAR(200)                                                               NOT NULL,
  `monto`             DECIMAL(12,2)                                                              NULL DEFAULT NULL,
  `moneda`            ENUM('ARS','USD','UYU')                                                    NOT NULL DEFAULT 'ARS',
  `cliente_id`        INT UNSIGNED                                                                NULL DEFAULT NULL,
  `fecha_vencimiento` DATE                                                                        NOT NULL,
  `recurrencia`       ENUM('unico','semanal','mensual','anual')                                  NOT NULL DEFAULT 'unico',
  `estado`            ENUM('pendiente','recordatorio_enviado','cobrado','pagado','vencido')       NOT NULL DEFAULT 'pendiente',
  `notas`             TEXT                                                                        NULL,
  `created_at`        TIMESTAMP                                                                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP                                                                   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vencimientos_usuario` (`usuario_id`),
  KEY `idx_vencimientos_fecha`   (`usuario_id`, `fecha_vencimiento`),
  CONSTRAINT `fk_vencimientos_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vencimientos_cliente`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── vencimientos_historial ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `vencimientos_historial` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `vencimiento_id`  INT UNSIGNED    NOT NULL,
  `fecha_pago`      DATE            NOT NULL,
  `monto_pagado`    DECIMAL(12,2)   NULL DEFAULT NULL,
  `notas`           TEXT            NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_historial_vencimiento` (`vencimiento_id`),
  CONSTRAINT `fk_historial_vencimiento`
    FOREIGN KEY (`vencimiento_id`) REFERENCES `vencimientos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
