/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19-12.0.2-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sekai
-- ------------------------------------------------------
-- Server version	12.0.2-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `cheerful`
--

DROP TABLE IF EXISTS `cheerful`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheerful` (
  `cheerful_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cheerful_event_id` int(11) unsigned DEFAULT NULL,
  `cheerful_round_id` int(11) unsigned DEFAULT NULL,
  `cheerful_A_id` int(11) unsigned DEFAULT NULL,
  `cheerful_B_id` int(11) unsigned DEFAULT NULL,
  `cheerful_A` int(11) unsigned DEFAULT NULL,
  `cheerful_B` int(11) unsigned DEFAULT NULL,
  `cheerful_info` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`cheerful_id`),
  KEY `cheerful_event_id` (`cheerful_event_id`),
  KEY `idx_cheerful_count` (`cheerful_event_id`,`cheerful_round_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `log_date` datetime DEFAULT current_timestamp(),
  `log_ip` varchar(256) NOT NULL,
  `log_username` varchar(64) NOT NULL,
  `log_action` varchar(1024) NOT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3975 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `profile_id` bigint(20) DEFAULT NULL,
  `profile_nickname` varchar(255) DEFAULT NULL,
  `profile_decks` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`profile_decks`)),
  `profile_total_score` varchar(2048) DEFAULT NULL,
  `profile_updated` int(11) DEFAULT NULL,
  KEY `profile_id` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scoreboard`
--

DROP TABLE IF EXISTS `scoreboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scoreboard` (
  `scoreboard_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scoreboard_event_id` int(11) unsigned DEFAULT NULL,
  `scoreboard_type` int(11) unsigned DEFAULT NULL,
  `scoreboard_round` int(11) unsigned DEFAULT NULL,
  `scoreboard_profile_id` bigint(20) DEFAULT NULL,
  `scoreboard_nickname` varchar(255) DEFAULT NULL,
  `scoreboard_score` bigint(20) unsigned DEFAULT NULL,
  `scoreboard_updated` bigint(20) unsigned DEFAULT NULL,
  `scoreboard_rank` int(11) unsigned DEFAULT NULL,
  `scoreboard_info_cheerful` varchar(255) DEFAULT NULL,
  `scoreboard_info_card` varchar(512) DEFAULT NULL,
  `scoreboard_info_etc` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`scoreboard_id`),
  KEY `scoreboard_round` (`scoreboard_round`),
  KEY `scoreboard_type` (`scoreboard_type`),
  KEY `scoreboard_event_id` (`scoreboard_event_id`),
  KEY `idx_event_round_profile_type` (`scoreboard_event_id`,`scoreboard_round`,`scoreboard_profile_id`,`scoreboard_type`,`scoreboard_score`),
  KEY `idx_event_round` (`scoreboard_event_id`,`scoreboard_round`),
  KEY `idx_profile_type` (`scoreboard_profile_id`,`scoreboard_type`),
  KEY `idx_event_rank` (`scoreboard_event_id`,`scoreboard_rank`)
) ENGINE=InnoDB AUTO_INCREMENT=17458671 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scoreboard_current`
--

DROP TABLE IF EXISTS `scoreboard_current`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scoreboard_current` (
  `scoreboard_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scoreboard_event_id` int(11) unsigned DEFAULT NULL,
  `scoreboard_type` int(11) unsigned DEFAULT NULL,
  `scoreboard_round` int(11) unsigned DEFAULT NULL,
  `scoreboard_profile_id` bigint(20) DEFAULT NULL,
  `scoreboard_nickname` varchar(255) DEFAULT NULL,
  `scoreboard_score` bigint(20) unsigned DEFAULT NULL,
  `scoreboard_updated` bigint(20) unsigned DEFAULT NULL,
  `scoreboard_rank` int(11) unsigned DEFAULT NULL,
  `scoreboard_info_cheerful` varchar(255) DEFAULT NULL,
  `scoreboard_info_card` varchar(512) DEFAULT NULL,
  `scoreboard_info_etc` varchar(1024) DEFAULT NULL,
  `scoreboard_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`scoreboard_id`),
  KEY `scoreboard_round` (`scoreboard_round`),
  KEY `scoreboard_type` (`scoreboard_type`),
  KEY `scoreboard_event_id` (`scoreboard_event_id`),
  KEY `idx_event_round_profile_type` (`scoreboard_event_id`,`scoreboard_round`,`scoreboard_profile_id`,`scoreboard_type`,`scoreboard_score`),
  KEY `idx_event_round` (`scoreboard_event_id`,`scoreboard_round`),
  KEY `idx_profile_type` (`scoreboard_profile_id`,`scoreboard_type`),
  KEY `idx_event_rank` (`scoreboard_event_id`,`scoreboard_rank`),
  KEY `idx_type_round` (`scoreboard_type`,`scoreboard_round` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=4875439 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scoreboard_history`
--

DROP TABLE IF EXISTS `scoreboard_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scoreboard_history` (
  `scoreboard_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `scoreboard_event_id` int(11) unsigned DEFAULT NULL,
  `scoreboard_rank` int(11) unsigned DEFAULT NULL,
  `scoreboard_profile_id` bigint(20) DEFAULT NULL,
  `scoreboard_nickname` varchar(255) DEFAULT NULL,
  `scoreboard_score` bigint(20) unsigned DEFAULT NULL,
  `scoreboard_type` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`scoreboard_id`),
  KEY `scoreboard_type` (`scoreboard_type`),
  KEY `scoreboard_event_id` (`scoreboard_event_id`),
  KEY `scoreboard_profile_id` (`scoreboard_profile_id`),
  KEY `idx_profile_type` (`scoreboard_profile_id`,`scoreboard_type`),
  KEY `idx_event_rank` (`scoreboard_event_id`,`scoreboard_rank`)
) ENGINE=InnoDB AUTO_INCREMENT=15157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_username` varchar(64) NOT NULL,
  `user_password` varchar(256) NOT NULL,
  `user_friend_code` varchar(256) NOT NULL,
  `user_invite_code` varchar(256) DEFAULT NULL,
  `user_permission` int(11) DEFAULT 0,
  `user_date_register` datetime DEFAULT current_timestamp(),
  `user_date_login` datetime DEFAULT NULL,
  `user_ip` varchar(256) DEFAULT NULL,
  `user_ua` text DEFAULT NULL,
  `user_comment` text DEFAULT NULL,
  `user_current_session` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_username` (`user_username`),
  UNIQUE KEY `user_friend_code` (`user_friend_code`)
) ENGINE=InnoDB AUTO_INCREMENT=282 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-07 21:35:01
