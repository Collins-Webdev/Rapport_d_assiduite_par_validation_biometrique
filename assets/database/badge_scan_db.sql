-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 12 juin 2025 à 22:12
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `badge_scan_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `ouvriers`
--

CREATE TABLE `ouvriers` (
  `id` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL,
  `poste` varchar(50) DEFAULT NULL,
  `qr_code` varchar(100) DEFAULT NULL,
  `heure_debut` time DEFAULT '07:30:00',
  `heure_fin` time DEFAULT '17:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `ouvriers`
--

INSERT INTO `ouvriers` (`id`, `nom`, `poste`, `qr_code`, `heure_debut`, `heure_fin`) VALUES
(1, 'Jean Dupont', 'Soudeur', 'JEAN123', '07:30:00', '17:00:00'),
(2, 'Marie Martin', 'Assembleuse', 'MARIE456', '07:30:00', '17:00:00'),
(3, 'Paul Legrand', 'Chef d\'équipe', 'PAUL789', '07:30:00', '17:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `scans`
--

CREATE TABLE `scans` (
  `id` int(11) NOT NULL,
  `ouvrier_id` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `type_scan` enum('entrée','sortie') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `scans`
--

INSERT INTO `scans` (`id`, `ouvrier_id`, `timestamp`, `type_scan`) VALUES
(1, 1, '2025-06-03 17:37:43', 'entrée'),
(2, 2, '2025-06-03 17:37:43', 'entrée'),
(3, 1, '2025-06-03 17:37:43', 'sortie'),
(4, 1, '2025-06-05 07:15:49', 'entrée'),
(5, 1, '2025-06-05 08:59:33', 'sortie'),
(6, 3, '2025-06-05 09:03:51', 'sortie'),
(7, 3, '2025-06-05 12:01:19', 'entrée'),
(8, 1, '2025-06-05 12:01:26', 'entrée'),
(33, 2, '2025-06-09 19:48:20', 'entrée'),
(34, 1, '2025-06-09 19:49:09', 'sortie'),
(35, 1, '2025-06-11 01:23:56', 'sortie'),
(36, 1, '2025-06-11 01:24:01', 'sortie'),
(37, 3, '2025-06-11 01:25:29', 'entrée'),
(38, 3, '2025-06-11 01:25:38', 'entrée'),
(39, 2, '2025-06-11 01:26:55', 'entrée'),
(40, 2, '2025-06-11 01:26:58', 'entrée');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `ouvriers`
--
ALTER TABLE `ouvriers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_code` (`qr_code`);

--
-- Index pour la table `scans`
--
ALTER TABLE `scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ouvrier_id` (`ouvrier_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `ouvriers`
--
ALTER TABLE `ouvriers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `scans`
--
ALTER TABLE `scans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `scans`
--
ALTER TABLE `scans`
  ADD CONSTRAINT `scans_ibfk_1` FOREIGN KEY (`ouvrier_id`) REFERENCES `ouvriers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
