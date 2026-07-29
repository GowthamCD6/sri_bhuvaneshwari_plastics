-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: gateway01.ap-southeast-1.prod.aws.tidbcloud.com    Database: bhuvaneshwari
-- ------------------------------------------------------
-- Server version	8.0.11-TiDB-v8.5.3-serverless

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customer_order_items`
--

DROP TABLE IF EXISTS `customer_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_order_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `component_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raw_material` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  `required_by_date` date DEFAULT NULL,
  `status` enum('Requested','In Progress','Completed','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Requested',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_coi_order` FOREIGN KEY (`order_id`) REFERENCES `customer_orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_order_items`
--

LOCK TABLES `customer_order_items` WRITE;
/*!40000 ALTER TABLE `customer_order_items` DISABLE KEYS */;
INSERT INTO `customer_order_items` VALUES (1,1,'HCV','Duracon Natural',100,'2026-07-25','Requested',NULL,'2026-07-21 09:40:24');
/*!40000 ALTER TABLE `customer_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_orders`
--

DROP TABLE IF EXISTS `customer_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `indent_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `indent_date` date NOT NULL,
  `created_by` int NOT NULL,
  `status` enum('Draft','Pending Store Review','Store Verified','Pending Admin Approval','Admin Approved','Rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'Draft',
  `delivery_status` enum('Open','Delivered') COLLATE utf8mb4_unicode_ci DEFAULT 'Open',
  `delivered_at` timestamp NULL DEFAULT NULL,
  `priority` enum('Standard','High','Urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'Standard',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_indent_id` (`indent_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  UNIQUE KEY `indent_id` (`indent_id`),
  KEY `idx_customer_orders_delivery_status` (`delivery_status`),
  CONSTRAINT `fk_co_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_co_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_orders`
--

LOCK TABLES `customer_orders` WRITE;
/*!40000 ALTER TABLE `customer_orders` DISABLE KEYS */;
INSERT INTO `customer_orders` VALUES (1,'IND-2026-001',NULL,'Acme Industries','3216549870','acmeind@gmail.com','2026-07-21',120002,'Admin Approved','Open',NULL,'Standard',NULL,'2026-07-21 09:40:24','2026-07-28 13:25:42');
/*!40000 ALTER TABLE `customer_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gstin` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dept_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_dept_name` (`dept_name`),
  UNIQUE KEY `dept_code` (`dept_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_calculator_rows`
--

DROP TABLE IF EXISTS `formula_calculator_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_calculator_rows` (
  `row_id` int NOT NULL AUTO_INCREMENT,
  `calculator_id` int NOT NULL,
  `part_name` varchar(200) NOT NULL,
  `raw_material` varchar(100) DEFAULT NULL,
  `cavity` int DEFAULT NULL,
  `component_weight` decimal(10,2) DEFAULT NULL,
  `runner_weight` decimal(10,2) DEFAULT NULL,
  `required_per_month` int DEFAULT NULL,
  `rate_per_kg` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `no_of_gravity` decimal(10,2) DEFAULT NULL,
  `rate_per_piece` decimal(12,4) DEFAULT NULL,
  `total_component_weight` decimal(14,6) DEFAULT NULL,
  `shot_weight` decimal(14,6) DEFAULT NULL,
  `process_loss` decimal(14,6) DEFAULT NULL,
  `total_shot_weight` decimal(14,6) DEFAULT NULL,
  `pieces_per_kg` decimal(14,6) DEFAULT NULL,
  `ppu_per_kg` decimal(14,6) DEFAULT NULL,
  `runner_return_per_piece` decimal(14,6) DEFAULT NULL,
  `amount` decimal(14,6) DEFAULT NULL,
  `raw_material_cost_per_component` decimal(14,6) DEFAULT NULL,
  `raw_material_for_total_qty` decimal(14,6) DEFAULT NULL,
  `rm_percentage` decimal(14,6) DEFAULT NULL,
  PRIMARY KEY (`row_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_calculator` (`calculator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=450001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_calculator_rows`
--

LOCK TABLES `formula_calculator_rows` WRITE;
/*!40000 ALTER TABLE `formula_calculator_rows` DISABLE KEYS */;
INSERT INTO `formula_calculator_rows` VALUES (270001,30001,'HCV','Duracon Natural',4,8.75,1.40,100,124.98,'2026-05-23 16:04:27','2026-06-05 13:01:08',4.00,2.2700,35.000000,36.400000,0.728000,37.128000,107.735402,107.735402,0.350000,227.000000,1.160064,0.928200,0.511042),(300001,30001,'Elbow squeegee','PU NAturlal',1,62.85,3.15,1000,601.00,'2026-05-23 16:31:43','2026-07-18 05:46:22',1.00,47.2500,62.850000,66.000000,1.320000,67.320000,14.854427,14.854427,3.150000,47250.000000,40.459320,67.320000,0.856282),(360001,30001,'Elbow squeegee','er4',4,56.00,35.00,46,3445.00,'2026-05-24 12:27:12','2026-05-24 12:27:12',4.00,455.0000,224.000000,259.000000,5.180000,264.180000,15.141192,15.141192,8.750000,20930.000000,227.525025,3.038070,0.500055),(390001,30001,'Lock Seal','HDPE Natural',8,1.99,7.45,99,99.13,'2026-06-05 11:25:47','2026-06-05 11:40:45',8.00,0.5800,15.920000,23.370000,0.467400,23.837400,335.607071,335.607071,0.931250,57.420000,0.295375,0.294988,0.509268),(420001,30001,'Coupling Guard','HDP PRE COLOUR RED',1,21.38,2.76,15000,110.00,'2026-07-18 07:06:11','2026-07-18 07:06:11',1.00,5.6200,21.380000,24.140000,0.482800,24.622800,40.612765,40.612765,2.760000,84300.000000,2.708508,369.342000,0.481941);
/*!40000 ALTER TABLE `formula_calculator_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_calculators`
--

DROP TABLE IF EXISTS `formula_calculators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_calculators` (
  `calculator_id` int NOT NULL AUTO_INCREMENT,
  `calculator_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`calculator_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=60001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_calculators`
--

LOCK TABLES `formula_calculators` WRITE;
/*!40000 ALTER TABLE `formula_calculators` DISABLE KEYS */;
INSERT INTO `formula_calculators` VALUES (1,'Default Calculator','Default formula calculator for store officer',0,NULL,'2026-04-13 06:25:38','2026-04-13 06:29:58'),(2,'Default Calculator','Default formula calculator for store officer',0,NULL,'2026-04-13 06:29:58','2026-04-13 06:46:45'),(3,'Default Calculator','Default formula calculator for store officer',0,NULL,'2026-04-13 06:46:45','2026-04-13 08:24:54'),(30001,'Default Calculator','Default formula calculator for store officer',1,NULL,'2026-04-13 08:24:54','2026-04-13 08:24:54');
/*!40000 ALTER TABLE `formula_calculators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indent_status_history`
--

DROP TABLE IF EXISTS `indent_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `indent_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `indent_id` int NOT NULL,
  `changed_by` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workflow_stage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_indent` (`indent_id`),
  KEY `idx_changed_at` (`changed_at`),
  KEY `fk_ish_changed_by` (`changed_by`),
  CONSTRAINT `fk_ish_indent` FOREIGN KEY (`indent_id`) REFERENCES `purchase_indents` (`indent_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ish_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=120001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indent_status_history`
--

LOCK TABLES `indent_status_history` WRITE;
/*!40000 ALTER TABLE `indent_status_history` DISABLE KEYS */;
INSERT INTO `indent_status_history` VALUES (1,1,120002,NULL,'Draft','QMS Init','Indent created','2026-07-21 09:41:25'),(30001,1,120003,'Pending Store Review','Pending QMS Verification','QMS Verified','PO details filled by Store Officer','2026-07-28 13:24:04'),(30002,1,120002,'Pending QMS Verification','Pending Admin Approval','Admin','Sent for Store Officer review','2026-07-28 13:24:24'),(30003,1,120001,'Pending Admin Approval','Admin Approved','Accountant','Sent for Store Officer review','2026-07-28 13:25:42'),(60001,30001,120004,NULL,'Draft','QMS Init','Indent created','2026-07-28 15:26:59'),(60002,30001,120002,'Pending QMS Verification','Pending QMS Verification','QMS Verified','Approved by QMS','2026-07-28 15:50:17'),(60003,30001,120002,'Pending QMS Verification','Pending Admin Approval','Admin','Approved by QMS','2026-07-28 15:56:49'),(90001,30001,120001,'Pending Admin Approval','Admin Approved','Accountant','Approved by QMS','2026-07-28 16:35:20');
/*!40000 ALTER TABLE `indent_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `current_stock` decimal(10,2) DEFAULT '0',
  `available_stock` decimal(10,2) DEFAULT '0',
  `reserved_stock` decimal(10,2) DEFAULT '0',
  `warehouse_location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_stocked_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_material_id` (`material_id`),
  KEY `idx_available_stock` (`available_stock`),
  UNIQUE KEY `material_id` (`material_id`),
  CONSTRAINT `fk_inv_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=510001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (60002,150004,132.00,132.00,0.00,'FG-38',NULL,'2026-02-23 10:56:41'),(60003,150005,234.00,234.00,0.00,'FD-394',NULL,'2026-02-23 05:44:02'),(60004,150006,23.00,23.00,0.00,'SA-233',NULL,'2026-02-23 05:45:33'),(60005,150008,23.00,23.00,0.00,'SATHY',NULL,'2026-02-23 05:53:12'),(90001,180001,223.00,223.00,0.00,'ODC',NULL,'2026-02-23 10:54:55'),(120001,210001,23.00,23.00,0.00,'656',NULL,'2026-02-24 06:46:50'),(150001,240002,878.00,878.00,0.00,'gtkhh',NULL,'2026-02-23 10:41:24'),(150002,240004,178.00,178.00,0.00,'regth',NULL,'2026-02-23 14:58:04'),(180001,240001,100.00,100.00,0.00,NULL,NULL,'2026-02-23 10:47:47'),(210001,270001,45.00,45.00,0.00,'hjhj',NULL,'2026-02-24 06:03:08'),(240001,300001,676.00,676.00,0.00,'ghjhj',NULL,'2026-02-24 06:33:48'),(240002,300003,545.00,545.00,0.00,'thiruppur',NULL,'2026-02-24 06:37:30'),(240003,300004,334.00,334.00,0.00,'Chpt',NULL,'2026-02-24 06:49:41'),(240004,300005,184.00,184.00,0.00,'yukuky',NULL,'2026-02-24 06:51:08'),(240005,300006,807.00,807.00,0.00,'ytdjj',NULL,'2026-02-24 06:53:22'),(240006,300007,778.00,778.00,0.00,'ytjhg',NULL,'2026-02-24 09:29:17'),(240007,300008,456615.00,456615.00,0.00,'rtyrty',NULL,'2026-02-27 09:31:36'),(270001,360001,56.00,56.00,0.00,'tfug\\',NULL,'2026-02-24 10:10:47'),(300001,390001,322.00,322.00,0.00,'zxc',NULL,'2026-02-25 10:02:11'),(330001,420001,39.00,39.00,0.00,'hjjh',NULL,'2026-02-26 06:46:40'),(360001,450001,150.00,150.00,0.00,'L1',NULL,'2026-03-16 08:09:29'),(360002,450002,150.00,150.00,0.00,'L2',NULL,'2026-03-16 03:28:33'),(360003,450003,150.00,150.00,0.00,'L3',NULL,'2026-03-16 03:29:26'),(360004,450004,150.00,150.00,0.00,'L4',NULL,'2026-03-16 03:30:03'),(360005,450005,180.00,180.00,0.00,'L5',NULL,'2026-03-16 03:30:47'),(360006,450006,170.00,170.00,0.00,'L6',NULL,'2026-03-16 03:32:13'),(360007,450007,170.00,170.00,0.00,'L8',NULL,'2026-03-16 03:36:00'),(360008,450008,150.00,150.00,0.00,'L16',NULL,'2026-03-16 03:37:01'),(360009,450009,10.00,10.00,0.00,'L21',NULL,'2026-03-16 03:40:02'),(360010,450010,5.00,5.00,0.00,'L27',NULL,'2026-03-16 03:40:58'),(390001,480001,1233.00,1233.00,0.00,'sdfh',NULL,'2026-04-10 09:40:55'),(420001,540001,1.00,1.00,0.00,'C1',NULL,'2026-07-20 05:10:27'),(420002,540002,5.00,5.00,0.00,'hjbs',NULL,'2026-06-21 09:55:39'),(450001,570001,0.00,0.00,0.00,NULL,NULL,'2026-06-21 10:16:04'),(450002,570002,100.00,100.00,0.00,'C6',NULL,'2026-07-20 05:28:50'),(450003,570003,0.00,0.00,0.00,NULL,NULL,'2026-06-21 10:16:04'),(450004,570004,0.00,0.00,0.00,'C3',NULL,'2026-07-20 05:11:10'),(450005,570005,0.00,0.00,0.00,'C5',NULL,'2026-07-20 05:27:54'),(450006,570006,0.00,0.00,0.00,NULL,NULL,'2026-06-21 10:16:05'),(450007,570007,0.00,0.00,0.00,'C2',NULL,'2026-07-20 05:28:13'),(480001,630001,2000.00,2000.00,0.00,'TEXM COMP - 1',NULL,'2026-07-18 07:00:04'),(480002,630002,550.00,550.00,0.00,'L3',NULL,'2026-07-18 07:08:07'),(480003,630003,0.00,0.00,0.00,'C4',NULL,'2026-07-20 05:28:37');
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `material_id` int NOT NULL AUTO_INCREMENT,
  `material_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_of_measurement` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_stock` decimal(10,2) DEFAULT '0',
  `min_stock_level` decimal(10,2) DEFAULT '0',
  `max_stock_level` decimal(10,2) DEFAULT NULL,
  `reorder_point` decimal(10,2) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `standard_cost` decimal(10,2) DEFAULT '0',
  `reorder_level` decimal(10,2) DEFAULT '0',
  `reorder_quantity` decimal(10,2) DEFAULT '0',
  `lead_time_days` int DEFAULT '0',
  `specifications` json DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `preferred_supplier` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Preferred supplier name for this material (display only)',
  `warehouse_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`material_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_material_code` (`material_code`),
  KEY `idx_material_name` (`material_name`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`),
  UNIQUE KEY `material_code` (`material_code`),
  KEY `fk_mat_created_by` (`created_by`),
  CONSTRAINT `fk_mat_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=660001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `changed_by` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_order` (`order_id`),
  KEY `idx_changed_at` (`changed_at`),
  KEY `fk_osh_changed_by` (`changed_by`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `customer_orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=240001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_indent_materials`
--

DROP TABLE IF EXISTS `purchase_indent_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_indent_materials` (
  `indent_material_id` int NOT NULL AUTO_INCREMENT,
  `indent_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  `material_description` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raw_material` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_of_measurement` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_stock` decimal(10,2) DEFAULT NULL,
  `required_stock` decimal(10,2) DEFAULT NULL,
  `preferred_supplier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `specifications` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `customer_part` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rm_cost` decimal(10,2) DEFAULT NULL,
  `rm_rate` decimal(10,2) DEFAULT NULL,
  `pieces_per_kg` decimal(10,2) DEFAULT NULL,
  `rm_percentage` decimal(5,2) DEFAULT NULL,
  `po_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`indent_material_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_indent` (`indent_id`),
  KEY `idx_material` (`material_id`),
  CONSTRAINT `fk_pim_indent` FOREIGN KEY (`indent_id`) REFERENCES `purchase_indents` (`indent_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pim_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=90001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_indents`
--

DROP TABLE IF EXISTS `purchase_indents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_indents` (
  `indent_id` int NOT NULL AUTO_INCREMENT,
  `indent_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_order_id` int DEFAULT NULL,
  `requested_by` int NOT NULL,
  `request_date` date NOT NULL,
  `required_by_date` date DEFAULT NULL,
  `priority` enum('Normal','Standard','High','Urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Draft','Pending Store Review','Store Verified','Pending QMS Verification','QMS Verified','Pending Admin Approval','Admin Approved','Rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'Draft',
  `workflow_stage` enum('Purchase Dept','QMS Init','Store Officer','QMS Verified','Admin','Accountant','Completed') COLLATE utf8mb4_unicode_ci DEFAULT 'QMS Init',
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_officer_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qms_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountant_notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_quantity` decimal(10,2) DEFAULT NULL,
  `rm_cost` decimal(10,2) DEFAULT NULL,
  `rm_rate` decimal(10,2) DEFAULT NULL,
  `pieces_per_kg` decimal(10,2) DEFAULT NULL,
  `rm_percentage` decimal(5,2) DEFAULT NULL,
  `po_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`indent_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_indent_number` (`indent_number`),
  KEY `idx_customer_order` (`customer_order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_workflow_stage` (`workflow_stage`),
  KEY `idx_requested_by` (`requested_by`),
  UNIQUE KEY `indent_number` (`indent_number`),
  CONSTRAINT `fk_pi_customer_order` FOREIGN KEY (`customer_order_id`) REFERENCES `customer_orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=60001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_rp_permission` (`permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_adjustments` (
  `adjustment_id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `adjustment_type` enum('IN','OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_of_measurement` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_stock` decimal(10,2) NOT NULL,
  `new_stock` decimal(10,2) NOT NULL,
  `reason` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adjusted_by` int NOT NULL,
  `adjusted_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`adjustment_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_material` (`material_id`),
  KEY `idx_adjusted_at` (`adjusted_at`),
  KEY `fk_sa_adjusted_by` (`adjusted_by`),
  CONSTRAINT `fk_sa_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sa_adjusted_by` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=330001;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `store_requests`
--

DROP TABLE IF EXISTS `store_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `request_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` int NOT NULL,
  `dept_id` int DEFAULT NULL,
  `item_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_id` int DEFAULT NULL,
  `material_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specs` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_of_measurement` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `needed_by_date` date DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('Normal','Urgent','Critical') COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `status` enum('Pending','Approved','Rejected','Processed') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `storage_location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_date` date NOT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `indent_id` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_request_number` (`request_number`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_request_date` (`request_date`),
  UNIQUE KEY `request_number` (`request_number`),
  KEY `fk_sr_requested_by` (`requested_by`),
  KEY `fk_sr_dept` (`dept_id`),
  KEY `fk_sr_material` (`material_id`),
  KEY `fk_sr_indent` (`indent_id`),
  CONSTRAINT `fk_sr_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sr_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_material` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_indent` FOREIGN KEY (`indent_id`) REFERENCES `purchase_indents` (`indent_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=30001;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
