# ************************************************************
# Sequel Ace SQL dump
# Version 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Host: localhost (MySQL 5.5.5-10.11.13-MariaDB)
# Database: tagihan_air
# Generation Time: 2025-08-07 15:54:14 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table app_settings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_settings`;

CREATE TABLE `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;

INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`)
VALUES
	('bank_account_bca','BCA 987690','Nomor rekening Bank BCA.'),
	('bank_account_mandiri','mamandiri','Nomor rekening Bank Mandiri.'),
	('Maps_url','https:&amp;amp;amp;#x2F;&amp;amp;amp;#x2F;maps.app.goo.gl&amp;amp;amp;#x2F;6DRGt79yqXv7Whm29?g_st=ac','Tautan Google Maps lokasi kantor.'),
	('qris_image_url','https:&#x2F;&#x2F;res.cloudinary.com&#x2F;dpmguxi8c&#x2F;image&#x2F;upload&#x2F;v1754578358&#x2F;qris_codes&#x2F;m05pf26y0huajprkirza.jpg','URL ke gambar QRIS untuk pembayaran.');

/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table areas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `areas`;

CREATE TABLE `areas` (
  `area_id` int(11) NOT NULL AUTO_INCREMENT,
  `area_name` varchar(100) NOT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`area_id`),
  UNIQUE KEY `area_name` (`area_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table bills
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bills`;

CREATE TABLE `bills` (
  `bill_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `reading_id` int(11) NOT NULL,
  `rate_id` int(11) NOT NULL,
  `rate_per_cubic` decimal(10,2) DEFAULT 4000.00,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('unpaid','partial','paid','overdue','cancelled') DEFAULT 'unpaid',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL COMMENT 'Catatan tambahan untuk tagihan',
  `total_due` decimal(10,2) GENERATED ALWAYS AS (`amount` - `paid_amount`) STORED,
  PRIMARY KEY (`bill_id`),
  KEY `reading_id` (`reading_id`),
  KEY `idx_bill_due_date` (`due_date`),
  KEY `idx_bills_customer` (`customer_id`),
  KEY `idx_bills_status` (`status`),
  KEY `idx_bills_period` (`period_end`),
  KEY `fk_bill_water_rate` (`rate_id`),
  KEY `idx_customer_period` (`customer_id`,`period_end`),
  CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `bills_ibfk_2` FOREIGN KEY (`reading_id`) REFERENCES `meter_readings` (`reading_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table customer_categories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `customer_categories`;

CREATE TABLE `customer_categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name_unique` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `customer_categories` WRITE;
/*!40000 ALTER TABLE `customer_categories` DISABLE KEYS */;

INSERT INTO `customer_categories` (`category_id`, `category_name`, `description`)
VALUES
	(1,'Rumah Tangga','Pelanggan untuk kebutuhan rumah tinggal standar.'),
	(2,'Sosial (Masjid)','Fasilitas umum keagamaan seperti masjid atau mushola.'),
	(3,'Sosial (Umum)','Fasilitas umum sosial lainnya seperti panti asuhan.'),
	(4,'Komersial','Pelanggan untuk kebutuhan usaha atau bisnis.');

/*!40000 ALTER TABLE `customer_categories` ENABLE KEYS */;
UNLOCK TABLES;




# Dump of table customers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `customers`;

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `area_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `meter_number` int(5) unsigned zerofill DEFAULT NULL COMMENT 'Nomor meter 1-5 digit (contoh: 00247)',
  `phone_number` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `registration_date` date NOT NULL,
  `saldo` decimal(10,2) DEFAULT NULL COMMENT 'Saldo kelebihan pembayaran yang bisa digunakan untuk tagihan berikutnya',
  `hutang` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`customer_id`),
  KEY `idx_area` (`area_id`),
  KEY `idx_customer_search` (`full_name`,`meter_number`,`area_id`),
  KEY `idx_area_officer` (`area_id`),
  KEY `idx_search` (`full_name`,`meter_number`,`phone_number`),
  KEY `meter_number` (`meter_number`) USING BTREE,
  KEY `fk_customer_category` (`category_id`),
  KEY `idx_customers_area` (`area_id`),
  CONSTRAINT `customers_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `areas` (`area_id`),
  CONSTRAINT `fk_customer_category` FOREIGN KEY (`category_id`) REFERENCES `customer_categories` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table equity_transactions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `equity_transactions`;

CREATE TABLE `equity_transactions` (
  `equity_transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_date` date NOT NULL,
  `type` enum('MODAL_AWAL','SETORAN_MODAL','PRIVE','LABA_DITAHAN_PERIODIK') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`equity_transaction_id`),
  KEY `fk_equity_user` (`created_by`),
  CONSTRAINT `fk_equity_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table expenses
# ------------------------------------------------------------

DROP TABLE IF EXISTS `expenses`;

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL AUTO_INCREMENT,
  `category` enum('operational','salary','other') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table financial_predictions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `financial_predictions`;

CREATE TABLE `financial_predictions` (
  `prediction_id` int(11) NOT NULL AUTO_INCREMENT,
  `prediction_date` date NOT NULL,
  `prediction_type` enum('income','expense','net_profit') NOT NULL,
  `predicted_amount` decimal(10,2) NOT NULL,
  `confidence_level` decimal(5,2) DEFAULT 0.00 COMMENT 'Tingkat akurasi prediksi (0-100)',
  `historical_months` int(11) NOT NULL COMMENT 'Jumlah bulan histori yang digunakan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`prediction_id`),
  KEY `idx_prediction_date` (`prediction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table financial_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `financial_records`;

CREATE TABLE `financial_records` (
  `record_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `cash_balance` decimal(10,2) DEFAULT 0.00,
  `bank_balance` decimal(10,2) DEFAULT 0.00,
  `total_income` decimal(10,2) DEFAULT 0.00,
  `total_expense` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`record_id`),
  KEY `idx_financial_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table financials
# ------------------------------------------------------------

DROP TABLE IF EXISTS `financials`;

CREATE TABLE `financials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `cashflow_classification` enum('OPERATING','INVESTING','FINANCING') NOT NULL DEFAULT 'OPERATING',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `date` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `fk_financials_payments` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_financials_users` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table fixed_assets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `fixed_assets`;

CREATE TABLE `fixed_assets` (
  `asset_id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `acquisition_date` date NOT NULL,
  `acquisition_cost` decimal(15,2) NOT NULL,
  `status` enum('IN_USE','SOLD','DISPOSED') NOT NULL DEFAULT 'IN_USE',
  `related_financial_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`asset_id`),
  KEY `fk_asset_financial` (`related_financial_id`),
  CONSTRAINT `fk_asset_financial` FOREIGN KEY (`related_financial_id`) REFERENCES `financials` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table login_attempts
# ------------------------------------------------------------

DROP TABLE IF EXISTS `login_attempts`;

CREATE TABLE `login_attempts` (
  `attempt_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `attempt_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attempt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table meter_readings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `meter_readings`;

CREATE TABLE `meter_readings` (
  `reading_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('pending','verified','disputed') DEFAULT 'pending',
  `image_url` varchar(255) DEFAULT NULL,
  `previous_reading` decimal(10,2) NOT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `water_usage` decimal(10,2) GENERATED ALWAYS AS (`current_reading` - `previous_reading`) VIRTUAL,
  `reading_date` date NOT NULL,
  `sync_status` enum('online','offline_pending','offline_synced') DEFAULT 'online',
  `notes` text DEFAULT NULL,
  `bill_id` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`reading_id`),
  KEY `officer_id` (`user_id`),
  KEY `idx_reading_date` (`reading_date`),
  KEY `idx_meter_readings_bill` (`bill_id`),
  KEY `idx_readings_customer_date` (`customer_id`,`reading_date`),
  KEY `idx_soft_delete` (`deleted_at`),
  CONSTRAINT `meter_readings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `meter_readings_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO" */;;
/*!50003 CREATE */ /*!50017  */ /*!50003 TRIGGER `flag_suspicious_readings` AFTER INSERT ON `meter_readings` FOR EACH ROW BEGIN
  DECLARE avg_usage DECIMAL(10,2);
  
  SELECT AVG(water_usage) INTO avg_usage
  FROM meter_readings
  WHERE customer_id = NEW.customer_id
  AND reading_date >= DATE_SUB(NEW.reading_date, INTERVAL 6 MONTH);
  
  IF NEW.water_usage > avg_usage * 3 OR 
     (avg_usage > 0 AND NEW.water_usage = 0) THEN
    INSERT INTO reading_flags (reading_id, flag_type, notes)
    VALUES (NEW.reading_id, 'system_note', 'Unusual usage pattern detected');
  END IF;
END */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO" */;;
/*!50003 CREATE */ /*!50017  */ /*!50003 TRIGGER `after_meter_reading_special_case` AFTER UPDATE ON `meter_readings` FOR EACH ROW BEGIN
    
    IF NEW.current_reading > (OLD.current_reading * 2) THEN
        INSERT INTO reading_flags (reading_id, flag_type, notes)
        VALUES (NEW.reading_id, 'suspicious_reading', 'Unusual increase in meter reading detected');
    END IF;
    
    
    IF NEW.current_reading != OLD.current_reading THEN
        INSERT INTO reading_flags (reading_id, flag_type, flag_value, notes)
        VALUES (
            NEW.reading_id,
            'reading_correction',
            CONCAT(OLD.current_reading, ' -> ', NEW.current_reading),
            'Reading value corrected'
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;






# Dump of table notifications
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `channel` enum('email','sms','app','whatsapp') DEFAULT 'app',
  `retry_count` int(11) DEFAULT 0,
  `whatsapp_status` enum('sent','delivered','failed') DEFAULT NULL,
  `whatsapp_message_id` varchar(255) DEFAULT NULL,
  `api_response` text DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `customer_id` (`customer_id`),
  KEY `bill_id` (`bill_id`),
  KEY `idx_notification_status` (`status`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table officer_areas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `officer_areas`;

CREATE TABLE `officer_areas` (
  `user_id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`,`area_id`),
  KEY `area_id` (`area_id`),
  KEY `idx_officer_areas_user` (`user_id`),
  KEY `idx_officer_areas_area` (`area_id`),
  CONSTRAINT `officer_areas_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `areas` (`area_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





# Dump of table officers_backup
# ------------------------------------------------------------

DROP TABLE IF EXISTS `officers_backup`;

CREATE TABLE `officers_backup` (
  `officer_id` int(11) NOT NULL DEFAULT 0,
  `user_id` int(11) NOT NULL,
  `area_id` int(11) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT 0.00,
  `join_date` date NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table payment_allocations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `payment_allocations`;

CREATE TABLE `payment_allocations` (
  `allocation_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `bill_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`allocation_id`),
  KEY `payment_id` (`payment_id`),
  KEY `bill_id` (`bill_id`),
  CONSTRAINT `payment_allocations_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`),
  CONSTRAINT `payment_allocations_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table payment_documents
# ------------------------------------------------------------

DROP TABLE IF EXISTS `payment_documents`;

CREATE TABLE `payment_documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `document_type` enum('receipt','history') NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`document_id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `payment_documents_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table payments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `bill_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('cash','transfer','qris') NOT NULL,
  `balance_used` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_payment_power` decimal(10,2) NOT NULL DEFAULT 0.00,
  `transaction_date` datetime DEFAULT current_timestamp(),
  `transaction_id` varchar(100) DEFAULT NULL,
  `proof_url` varchar(255) DEFAULT NULL,
  `receipt_url` varchar(255) DEFAULT NULL COMMENT 'URL ke file PDF struk di Cloudinary',
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `reconciled` tinyint(1) DEFAULT 0,
  `reconciliation_date` datetime DEFAULT NULL,
  `sync_status` enum('online','offline_pending','offline_synced') DEFAULT 'online',
  `payment_type` enum('full','installment','excess','debt','miscellaneous') NOT NULL DEFAULT 'full',
  `is_debt_payment` tinyint(1) NOT NULL DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `verification_date` datetime DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `printed_count` int(11) DEFAULT 0,
  PRIMARY KEY (`payment_id`),
  KEY `idx_payment_status` (`status`),
  KEY `idx_payments_bill` (`bill_id`),
  KEY `idx_payment_date` (`transaction_date`),
  KEY `idx_user` (`user_id`),
  KEY `idx_payments_customer` (`customer_id`),
  KEY `idx_payments_user_date` (`user_id`,`transaction_date`),
  KEY `idx_payments_status_date` (`status`,`transaction_date`),
  KEY `idx_payments_customer_date` (`customer_id`,`transaction_date`),
  KEY `idx_payments_bill_date` (`bill_id`,`transaction_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table reading_flags
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reading_flags`;

CREATE TABLE `reading_flags` (
  `flag_id` int(11) NOT NULL AUTO_INCREMENT,
  `reading_id` int(11) NOT NULL,
  `flag_type` enum('reading_note','meter_replacement','reading_correction','system_note','suspicious') NOT NULL,
  `flag_value` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`flag_id`),
  KEY `reading_id` (`reading_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `reading_flags_ibfk_1` FOREIGN KEY (`reading_id`) REFERENCES `meter_readings` (`reading_id`),
  CONSTRAINT `reading_flags_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table system_logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `system_logs`;

CREATE TABLE `system_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `log_type` enum('user_activity','system_event','data_change','error') NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `affected_table` varchar(50) DEFAULT NULL,
  `affected_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `severity` enum('info','warning','error','critical') DEFAULT 'info',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_year` int(11) DEFAULT NULL,
  PRIMARY KEY (`log_id`,`created_at`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER ;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO" */;;
/*!50003 CREATE */ /*!50017  */ /*!50003 TRIGGER `before_insert_system_logs` BEFORE INSERT ON `system_logs` FOR EACH ROW BEGIN
    SET NEW.created_year = YEAR(NEW.created_at);
END */;;
DELIMITER ;
/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','petugas') NOT NULL DEFAULT 'petugas',
  `phone_number` varchar(20) NOT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_login_allowed` tinyint(1) DEFAULT 1,
  `salary` decimal(10,2) DEFAULT 0.00,
  `join_date` date DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_customer_search` (`full_name`,`phone_number`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`user_id`, `username`, `full_name`, `password`, `role`, `phone_number`, `whatsapp_number`, `is_active`, `created_at`, `updated_at`, `is_login_allowed`, `salary`, `join_date`, `last_login`)
VALUES
	(1,'sitihajar','Siti Hajar','$2b$10$cOwQ5uKkazicxacxjEY/reMR64RQYUDaNcSjLO.zbUZZreOjgTK8u','admin','081234078787878',NULL,1,'2025-03-08 01:29:58','2025-08-07 21:31:00',1,0.00,NULL,'2025-03-27 02:13:30'),
	(3,'officer','OFFICER TEST','$2b$10$yUWYVq3Di7hfSkfHw0575.bs/pbYRS40gF8gDRCTv5sjkkmm0L7NG','petugas','08123328989899','0908989898989',1,'2025-07-11 12:13:32','2025-07-11 12:13:32',1,3000000.00,'2025-07-11',NULL);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;










# Dump of table water_rates
# ------------------------------------------------------------

DROP TABLE IF EXISTS `water_rates`;

CREATE TABLE `water_rates` (
  `rate_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `minimum_usage` decimal(10,2) DEFAULT 2.00,
  `rate_per_cubic` decimal(10,2) DEFAULT 4000.00,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`rate_id`),
  UNIQUE KEY `uk_category_effective_date` (`category_id`,`effective_date`),
  CONSTRAINT `fk_rate_category` FOREIGN KEY (`category_id`) REFERENCES `customer_categories` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `water_rates` WRITE;
/*!40000 ALTER TABLE `water_rates` DISABLE KEYS */;

INSERT INTO `water_rates` (`rate_id`, `category_id`, `minimum_usage`, `rate_per_cubic`, `effective_date`, `end_date`, `created_at`)
VALUES
	(1,1,2.00,5000.00,'2025-01-01',NULL,'2025-06-19 19:47:16'),
	(2,2,2.00,3000.00,'2025-01-01',NULL,'2025-06-19 19:47:16'),
	(3,3,2.00,3500.00,'2025-01-01',NULL,'2025-06-19 19:47:16'),
	(4,4,10.00,8000.00,'2025-01-01',NULL,'2025-06-19 19:47:16');

/*!40000 ALTER TABLE `water_rates` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of view officer_revenue_view
# ------------------------------------------------------------

DROP TABLE IF EXISTS `officer_revenue_view`; DROP VIEW IF EXISTS `officer_revenue_view`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `officer_revenue_view`
AS SELECT
   `p`.`payment_id` AS `payment_id`,
   `p`.`user_id` AS `user_id`,
   `u`.`full_name` AS `officer_name`,
   `u`.`username` AS `officer_username`,
   `u`.`role` AS `officer_role`,
   `cust`.`area_id` AS `area_id`,
   `a`.`area_name` AS `area_name`,
   `p`.`customer_id` AS `customer_id`,
   `cust`.`full_name` AS `customer_name`,
   `p`.`bill_id` AS `bill_id`,
   `p`.`amount` AS `amount`,
   `p`.`total_payment_power` AS `total_payment_power`,
   `p`.`method` AS `method`,
   `p`.`payment_type` AS `payment_type`,
   `p`.`status` AS `status`,
   `p`.`transaction_date` AS `transaction_date`,cast(`p`.`transaction_date` as date) AS `transaction_date_only`,year(`p`.`transaction_date`) AS `transaction_year`,month(`p`.`transaction_date`) AS `transaction_month`,dayofmonth(`p`.`transaction_date`) AS `transaction_day`
FROM ((((`payments` `p` join `users` `u` on(`p`.`user_id` = `u`.`user_id`)) left join `bills` `b` on(`p`.`bill_id` = `b`.`bill_id`)) left join `customers` `cust` on(coalesce(`b`.`customer_id`,`p`.`customer_id`) = `cust`.`customer_id`)) join `areas` `a` on(`cust`.`area_id` = `a`.`area_id`)) where `p`.`status` = 'completed' and `u`.`role` = 'petugas';

# Dump of view monthly_reports
# ------------------------------------------------------------

DROP TABLE IF EXISTS `monthly_reports`; DROP VIEW IF EXISTS `monthly_reports`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `monthly_reports`
AS SELECT
   `b`.`bill_id` AS `bill_id`,
   `c`.`customer_id` AS `customer_id`,
   `c`.`full_name` AS `customer_name`,
   `b`.`period_start` AS `period_start`,
   `b`.`period_end` AS `period_end`,
   `b`.`amount` AS `amount`,
   `p`.`status` AS `payment_status`
FROM ((`bills` `b` join `customers` `c` on(`b`.`customer_id` = `c`.`customer_id`)) left join `payments` `p` on(`b`.`bill_id` = `p`.`bill_id`));

# Dump of view v_area_revenue_daily
# ------------------------------------------------------------

DROP TABLE IF EXISTS `v_area_revenue_daily`; DROP VIEW IF EXISTS `v_area_revenue_daily`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_area_revenue_daily`
AS SELECT
   `a`.`area_id` AS `area_id`,
   `a`.`area_name` AS `area_name`,cast(`p`.`transaction_date` as date) AS `payment_date`,sum(`p`.`total_payment_power`) AS `total_revenue`
FROM ((`payments` `p` join `customers` `c` on(`p`.`customer_id` = `c`.`customer_id`)) join `areas` `a` on(`c`.`area_id` = `a`.`area_id`)) where `p`.`status` = 'completed' group by `a`.`area_id`,`a`.`area_name`,cast(`p`.`transaction_date` as date);

# Dump of view v_customer_history_summary
# ------------------------------------------------------------

DROP TABLE IF EXISTS `v_customer_history_summary`; DROP VIEW IF EXISTS `v_customer_history_summary`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_customer_history_summary`
AS SELECT
   `c`.`customer_id` AS `id`,
   `c`.`full_name` AS `name`,
   `c`.`address` AS `address`,
   `c`.`area_id` AS `area_id`,
   `a`.`area_name` AS `area`,
   `c`.`phone_number` AS `phoneNumber`,
   `c`.`status` AS `status`,
   `c`.`saldo` AS `saldo`,
   `c`.`hutang` AS `hutang`,
   `c`.`meter_number` AS `meterNumber`,
   `cc`.`category_name` AS `category_name`,(select max(`mr`.`reading_date`)
FROM `meter_readings` `mr` where `mr`.`customer_id` = `c`.`customer_id` and `mr`.`deleted_at` is null) AS `lastReadingDate`,(select `p`.`transaction_date` from `payments` `p` where `p`.`customer_id` = `c`.`customer_id` order by `p`.`transaction_date` desc limit 1) AS `lastPaymentDate`,(select count(`b`.`bill_id`) from `bills` `b` where `b`.`customer_id` = `c`.`customer_id` and `b`.`status` in ('unpaid','partial','overdue')) AS `unpaidBills`,coalesce(`avg_mr`.`avg_usage`,0) AS `averageUsage` from (((`customers` `c` left join `areas` `a` on(`c`.`area_id` = `a`.`area_id`)) left join `customer_categories` `cc` on(`c`.`category_id` = `cc`.`category_id`)) left join (select `meter_readings`.`customer_id` AS `customer_id`,avg(`meter_readings`.`water_usage`) AS `avg_usage` from `meter_readings` where `meter_readings`.`reading_date` >= curdate() - interval 3 month and `meter_readings`.`deleted_at` is null group by `meter_readings`.`customer_id`) `avg_mr` on(`c`.`customer_id` = `avg_mr`.`customer_id`));

# Dump of view v_admin_customer_list
# ------------------------------------------------------------

DROP TABLE IF EXISTS `v_admin_customer_list`; DROP VIEW IF EXISTS `v_admin_customer_list`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_admin_customer_list`
AS SELECT
   `c`.`customer_id` AS `customer_id`,
   `c`.`full_name` AS `full_name`,
   `c`.`meter_number` AS `meter_number`,
   `c`.`address` AS `address`,
   `c`.`phone_number` AS `phone_number`,
   `c`.`status` AS `status`,
   `c`.`saldo` AS `saldo`,
   `c`.`hutang` AS `hutang`,
   `c`.`registration_date` AS `registration_date`,
   `a`.`area_id` AS `area_id`,
   `a`.`area_name` AS `area_name`,
   `cat`.`category_id` AS `category_id`,
   `cat`.`category_name` AS `category_name`,(select count(0)
FROM `bills` `b` where `b`.`customer_id` = `c`.`customer_id` and `b`.`status` in ('unpaid','partial','overdue')) AS `unpaid_bills_count`,(select group_concat(`u`.`full_name` separator ', ') from (`users` `u` join `officer_areas` `oa` on(`u`.`user_id` = `oa`.`user_id`)) where `oa`.`area_id` = `c`.`area_id`) AS `officer_in_charge` from ((`customers` `c` left join `areas` `a` on(`c`.`area_id` = `a`.`area_id`)) left join `customer_categories` `cat` on(`c`.`category_id` = `cat`.`category_id`));

# Dump of view customer_debt_summary
# ------------------------------------------------------------

DROP TABLE IF EXISTS `customer_debt_summary`; DROP VIEW IF EXISTS `customer_debt_summary`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `customer_debt_summary`
AS SELECT
   `c`.`customer_id` AS `customer_id`,sum(`b`.`amount`) - coalesce(sum(`p`.`amount`),0) AS `total_debt`
FROM ((`customers` `c` join `bills` `b` on(`c`.`customer_id` = `b`.`customer_id`)) left join `payments` `p` on(`b`.`bill_id` = `p`.`bill_id`)) where `b`.`status` in ('unpaid','partial','overdue') group by `c`.`customer_id`;

# Dump of view v_officer_area_income
# ------------------------------------------------------------

DROP TABLE IF EXISTS `v_officer_area_income`; DROP VIEW IF EXISTS `v_officer_area_income`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_officer_area_income`
AS SELECT
   `u`.`user_id` AS `officer_id`,
   `u`.`full_name` AS `officer_name`,
   `a`.`area_id` AS `area_id`,
   `a`.`area_name` AS `area_name`,cast(date_format(`p`.`transaction_date`,'%Y-%m') as char charset utf8mb4) collate utf8mb4_unicode_ci AS `payment_month`,sum(`p`.`total_payment_power`) AS `total_income`
FROM ((((`payments` `p` join `customers` `c` on(`p`.`customer_id` = `c`.`customer_id`)) join `areas` `a` on(`c`.`area_id` = `a`.`area_id`)) join `officer_areas` `oa` on(`a`.`area_id` = `oa`.`area_id`)) join `users` `u` on(`oa`.`user_id` = `u`.`user_id`)) where `p`.`status` = 'completed' and `p`.`customer_id` is not null and `u`.`role` = 'petugas' group by `u`.`user_id`,`u`.`full_name`,`a`.`area_id`,`a`.`area_name`,cast(date_format(`p`.`transaction_date`,'%Y-%m') as char charset utf8mb4) collate utf8mb4_unicode_ci order by `u`.`full_name`,`a`.`area_name`,cast(date_format(`p`.`transaction_date`,'%Y-%m') as char charset utf8mb4) collate utf8mb4_unicode_ci desc;

# Dump of view monthly_billing_summary
# ------------------------------------------------------------

DROP TABLE IF EXISTS `monthly_billing_summary`; DROP VIEW IF EXISTS `monthly_billing_summary`;

CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `monthly_billing_summary`
AS SELECT
   `c`.`customer_id` AS `customer_id`,
   `c`.`full_name` AS `full_name`,cast(date_format(`b`.`period_end`,'%Y-%m') as char charset utf8mb4) collate utf8mb4_unicode_ci AS `bulan`,sum(greatest(`mr`.`water_usage`,
   `wr`.`minimum_usage`) * `wr`.`rate_per_cubic`) AS `total_tagihan`,coalesce(sum(`p`.`amount`),0) AS `total_pembayaran`,sum(greatest(`mr`.`water_usage`,
   `wr`.`minimum_usage`) * `wr`.`rate_per_cubic`) - coalesce(sum(`p`.`amount`),0) AS `sisa_hutang`
FROM ((((`customers` `c` join `bills` `b` on(`c`.`customer_id` = `b`.`customer_id`)) join `meter_readings` `mr` on(`b`.`reading_id` = `mr`.`reading_id`)) join `water_rates` `wr` on(`b`.`rate_id` = `wr`.`rate_id`)) left join `payments` `p` on(`b`.`bill_id` = `p`.`bill_id`)) group by `c`.`customer_id`,cast(date_format(`b`.`period_end`,'%Y-%m') as char charset utf8mb4) collate utf8mb4_unicode_ci;


--
-- Dumping routines (PROCEDURE) for database 'tagihan_air'
--
DELIMITER ;;

# Dump of PROCEDURE CancelReadingAndBill
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `CancelReadingAndBill` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `CancelReadingAndBill`(IN `p_bill_id` INT, IN `p_user_id` INT, OUT `p_result` JSON)
BEGIN
    DECLARE v_reading_id INT;
    DECLARE v_customer_id INT;

    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', 'Gagal membatalkan transaksi.');
    END;

    START TRANSACTION;

    
    SELECT reading_id, customer_id INTO v_reading_id, v_customer_id 
    FROM bills WHERE bill_id = p_bill_id;

    IF v_reading_id IS NOT NULL THEN
        
        
        UPDATE bills SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), ' Dibatalkan oleh user ID: ', p_user_id) WHERE bill_id = p_bill_id;

        
        UPDATE meter_readings SET deleted_at = NOW() WHERE reading_id = v_reading_id;

        
        CALL update_customer_debt_final(v_customer_id);

        COMMIT;
        SET p_result = JSON_OBJECT('success', TRUE, 'message', 'Tagihan dan pencatatan meter telah dibatalkan.');
    ELSE
        ROLLBACK;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', 'Tagihan tidak ditemukan untuk dibatalkan.');
    END IF;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE ClosePeriodAndRecordRetainedEarnings
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `ClosePeriodAndRecordRetainedEarnings` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `ClosePeriodAndRecordRetainedEarnings`(IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_user_id` INT, OUT `p_result` JSON)
BEGIN
    DECLARE v_net_profit DECIMAL(15,2);
    DECLARE v_existing_record INT DEFAULT 0;
    DECLARE v_description VARCHAR(255);

    SELECT COUNT(*) INTO v_existing_record 
    FROM equity_transactions 
    WHERE type = 'LABA_DITAHAN_PERIODIK' AND transaction_date = p_end_date;

    IF v_existing_record > 0 THEN
        SET p_result = JSON_OBJECT('success', FALSE, 'message', 'Periode ini sudah ditutup.');
    ELSE
        
        SELECT COALESCE(SUM(CASE 
                                
                                
                                
                                WHEN f.type = 'income' AND f.cashflow_classification IN ('OPERATING', 'INVESTING') THEN f.amount 
                                WHEN f.type = 'expense' AND f.cashflow_classification = 'OPERATING' THEN -f.amount
                                ELSE 0 
                           END), 0)
        INTO v_net_profit
        FROM financials f
        WHERE f.date BETWEEN p_start_date AND p_end_date;

        SET v_description = CONCAT('Akumulasi laba bersih periode ', DATE_FORMAT(p_start_date, '%d-%m-%Y'), ' s/d ', DATE_FORMAT(p_end_date, '%d-%m-%Y'));

        INSERT INTO equity_transactions (transaction_date, `type`, amount, description, created_by)
        VALUES (p_end_date, 'LABA_DITAHAN_PERIODIK', v_net_profit, v_description, p_user_id);
        
        SET p_result = JSON_OBJECT('success', TRUE, 'message', 'Proses tutup buku berhasil.', 'net_profit_recorded', v_net_profit);
    END IF;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE CreateBillFromReading_v2
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `CreateBillFromReading_v2` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `CreateBillFromReading_v2`(IN `p_customer_id` INT, IN `p_user_id` INT, IN `p_current_reading` DECIMAL(10,2), IN `p_reading_date` DATE, IN `p_notes` TEXT, IN `p_image_url` VARCHAR(255), OUT `p_result` JSON)
BEGIN
    
    DECLARE v_previous_reading DECIMAL(10,2);
    DECLARE v_last_reading_date DATE;
    DECLARE v_reading_id INT;
    DECLARE v_bill_id INT;
    DECLARE v_rate_id INT;
    DECLARE v_rate_per_cubic DECIMAL(10,2);
    DECLARE v_min_usage DECIMAL(10,2);
    DECLARE v_usage DECIMAL(10,2);
    DECLARE v_bill_amount DECIMAL(10,2);
    DECLARE v_period_start DATE;
    DECLARE v_period_end DATE;
    DECLARE v_due_date DATE;
    DECLARE v_error_message VARCHAR(255);
    DECLARE v_customer_category_id INT;
    
    
    DECLARE v_done INT DEFAULT FALSE;
    
    
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', CONCAT('Transaksi dibatalkan. Error: ', v_error_message));
    END;

    START TRANSACTION;

    
    SELECT `current_reading`, `reading_date` INTO v_previous_reading, v_last_reading_date
    FROM `meter_readings` 
    WHERE `customer_id` = p_customer_id AND `deleted_at` IS NULL 
    ORDER BY `reading_date` DESC, `reading_id` DESC 
    LIMIT 1;
    
    
    
    IF v_done THEN
        SET v_previous_reading = 0;
        SET v_last_reading_date = NULL;
    END IF;

    
    IF v_last_reading_date IS NOT NULL AND p_reading_date <= v_last_reading_date THEN
        SET v_error_message = CONCAT('Tanggal pembacaan harus setelah tanggal terakhir (', DATE_FORMAT(v_last_reading_date, '%d-%m-%Y'), ').');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;

    
    IF p_current_reading < v_previous_reading THEN
        SET v_error_message = 'Angka meter saat ini tidak boleh lebih kecil dari sebelumnya.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;

    SELECT category_id INTO v_customer_category_id FROM customers WHERE customer_id = p_customer_id;
    IF v_customer_category_id IS NULL THEN
        SET v_customer_category_id = 1;
    END IF;
    
    SELECT rate_id, rate_per_cubic, minimum_usage INTO v_rate_id, v_rate_per_cubic, v_min_usage
    FROM water_rates WHERE category_id = v_customer_category_id AND effective_date <= p_reading_date 
    ORDER BY effective_date DESC LIMIT 1;

    IF v_rate_id IS NULL THEN
        SET v_error_message = CONCAT('Tarif tidak ditemukan untuk kategori pelanggan (ID: ', v_customer_category_id, ').');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_message;
    END IF;
    
    SET v_usage = p_current_reading - v_previous_reading;
    SET v_bill_amount = GREATEST(v_usage, v_min_usage) * v_rate_per_cubic;

    
    INSERT INTO meter_readings (customer_id, user_id, previous_reading, current_reading, reading_date, notes, status, image_url) VALUES (p_customer_id, p_user_id, v_previous_reading, p_current_reading, p_reading_date, p_notes, 'verified', p_image_url);
    SET v_reading_id = LAST_INSERT_ID();
    SET v_period_start = DATE_FORMAT(p_reading_date, '%Y-%m-01');
    SET v_period_end = LAST_DAY(p_reading_date);
    SET v_due_date = v_period_end + INTERVAL 20 DAY;
    INSERT INTO bills (customer_id, reading_id, rate_id, rate_per_cubic, period_start, period_end, due_date, amount, status, notes) VALUES (p_customer_id, v_reading_id, v_rate_id, v_rate_per_cubic, v_period_start, v_period_end, v_due_date, v_bill_amount, 'unpaid', p_notes);
    SET v_bill_id = LAST_INSERT_ID();
    UPDATE meter_readings SET bill_id = v_bill_id WHERE reading_id = v_reading_id;

    COMMIT;
    
    SET p_result = JSON_OBJECT('success', TRUE, 'message', 'Pencatatan meter dan tagihan berhasil dibuat.', 'readingId', v_reading_id, 'billId', v_bill_id, 'billAmount', v_bill_amount);
    
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GenerateBalanceSheet
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GenerateBalanceSheet` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GenerateBalanceSheet`(IN `p_end_date` DATE)
BEGIN
    DECLARE v_kas_dan_bank DECIMAL(15,2) DEFAULT 0;
    DECLARE v_piutang_usaha DECIMAL(15,2) DEFAULT 0;
    DECLARE v_aset_tetap DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_aset DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_kewajiban DECIMAL(15,2) DEFAULT 0;
    DECLARE v_modal_akhir DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_kewajiban_dan_ekuitas DECIMAL(15,2) DEFAULT 0;
    DECLARE v_status VARCHAR(20) DEFAULT 'SEIMBANG';
    DECLARE v_balance_sheet JSON;
    
    
    
    
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'income' THEN amount 
        WHEN type = 'expense' THEN -amount 
        ELSE 0 
    END), 0) INTO v_kas_dan_bank
    FROM financials 
    WHERE date <= p_end_date;
    
    
    SELECT COALESCE(SUM(hutang), 0) INTO v_piutang_usaha
    FROM customers 
    WHERE status = 'active';
    
    
    
    SELECT COALESCE(SUM(acquisition_cost), 0) INTO v_aset_tetap
    FROM fixed_assets 
    WHERE acquisition_date <= p_end_date
    AND (status = 'active' OR status IS NULL);
    
    
    IF v_aset_tetap = 0 THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_aset_tetap
        FROM financials 
        WHERE date <= p_end_date
        AND type = 'expense'
        AND category = 'inv_beli_aset';
    END IF;
    
    
    SET v_total_aset = v_kas_dan_bank + v_piutang_usaha + v_aset_tetap;
    
    
    
    
    SELECT COALESCE(SUM(saldo), 0) INTO v_total_kewajiban
    FROM customers 
    WHERE saldo > 0 AND status = 'active';
    
    
    
    
    SELECT COALESCE(SUM(CASE 
        WHEN type IN ('MODAL_AWAL', 'SETORAN_MODAL', 'LABA_DITAHAN_PERIODIK') THEN amount 
        WHEN type = 'PRIVE' THEN -amount 
        ELSE 0 
    END), 0) INTO v_modal_akhir
    FROM equity_transactions 
    WHERE transaction_date <= p_end_date;
    
    
    SET v_modal_akhir = v_modal_akhir + (
        SELECT COALESCE(SUM(CASE 
            WHEN type = 'income' AND cashflow_classification IN ('OPERATING', 'INVESTING') THEN amount 
            WHEN type = 'expense' AND cashflow_classification = 'OPERATING' THEN -amount 
            ELSE 0 
        END), 0) 
        FROM financials 
        WHERE date <= p_end_date 
        AND date > (
            SELECT COALESCE(MAX(transaction_date), '1900-01-01') 
            FROM equity_transactions 
            WHERE type = 'LABA_DITAHAN_PERIODIK'
        )
    );
    
    
    SET v_total_kewajiban_dan_ekuitas = v_total_kewajiban + v_modal_akhir;
    
    
    IF ABS(v_total_aset - v_total_kewajiban_dan_ekuitas) > 0.01 THEN
        SET v_status = 'TIDAK SEIMBANG';
    ELSE
        SET v_status = 'SEIMBANG';
    END IF;
    
    
    SET v_balance_sheet = JSON_OBJECT(
        'periode', p_end_date,
        'aset', JSON_OBJECT(
            'aset_lancar', JSON_OBJECT(
                'kas_dan_bank', FORMAT(v_kas_dan_bank, 2),
                'piutang_usaha', FORMAT(v_piutang_usaha, 2)
            ),
            'aset_tetap', JSON_OBJECT(
                'peralatan_dan_inventaris', FORMAT(v_aset_tetap, 2)
            ),
            'total_aset', FORMAT(v_total_aset, 2)
        ),
        'kewajiban_dan_ekuitas', JSON_OBJECT(
            'kewajiban', JSON_OBJECT(
                'total_kewajiban', FORMAT(v_total_kewajiban, 2)
            ),
            'ekuitas', JSON_OBJECT(
                'modal_akhir', FORMAT(v_modal_akhir, 2)
            ),
            'total_kewajiban_dan_ekuitas', v_total_kewajiban_dan_ekuitas
        ),
        'status', v_status,
        'debug_info', JSON_OBJECT(
            'kas_calculation', FORMAT(v_kas_dan_bank, 2),
            'fixed_assets_from_table', FORMAT((
                SELECT COALESCE(SUM(acquisition_cost), 0)
                FROM fixed_assets 
                WHERE acquisition_date <= p_end_date
            ), 2),
            'fixed_assets_from_financials', FORMAT((
                SELECT COALESCE(SUM(amount), 0)
                FROM financials 
                WHERE date <= p_end_date
                AND type = 'expense'
                AND category = 'inv_beli_aset'
            ), 2),
            'equity_from_transactions', FORMAT((
                SELECT COALESCE(SUM(CASE 
                    WHEN type IN ('MODAL_AWAL', 'SETORAN_MODAL', 'LABA_DITAHAN_PERIODIK') THEN amount 
                    WHEN type = 'PRIVE' THEN -amount 
                    ELSE 0 
                END), 0)
                FROM equity_transactions 
                WHERE transaction_date <= p_end_date
            ), 2),
            'difference', FORMAT(v_total_aset - v_total_kewajiban_dan_ekuitas, 2)
        )
    );
    
    
    SELECT v_balance_sheet AS balance_sheet;
    
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetAdminCustomerHistory
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetAdminCustomerHistory` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetAdminCustomerHistory`(IN `p_customer_id` INT)
BEGIN
    
    SELECT
        c.full_name AS customerName, c.address, c.phone_number AS phone,
        c.meter_number AS meterNumber, a.area_name AS area, c.saldo, c.hutang
    FROM customers c
    JOIN areas a ON c.area_id = a.area_id
    WHERE c.customer_id = p_customer_id;

    
    SELECT
        b.bill_id, p.payment_id, b.period_end AS periode,
        mr.previous_reading, mr.current_reading,
        mr.water_usage AS pemakaian,
        b.amount AS jumlah, b.paid_amount AS dibayar, (b.amount - b.paid_amount) AS sisa,
        b.status, b.due_date AS jatuh_tempo,
        JSON_OBJECT('user_id', u_reader.user_id, 'full_name', u_reader.full_name) AS petugas_pencatat,
        p.method AS metode, p.transaction_date AS tgl_bayar,
        
        mr.notes AS catatan_meter,
        b.notes AS catatan_tagihan,
        mr.image_url AS bukti_meter, 
        p.proof_url AS bukti_bayar,   
        JSON_OBJECT('user_id', u_collector.user_id, 'full_name', u_collector.full_name) AS petugas_kasir
    FROM bills b
    LEFT JOIN meter_readings mr ON b.reading_id = mr.reading_id
    LEFT JOIN users u_reader ON mr.user_id = u_reader.user_id
    LEFT JOIN payments p ON b.bill_id = p.bill_id
    LEFT JOIN users u_collector ON p.user_id = u_collector.user_id
    WHERE b.customer_id = p_customer_id AND b.status != 'cancelled'
    ORDER BY b.period_end DESC;

    
    CALL GetCustomerDebtPaymentHistory(p_customer_id);

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetAdminCustomerLedgerTransactions
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetAdminCustomerLedgerTransactions` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetAdminCustomerLedgerTransactions`(IN `p_customer_id` INT)
BEGIN
    
    SELECT * FROM (
        
        SELECT
            c.registration_date AS event_date,
            'PENDAFTARAN' AS event_type,
            'Pelanggan bergabung' AS description,
            0 AS debit,
            0 AS credit,
            JSON_OBJECT('nama', c.full_name, 'kategori', cat.category_name, 'wilayah', a.area_name) AS details_json
        FROM customers c
        JOIN areas a ON c.area_id = a.area_id
        JOIN customer_categories cat ON c.category_id = cat.category_id
        WHERE c.customer_id = p_customer_id

        UNION ALL

        
        SELECT
            b.period_end AS event_date,
            'TAGIHAN' AS event_type,
            CONCAT('Tagihan Periode ', DATE_FORMAT(b.period_end, '%b %Y')) AS description,
            b.amount AS debit,
            0 AS credit,
            JSON_OBJECT(
                'bill_id', b.bill_id,
                'meter_usage_m3', mr.water_usage,
                'meter_reading', mr.current_reading,
                'meter_photo_url', mr.image_url,
                'officer', u.full_name
            ) AS details_json
        FROM bills b
        JOIN meter_readings mr ON b.reading_id = mr.reading_id
        LEFT JOIN users u ON mr.user_id = u.user_id
        WHERE b.customer_id = p_customer_id AND b.status != 'cancelled'

        UNION ALL

        
        SELECT
            p.transaction_date AS event_date,
            'PEMBAYARAN' AS event_type,
            CONCAT('Pembayaran via ', p.method) AS description,
            0 AS debit,
            p.amount AS credit,
            JSON_OBJECT(
                'payment_id', p.payment_id,
                'payment_type', p.payment_type,
                'proof_url', p.proof_url,
                'officer', u.full_name,
                'allocations', CONCAT('[', COALESCE((SELECT GROUP_CONCAT(JSON_OBJECT('bill_id', pa.bill_id, 'allocated_amount', pa.amount)) FROM payment_allocations pa WHERE pa.payment_id = p.payment_id), ''), ']')
            ) AS details_json
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.user_id
        WHERE p.customer_id = p_customer_id AND p.status = 'completed'
    ) AS ledger
    ORDER BY event_date DESC, event_type DESC;

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetAllAppSettings
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetAllAppSettings` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetAllAppSettings`()
BEGIN
    SELECT setting_key, setting_value FROM app_settings;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetCustomerBillingHistory
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetCustomerBillingHistory` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetCustomerBillingHistory`(IN `p_customer_id` INT)
BEGIN
    SELECT
        b.bill_id,
        b.period_start,
        b.period_end,
        b.amount,
        b.paid_amount,
        b.status AS bill_status,
        b.due_date,
        
        mr.reading_id,
        mr.current_reading,
        mr.previous_reading,
        mr.water_usage,
        mr.reading_date,
        mr.image_url,
        mr.notes, 
        
        u.full_name AS officer_name,
        
        p.payment_id,
        p.amount AS payment_amount,
        p.method AS payment_method,
        p.transaction_date AS payment_date
    FROM
        `bills` AS b
    LEFT JOIN
        `meter_readings` AS mr ON b.reading_id = mr.reading_id
    LEFT JOIN
        `users` AS u ON mr.user_id = u.user_id
    LEFT JOIN
        `payments` AS p ON b.bill_id = p.bill_id AND p.status = 'completed'
    WHERE
        b.customer_id = p_customer_id
        AND b.status != 'cancelled'
    ORDER BY
        b.period_end DESC;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetCustomerDebtPaymentHistory
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetCustomerDebtPaymentHistory` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetCustomerDebtPaymentHistory`(IN `p_customer_id` INT)
BEGIN
    SELECT
        p.payment_id,
        p.amount AS total_payment_amount,
        p.method,
        p.transaction_date,
        u.full_name AS officer_name,
        
        CONCAT(
            '[',
            COALESCE(
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'allocation_id', pa.allocation_id,
                        'bill_id', pa.bill_id,
                        'allocated_amount', pa.amount,
                        'bill_period_start', b.period_start,
                        'bill_period_end', b.period_end,
                        'bill_total_amount', b.amount,
                        'final_bill_status', b.status
                    )
                ),
                '' 
            ),
            ']'
        ) AS allocations
    FROM
        payments AS p
    JOIN
        payment_allocations AS pa ON p.payment_id = pa.payment_id
    LEFT JOIN
        users AS u ON p.user_id = u.user_id
    LEFT JOIN
        bills AS b ON pa.bill_id = b.bill_id
    WHERE
        p.customer_id = p_customer_id 
        AND p.payment_type = 'debt'
    GROUP BY
        p.payment_id
    ORDER BY
        p.transaction_date DESC;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetOfficerRevenueByAreaReport
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetOfficerRevenueByAreaReport` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetOfficerRevenueByAreaReport`(IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_period_type` VARCHAR(10))
BEGIN
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    DECLARE v_date_format VARCHAR(20);

    
    IF p_period_type = 'daily' THEN
        SET v_date_format = '%Y-%m-%d'; 
    ELSEIF p_period_type = 'weekly' THEN
        SET v_date_format = '%x-%v'; 
    ELSE
        
        SET v_date_format = '%Y-%m'; 
    END IF;

    
    SELECT
        DATE_FORMAT(v.transaction_date, v_date_format) AS period,
        v.officer_name,
        v.area_name,
        
        SUM(v.total_payment_power) AS total_revenue_by_area,
        
        COUNT(v.payment_id) AS total_transactions
    FROM
        officer_revenue_view AS v
    WHERE
        
        CAST(v.transaction_date AS DATE) BETWEEN p_start_date AND p_end_date
    GROUP BY
        period,
        v.officer_name,
        v.area_name
    ORDER BY
        period DESC,
        v.officer_name ASC,
        v.area_name ASC;

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetOfficerRevenueSummary
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetOfficerRevenueSummary` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetOfficerRevenueSummary`(IN `p_start_date` DATE, IN `p_end_date` DATE)
BEGIN
    
    
    
    
    
    
    
    
    
    
    
    

    SELECT
        v.user_id AS officer_id,
        v.officer_name,
        
        SUM(v.total_payment_power) AS total_revenue,
        
        COUNT(v.payment_id) AS total_transactions,
        
        COUNT(DISTINCT v.customer_id) AS unique_customers_served,
        
        GROUP_CONCAT(DISTINCT v.area_name ORDER BY v.area_name SEPARATOR ', ') AS handled_areas
    FROM
        officer_revenue_view AS v
    WHERE
        
        CAST(v.transaction_date AS DATE) BETWEEN p_start_date AND p_end_date
    GROUP BY
        v.user_id, v.officer_name
    ORDER BY
        total_revenue DESC;

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetPaymentDetailsForAdmin
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetPaymentDetailsForAdmin` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetPaymentDetailsForAdmin`(IN `p_payment_id` INT)
BEGIN
    SELECT
        p.payment_id,
        p.transaction_date,
        p.method,
        p.amount,
        p.balance_used,
        p.total_payment_power,
        p.proof_url,
        p.payment_type,
        u.user_id AS officer_id,
        u.full_name AS officer_name,
        c.customer_id,
        c.full_name AS customer_name,
        (SELECT CONCAT('[', COALESCE(GROUP_CONCAT(JSON_OBJECT('document_type', pd.document_type, 'url', pd.url)), ''), ']')
         FROM payment_documents pd WHERE pd.payment_id = p.payment_id) AS documents_json,
        (SELECT CONCAT('[', COALESCE(GROUP_CONCAT(JSON_OBJECT(
            'bill_id', pa.bill_id,
            'bill_period', DATE_FORMAT(b.period_end, '%M %Y'),
            'allocated_amount', pa.amount
         )), ''), ']')
         FROM payment_allocations pa JOIN bills b ON pa.bill_id = b.bill_id
         WHERE pa.payment_id = p.payment_id) AS allocations_json
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.user_id
    LEFT JOIN customers c ON p.customer_id = c.customer_id OR c.customer_id = (SELECT bills.customer_id FROM bills WHERE bills.bill_id = p.bill_id LIMIT 1)
    WHERE p.payment_id = p_payment_id;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE GetPetugasDashboardStats
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `GetPetugasDashboardStats` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `GetPetugasDashboardStats`(IN `p_officer_id` INT, OUT `p_result` JSON)
BEGIN
    
    
    
    
    
    
    

    
    DECLARE v_current_month_revenue DECIMAL(15,2) DEFAULT 0;
    DECLARE v_previous_month_revenue DECIMAL(15,2) DEFAULT 0;
    DECLARE v_chart_data_string LONGTEXT;
    DECLARE v_totalCustomers INT DEFAULT 0;
    DECLARE v_totalUsageThisMonth DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paidTransactionsThisMonth INT DEFAULT 0;
    DECLARE v_totalUnpaidBills INT DEFAULT 0;
    DECLARE v_customersWithDebt INT DEFAULT 0;
    DECLARE v_customersNotBilledThisMonth INT DEFAULT 0;
    DECLARE v_customersWithOverdueBills INT DEFAULT 0;
    DECLARE v_totalDebt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_totalBillsThisMonth INT DEFAULT 0;
    DECLARE v_totalPaymentsThisMonth DECIMAL(10,2) DEFAULT 0;
    DECLARE v_error_message VARCHAR(255);

    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', CONCAT('Error di dalam prosedur: ', v_error_message));
    END;

    
    
    

    
    SELECT
        COALESCE(SUM(CASE WHEN transaction_date >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN total_payment_power ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_date BETWEEN DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01') AND LAST_DAY(NOW() - INTERVAL 1 MONTH) THEN total_payment_power ELSE 0 END), 0)
    INTO v_current_month_revenue, v_previous_month_revenue
    FROM officer_revenue_view
    WHERE user_id = p_officer_id;

    
    SELECT CONCAT('[', COALESCE(GROUP_CONCAT(JSON_OBJECT('monthLabel', monthLabel, 'monthlyRevenue', monthlyRevenue)), ''), ']')
    INTO v_chart_data_string
    FROM (
        SELECT
            DATE_FORMAT(transaction_date, '%b') AS monthLabel,
            SUM(total_payment_power) AS monthlyRevenue
        FROM officer_revenue_view
        WHERE user_id = p_officer_id AND transaction_date >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
        GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
        ORDER BY DATE_FORMAT(transaction_date, '%Y-%m') ASC
    ) AS chart_query;


    
    
    

    
    SELECT COUNT(c.customer_id) INTO v_totalCustomers
    FROM customers c
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id;

    
    SELECT IFNULL(SUM(mr.water_usage), 0) INTO v_totalUsageThisMonth
    FROM meter_readings mr
    JOIN customers c ON mr.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND MONTH(mr.reading_date) = MONTH(CURDATE()) AND YEAR(mr.reading_date) = YEAR(CURDATE());

    
    SELECT COUNT(b.bill_id) INTO v_paidTransactionsThisMonth
    FROM bills b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND MONTH(b.period_end) = MONTH(CURDATE()) AND YEAR(b.period_end) = YEAR(CURDATE())
      AND b.status = 'paid';

    
    SELECT COUNT(b.bill_id) INTO v_totalUnpaidBills
    FROM bills b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND MONTH(b.period_end) = MONTH(CURDATE()) AND YEAR(b.period_end) = YEAR(CURDATE())
      AND b.status IN ('unpaid', 'partial');

    
    SELECT COUNT(DISTINCT c.customer_id) INTO v_customersWithDebt
    FROM customers c
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND c.hutang > 0;

    
    SELECT COUNT(c.customer_id) INTO v_customersNotBilledThisMonth
    FROM customers c
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND NOT EXISTS (
        SELECT 1 FROM bills b
        WHERE b.customer_id = c.customer_id
          AND MONTH(b.period_end) = MONTH(CURDATE()) AND YEAR(b.period_end) = YEAR(CURDATE())
      );

    
    SELECT COUNT(DISTINCT c.customer_id) INTO v_customersWithOverdueBills
    FROM bills b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND b.status IN ('unpaid', 'partial', 'overdue')
      AND b.due_date < CURDATE();

    
    SELECT IFNULL(SUM(c.hutang), 0) INTO v_totalDebt
    FROM customers c
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id;

    
    SELECT COUNT(b.bill_id) INTO v_totalBillsThisMonth
    FROM bills b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND MONTH(b.period_end) = MONTH(CURDATE()) AND YEAR(b.period_end) = YEAR(CURDATE());

    
    SELECT IFNULL(SUM(p.total_payment_power), 0) INTO v_totalPaymentsThisMonth
    FROM payments p
    JOIN customers c ON p.customer_id = c.customer_id
    JOIN officer_areas oa ON c.area_id = oa.area_id
    WHERE oa.user_id = p_officer_id
      AND p.status = 'completed'
      AND MONTH(p.transaction_date) = MONTH(CURDATE()) AND YEAR(p.transaction_date) = YEAR(CURDATE());

    
    
    
    SET p_result = JSON_OBJECT(
        'success', TRUE,
        'data', JSON_OBJECT(
            'revenueCard', JSON_OBJECT(
                'currentMonthRevenue', v_current_month_revenue,
                'previousMonthRevenue', v_previous_month_revenue
            ),
            'kpiCards', JSON_OBJECT(
                'totalCustomers', v_totalCustomers,
                'totalUsageThisMonth', v_totalUsageThisMonth,
                'paidTransactionsThisMonth', v_paidTransactionsThisMonth,
                'totalUnpaidBills', v_totalUnpaidBills,
                'customersWithDebt', v_customersWithDebt,
                'customersNotBilledThisMonth', v_customersNotBilledThisMonth,
                'customersWithOverdueBills', v_customersWithOverdueBills,
                'totalDebt', v_totalDebt,
                'totalBillsThisMonth', v_totalBillsThisMonth,
                'totalPaymentsThisMonth', v_totalPaymentsThisMonth
            ),
            'revenueChart', v_chart_data_string
        )
    );

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE InitializeExistingCustomer
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `InitializeExistingCustomer` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `InitializeExistingCustomer`(IN `p_full_name` VARCHAR(100), IN `p_area_id` INT, IN `p_category_id` INT, IN `p_phone_number` VARCHAR(20), IN `p_address` TEXT, IN `p_registration_date` DATE, IN `p_meter_number` INT, IN `p_last_meter_reading` DECIMAL(10,2), IN `p_last_reading_date` DATE, IN `p_initial_debt` DECIMAL(10,2), IN `p_initial_saldo` DECIMAL(10,2), IN `p_notes` TEXT, IN `p_created_by_user_id` INT, OUT `p_result` JSON)
BEGIN
    DECLARE v_customer_id INT;
    DECLARE v_reading_id INT;
    DECLARE v_existing_customer INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(255);

    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', CONCAT('Migrasi Gagal. Error: ', v_error_message));
    END;

    
    SELECT COUNT(*) INTO v_existing_customer FROM customers WHERE phone_number = p_phone_number;
    IF v_existing_customer > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pelanggan dengan nomor telepon ini sudah terdaftar.';
    END IF;

    START TRANSACTION;

    
    
    INSERT INTO customers (full_name, area_id, category_id, meter_number, phone_number, address, status, registration_date, saldo, hutang)
    VALUES (p_full_name, p_area_id, p_category_id, p_meter_number, p_phone_number, p_address, 'active', p_registration_date, p_initial_saldo, p_initial_debt);

    SET v_customer_id = LAST_INSERT_ID();

    
    
    
    IF p_last_meter_reading >= 0 AND p_last_reading_date IS NOT NULL THEN
        INSERT INTO meter_readings (customer_id, user_id, previous_reading, current_reading, reading_date, status, notes, bill_id)
        VALUES (
            v_customer_id, 
            p_created_by_user_id, 
            0.00,                 
            p_last_meter_reading, 
            p_last_reading_date, 
            'verified', 
            CONCAT('MIGRASI SISTEM: Titik awal meter dari sistem manual. ', COALESCE(p_notes, '')),
            NULL                  
        );
        SET v_reading_id = LAST_INSERT_ID();
    ELSE
        SET v_reading_id = NULL; 
    END IF;

    
    
    IF p_initial_debt > 0 THEN
        INSERT INTO bills (customer_id, reading_id, rate_id, rate_per_cubic, period_start, period_end, due_date, amount, paid_amount, status, notes)
        VALUES (
            v_customer_id,
            v_reading_id, 
            p_category_id, 
            0.00,         
            DATE_SUB(p_last_reading_date, INTERVAL 1 MONTH), 
            p_last_reading_date,
            p_last_reading_date,
            p_initial_debt, 
            0.00,
            'overdue',      
            'MIGRASI SISTEM: Akumulasi tunggakan dari sistem manual.'
        );
    END IF;

    COMMIT;
    SET p_result = JSON_OBJECT(
        'success', TRUE, 
        'message', 'Pelanggan lama berhasil dimigrasikan.',
        'customerId', v_customer_id
    );

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE PayCustomerDebt
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `PayCustomerDebt` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `PayCustomerDebt`(IN `p_customer_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_method` ENUM('cash','transfer','qris'), IN `p_user_id` INT, IN `p_proof_url` VARCHAR(255), OUT `p_result` JSON)
BEGIN
    
    DECLARE v_total_debt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(10,2);
    DECLARE v_remaining_payment DECIMAL(10,2);
    DECLARE v_payment_id INT;
    DECLARE v_bill_id INT;
    DECLARE v_amount_due DECIMAL(10,2);
    DECLARE v_alloc_amount DECIMAL(10,2);
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(255);
    DECLARE v_recalculated_debt DECIMAL(10,2) DEFAULT 0;
    DECLARE v_new_debt DECIMAL(10,2);
    DECLARE v_new_balance DECIMAL(10,2);

    DECLARE cur CURSOR FOR
        SELECT bill_id, (amount - paid_amount)
        FROM bills
        WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partial', 'overdue')
        ORDER BY period_end ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', CONCAT('Transaksi dibatalkan. Error: ', v_error_message));
    END;

    SELECT hutang INTO v_total_debt FROM customers WHERE customer_id = p_customer_id;

    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah pembayaran harus lebih dari nol.';
    END IF;

    IF p_amount > v_total_debt THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah pembayaran melebihi total hutang.';
    END IF;

    SET v_payment_amount = p_amount;
    SET v_remaining_payment = v_payment_amount;

    START TRANSACTION;

    INSERT INTO payments (customer_id, user_id, amount, method, payment_type, status, proof_url, total_payment_power) 
    VALUES (p_customer_id, p_user_id, v_payment_amount, p_method, 'debt', 'completed', p_proof_url, v_payment_amount);
    SET v_payment_id = LAST_INSERT_ID();

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_bill_id, v_amount_due;
        IF v_done OR v_remaining_payment <= 0 THEN
            LEAVE read_loop;
        END IF;
        SET v_alloc_amount = LEAST(v_remaining_payment, v_amount_due);
        UPDATE bills SET paid_amount = paid_amount + v_alloc_amount WHERE bill_id = v_bill_id;
        INSERT INTO payment_allocations (payment_id, bill_id, amount) VALUES (v_payment_id, v_bill_id, v_alloc_amount);
        SET v_remaining_payment = v_remaining_payment - v_alloc_amount;
    END LOOP;
    CLOSE cur;

    UPDATE bills
    SET status = CASE
        WHEN paid_amount >= amount THEN 'paid'
        WHEN paid_amount > 0 AND paid_amount < amount THEN 'partial'
        ELSE 'unpaid'
    END
    WHERE customer_id = p_customer_id AND status != 'cancelled';

    SELECT COALESCE(SUM(amount - paid_amount), 0)
    INTO v_recalculated_debt
    FROM bills
    WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partial', 'overdue');
    
    UPDATE customers SET hutang = v_recalculated_debt WHERE customer_id = p_customer_id;

    
    INSERT INTO financials (type, amount, description, payment_id, category, cashflow_classification, created_by, date)
    VALUES ('income', v_payment_amount, CONCAT('Pemasukan dari pembayaran hutang pelanggan #', p_customer_id), v_payment_id, 'debt_payment', 'OPERATING', p_user_id, CURDATE());

    COMMIT;
    
    SELECT hutang, saldo INTO v_new_debt, v_new_balance FROM customers WHERE customer_id = p_customer_id;

    SET p_result = JSON_OBJECT(
        'success', TRUE,
        'message', 'Pembayaran hutang berhasil diproses.',
        'paymentId', v_payment_id,
        'newDebt', v_new_debt,
        'newBalance', v_new_balance
    );
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE ProcessSinglePayment_v2
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `ProcessSinglePayment_v2` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `ProcessSinglePayment_v2`(IN `p_bill_id` INT, IN `p_user_id` INT, IN `p_amount_paid` DECIMAL(10,2), IN `p_method` ENUM('cash','transfer','qris'), IN `p_use_balance` BOOLEAN, IN `p_proof_url` VARCHAR(255), OUT `p_result` JSON)
BEGIN
    
    DECLARE v_customer_id INT;
    DECLARE v_initial_saldo DECIMAL(10,2);
    DECLARE v_amount_due DECIMAL(10,2);
    DECLARE v_shortage DECIMAL(10,2);
    DECLARE v_balance_to_use DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_payment_power DECIMAL(10,2);
    DECLARE v_excess_amount DECIMAL(10,2);
    DECLARE v_payment_id INT;
    DECLARE v_new_saldo DECIMAL(10,2);
    DECLARE v_new_hutang DECIMAL(10,2);
    DECLARE v_error_message VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', CONCAT('Transaksi dibatalkan. Error: ', v_error_message));
    END;

    START TRANSACTION;

    SELECT b.customer_id, (b.amount - b.paid_amount), c.saldo
    INTO v_customer_id, v_amount_due, v_initial_saldo
    FROM `bills` b JOIN `customers` c ON b.customer_id = c.customer_id
    WHERE b.bill_id = p_bill_id FOR UPDATE;

    IF v_customer_id IS NOT NULL THEN
        IF p_use_balance AND p_amount_paid < v_amount_due AND v_initial_saldo > 0 THEN
            SET v_shortage = v_amount_due - p_amount_paid;
            SET v_balance_to_use = LEAST(v_shortage, v_initial_saldo);
        END IF;

        SET v_total_payment_power = p_amount_paid + v_balance_to_use;
        SET v_excess_amount = v_total_payment_power - v_amount_due;

        UPDATE `customers`
        SET `saldo` = `saldo` - v_balance_to_use + IF(v_excess_amount > 0, v_excess_amount, 0)
        WHERE `customer_id` = v_customer_id;

        UPDATE `bills`
        SET `paid_amount` = `paid_amount` + LEAST(v_total_payment_power, v_amount_due)
        WHERE `bill_id` = p_bill_id;

        CALL update_bill_status_final(p_bill_id);
        CALL update_customer_debt_final(v_customer_id);

        INSERT INTO `payments` 
            (`bill_id`, `user_id`, `amount`, `method`, `balance_used`, `total_payment_power`, `status`, `proof_url`)
        VALUES 
            (p_bill_id, p_user_id, p_amount_paid, p_method, v_balance_to_use, v_total_payment_power, 'completed', p_proof_url);
        SET v_payment_id = LAST_INSERT_ID();

        IF v_total_payment_power > 0 THEN
            
            INSERT INTO `financials` 
                (`type`, `amount`, `description`, `payment_id`, `category`, `cashflow_classification`, `created_by`, `date`)
            VALUES (
                'income',
                v_total_payment_power,
                CONCAT('Pemasukan dari pembayaran tagihan #', p_bill_id),
                v_payment_id,
                'payment_bill',
                'OPERATING', 
                p_user_id,
                CURDATE()
            );
        END IF;

        SELECT `saldo`, `hutang` INTO v_new_saldo, v_new_hutang
        FROM `customers` WHERE `customer_id` = v_customer_id;

        COMMIT;

        SET p_result = JSON_OBJECT(
            'success', TRUE,
            'message', 'Pembayaran berhasil diproses.',
            'paymentId', v_payment_id,
            'newBalance', v_new_saldo,
            'newDebt', v_new_hutang,
            'balanceUsed', v_balance_to_use,
            'excessAmount', IF(v_excess_amount > 0, v_excess_amount, 0)
        );
    ELSE
        ROLLBACK;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', 'Tagihan tidak ditemukan.');
    END IF;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE ReconcileDailyBalance
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `ReconcileDailyBalance` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `ReconcileDailyBalance`(IN `p_date` DATE)
BEGIN
    DECLARE v_prev_balance DECIMAL(15,2) DEFAULT 0;
    DECLARE v_daily_net_cash_change DECIMAL(15,2);
    DECLARE v_new_balance DECIMAL(15,2);
    DECLARE v_total_income DECIMAL(15,2);
    DECLARE v_total_expense DECIMAL(15,2);

    
    
    SELECT COALESCE(cash_balance, 0) + COALESCE(bank_balance, 0) INTO v_prev_balance
    FROM financial_records
    WHERE date < p_date
    ORDER BY date DESC
    LIMIT 1;

    
    SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
    INTO v_daily_net_cash_change
    FROM financials
    WHERE date = p_date;

    
    SET v_new_balance = v_prev_balance + v_daily_net_cash_change;

    
    SELECT COALESCE(SUM(amount),0) INTO v_total_income FROM financials WHERE date=p_date AND type='income';
    SELECT COALESCE(SUM(amount),0) INTO v_total_expense FROM financials WHERE date=p_date AND type='expense';

    
    INSERT INTO financial_records (date, cash_balance, bank_balance, total_income, total_expense)
    VALUES (p_date, 0, v_new_balance, v_total_income, v_total_expense)
    ON DUPLICATE KEY UPDATE
        bank_balance = VALUES(bank_balance),
        cash_balance = VALUES(cash_balance),
        total_income = VALUES(total_income),
        total_expense = VALUES(total_expense);
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE SuspendOverdueCustomers
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `SuspendOverdueCustomers` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `SuspendOverdueCustomers`()
BEGIN
    UPDATE customers c
    SET c.status = 'suspended'
    WHERE EXISTS (
        SELECT 1 
        FROM bills b 
        WHERE b.customer_id = c.customer_id
        AND b.due_date < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        AND b.status IN ('unpaid', 'partial', 'overdue')
    );
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE SyncOfflineData
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `SyncOfflineData` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `SyncOfflineData`(IN `officer` INT)
BEGIN
  
  INSERT INTO meter_readings (customer_id, reading_date, current_reading, officer_id) 
  SELECT mro.customer_id, mro.reading_date, mro.reading, mro.officer_id
  FROM meter_readings_offline mro
  WHERE mro.reading > (
    SELECT COALESCE(MAX(current_reading), 0) 
    FROM meter_readings 
    WHERE customer_id = mro.customer_id
  );
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE UpdateAppSetting
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `UpdateAppSetting` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `UpdateAppSetting`(IN `p_key` VARCHAR(50), IN `p_value` TEXT)
BEGIN
    UPDATE app_settings SET setting_value = p_value WHERE setting_key = p_key;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE UpdateCustomerPhoneNumber
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `UpdateCustomerPhoneNumber` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `UpdateCustomerPhoneNumber`(IN `p_customer_id` INT, IN `p_phone_number` VARCHAR(20))
BEGIN
    
    IF p_phone_number IS NULL OR LENGTH(p_phone_number) < 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Format nomor telepon tidak valid.';
    END IF;

    
    UPDATE `customers`
    SET 
        `phone_number` = p_phone_number
    WHERE `customer_id` = p_customer_id;

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE update_bill_status_final
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `update_bill_status_final` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `update_bill_status_final`(IN `p_bill_id` INT)
BEGIN
    UPDATE `bills` SET `status` = IF((`amount` - `paid_amount`) <= 0.01, 'paid', 'partial')
    WHERE `bill_id` = p_bill_id;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE update_customer_debt_final
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `update_customer_debt_final` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `update_customer_debt_final`(IN `p_customer_id` INT)
BEGIN
    UPDATE `customers` c SET c.hutang = (
        SELECT COALESCE(SUM(b.amount - b.paid_amount), 0)
        FROM `bills` b
        WHERE b.customer_id = p_customer_id AND b.status IN ('unpaid', 'partial', 'overdue')
    ) WHERE c.customer_id = p_customer_id;
END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
# Dump of PROCEDURE UseBalanceToPayBills
# ------------------------------------------------------------

/*!50003 DROP PROCEDURE IF EXISTS `UseBalanceToPayBills` */;;
/*!50003 SET SESSION SQL_MODE="NO_AUTO_VALUE_ON_ZERO"*/;;
/*!50003 CREATE*/ /*!50020 */ /*!50003 PROCEDURE `UseBalanceToPayBills`(IN `p_customer_id` INT, IN `p_user_id` INT, OUT `p_result` JSON)
BEGIN
    DECLARE v_available_saldo DECIMAL(10,2) DEFAULT 0;
    DECLARE v_bill_id INT;
    DECLARE v_amount_due DECIMAL(10,2);
    DECLARE v_payment_for_this_bill DECIMAL(10,2);
    DECLARE v_total_paid_from_balance DECIMAL(10,2) DEFAULT 0;
    DECLARE v_payment_id INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE bill_cursor CURSOR FOR 
        SELECT bill_id, (amount - paid_amount) as sisa 
        FROM bills 
        WHERE customer_id = p_customer_id 
          AND status IN ('unpaid', 'partial', 'overdue') 
        ORDER BY due_date ASC;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    
    SELECT saldo INTO v_available_saldo FROM customers WHERE customer_id = p_customer_id;

    IF v_available_saldo > 0 THEN
        START TRANSACTION;

        OPEN bill_cursor;
        payment_loop: LOOP
            FETCH bill_cursor INTO v_bill_id, v_amount_due;
            
            IF done OR v_available_saldo <= 0 THEN
                LEAVE payment_loop;
            END IF;

            SET v_payment_for_this_bill = LEAST(v_available_saldo, v_amount_due);

            UPDATE bills SET paid_amount = paid_amount + v_payment_for_this_bill WHERE bill_id = v_bill_id;
            CALL update_bill_status_final(v_bill_id);
            
            SET v_available_saldo = v_available_saldo - v_payment_for_this_bill;
            SET v_total_paid_from_balance = v_total_paid_from_balance + v_payment_for_this_bill;

        END LOOP;
        CLOSE bill_cursor;

        
        INSERT INTO payments (customer_id, user_id, amount, method, balance_used, total_payment_power, status, payment_type)
        VALUES (p_customer_id, p_user_id, 0, 'balance', v_total_paid_from_balance, v_total_paid_from_balance, 'completed', 'full');
        SET v_payment_id = LAST_INSERT_ID();

        UPDATE customers SET saldo = v_available_saldo WHERE customer_id = p_customer_id;
        CALL update_customer_debt_final(p_customer_id);

        COMMIT;
        
        SET p_result = JSON_OBJECT(
            'success', TRUE, 
            'message', CONCAT('Saldo sebesar ', FORMAT(v_total_paid_from_balance, 0), ' berhasil digunakan untuk membayar tagihan.'),
            'paymentId', v_payment_id,
            'remainingSaldo', v_available_saldo
        );
    ELSE
        SET p_result = JSON_OBJECT('success', FALSE, 'message', 'Pelanggan tidak memiliki saldo.');
    END IF;

END */;;

/*!50003 SET SESSION SQL_MODE=@OLD_SQL_MODE */;;
DELIMITER ;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
