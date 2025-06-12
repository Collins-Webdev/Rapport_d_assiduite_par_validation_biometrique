<?php
// Inclure l'autoload de Composer
require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// Connexion à la BDD
$conn = new mysqli("localhost", "root", "", "badge_scan_db");
if ($conn->connect_error) die("Erreur de connexion: " . $conn->connect_error);

// Récupérer les paramètres
$type = $_GET['type'] ?? 'global';
$startDate = $_GET['start'] ?? date('Y-m-d');
$endDate = $_GET['end'] ?? date('Y-m-d');
$ouvrierId = intval($_GET['id'] ?? 0);

// Créer un nouveau document Excel
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// === GLOBAL ===
if ($type === 'global') {
    // Titre
    $sheet->setCellValue('A1', 'Rapport Global des Présences');
    $sheet->mergeCells('A1:D1');
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

    // Période
    $sheet->setCellValue('A2', "Du $startDate au $endDate");
    $sheet->mergeCells('A2:D2');

    // En-têtes
    $sheet->setCellValue('A4', 'Date');
    $sheet->setCellValue('B4', 'Présents');
    $sheet->setCellValue('C4', 'Absents');
    $sheet->setCellValue('D4', 'Retards');
    $sheet->getStyle('A4:D4')->getFont()->setBold(true);

    // Données
    $row = 5;
    $currentDate = $startDate;

    while ($currentDate <= $endDate) {
        // Requête pour compter présents/absents/retards
        $query = $conn->prepare("
            SELECT 
                COUNT(DISTINCT o.id) as total,
                SUM(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END) as presents,
                SUM(CASE WHEN TIME(s.timestamp) > o.heure_debut AND s.type_scan = 'entrée' THEN 1 ELSE 0 END) as lates
            FROM ouvriers o
            LEFT JOIN scans s ON o.id = s.ouvrier_id AND DATE(s.timestamp) = ?
        ");
        $query->bind_param('s', $currentDate);
        $query->execute();
        $result = $query->get_result()->fetch_assoc();

        $presents = $result['presents'] ?? 0;
        $lates = $result['lates'] ?? 0;
        $absents = ($result['total'] ?? 0) - $presents;

        // Remplir les cellules
        $sheet->setCellValue("A$row", $currentDate);
        $sheet->setCellValue("B$row", $presents);
        $sheet->setCellValue("C$row", $absents);
        $sheet->setCellValue("D$row", $lates);

        // Style conditionnel pour les retards
        if ($lates > 0) {
            $sheet->getStyle("D$row")->getFont()->getColor()->setRGB('FF0000');
        }

        $row++;
        $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
    }

    // Ajuster la largeur des colonnes
    $sheet->getColumnDimension('A')->setWidth(15);
    $sheet->getColumnDimension('B')->setWidth(12);
    $sheet->getColumnDimension('C')->setWidth(12);
    $sheet->getColumnDimension('D')->setWidth(12);

// === INDIVIDUEL ===
} else {
    // Récupérer le nom de l'ouvrier
    $query = $conn->prepare("SELECT nom FROM ouvriers WHERE id = ?");
    $query->bind_param('i', $ouvrierId);
    $query->execute();
    $ouvrier = $query->get_result()->fetch_assoc();

    // Titre
    $sheet->setCellValue('A1', "Rapport Individuel - " . $ouvrier['nom']);
    $sheet->mergeCells('A1:D1');
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

    // Période
    $sheet->setCellValue('A2', "Du $startDate au $endDate");
    $sheet->mergeCells('A2:D2');

    // En-têtes
    $sheet->setCellValue('A4', 'Date');
    $sheet->setCellValue('B4', 'Arrivée');
    $sheet->setCellValue('C4', 'Départ');
    $sheet->setCellValue('D4', 'Statut');
    $sheet->getStyle('A4:D4')->getFont()->setBold(true);

    // Données
    $row = 5;
    $currentDate = $startDate;

    while ($currentDate <= $endDate) {
        // Requête pour les scans du jour
        $query = $conn->prepare("
            SELECT type_scan, TIME(timestamp) as scan_time 
            FROM scans 
            WHERE ouvrier_id = ? AND DATE(timestamp) = ?
            ORDER BY timestamp
        ");
        $query->bind_param('is', $ouvrierId, $currentDate);
        $query->execute();
        $scans = $query->get_result()->fetch_all(MYSQLI_ASSOC);

        $arrival = 'N/A';
        $departure = 'N/A';
        $status = 'Absent';

        foreach ($scans as $scan) {
            if ($scan['type_scan'] === 'entrée') {
                $arrival = $scan['scan_time'];
                $status = (strtotime($arrival) > strtotime('07:30:00')) ? 'Retard' : 'Présent';
            } else {
                $departure = $scan['scan_time'];
            }
        }

        // Remplir les cellules
        $sheet->setCellValue("A$row", $currentDate);
        $sheet->setCellValue("B$row", $arrival);
        $sheet->setCellValue("C$row", $departure);
        $sheet->setCellValue("D$row", $status);

        // Couleur selon statut
        $color = match($status) {
            'Présent' => '4CAF50', // Vert
            'Retard' => 'FF9800',   // Orange
            default => 'F44336'     // Rouge
        };
        $sheet->getStyle("D$row")->getFont()->getColor()->setRGB($color);

        $row++;
        $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
    }

    // Ajuster la largeur des colonnes
    $sheet->getColumnDimension('A')->setWidth(15);
    $sheet->getColumnDimension('B')->setWidth(12);
    $sheet->getColumnDimension('C')->setWidth(12);
    $sheet->getColumnDimension('D')->setWidth(12);
}

// Envoyer le fichier au navigateur
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="rapport_presence.xlsx"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;