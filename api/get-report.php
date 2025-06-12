<?php
header('Content-Type: application/json');
require_once '../admin/functions.php';

$conn = connectDB();
$type = $_GET['type'] ?? 'global';
$startDate = $_GET['start'] ?? date('Y-m-d');
$endDate = $_GET['end'] ?? date('Y-m-d');

if ($type === 'global') {
    // Rapport global
    $report = [];
    $totalDays = 0;
    $totalPresents = 0;
    $totalLates = 0;
    
    // Pour chaque jour dans l'intervalle
    $currentDate = $startDate;
    while ($currentDate <= $endDate) {
        // Compter les présents/absents/retards
        $dayData = [
            'date' => $currentDate,
            'presents' => 0,
            'absents' => 0,
            'lates' => 0
        ];
        
        // Récupérer tous les ouvriers
        $ouvriers = $conn->query("SELECT id, heure_debut FROM ouvriers")->fetch_all(MYSQLI_ASSOC);
        
        foreach ($ouvriers as $ouvrier) {
            // Vérifier les scans pour cet ouvrier ce jour-là
            $scans = $conn->query("
                SELECT type_scan, TIME(timestamp) as scan_time 
                FROM scans 
                WHERE ouvrier_id = {$ouvrier['id']} 
                AND DATE(timestamp) = '$currentDate'
                ORDER BY timestamp
            ")->fetch_all(MYSQLI_ASSOC);
            
            $arrival = null;
            $departure = null;
            
            foreach ($scans as $scan) {
                if ($scan['type_scan'] === 'entrée') {
                    $arrival = $scan['scan_time'];
                } else {
                    $departure = $scan['scan_time'];
                }
            }
            
            if ($arrival) {
                $dayData['presents']++;
                
                // Vérifier retard
                if (strtotime($arrival) > strtotime($ouvrier['heure_debut'])) {
                    $dayData['lates']++;
                }
            } else {
                $dayData['absents']++;
            }
        }
        
        $report[] = $dayData;
        $totalDays++;
        $totalPresents += $dayData['presents'];
        $totalLates += $dayData['lates'];
        
        // Jour suivant
        $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
    }
    
    // Calculer taux de présence
    $totalOuvriers = $conn->query("SELECT COUNT(*) as total FROM ouvriers")->fetch_assoc()['total'];
    $presenceRate = $totalDays > 0 ? round(($totalPresents / ($totalDays * $totalOuvriers)) * 100) : 0;
    
    echo json_encode([
        'presence_rate' => $presenceRate,
        'total_lates' => $totalLates,
        'daily_report' => $report
    ]);
    
} else {
    // Rapport individuel
    $ouvrierId = intval($_GET['id']);
    $report = [];
    
    // Récupérer les infos de l'ouvrier
    $ouvrier = $conn->query("
        SELECT heure_debut, heure_fin 
        FROM ouvriers 
        WHERE id = $ouvrierId
    ")->fetch_assoc();
    
    $currentDate = $startDate;
    while ($currentDate <= $endDate) {
        $scans = $conn->query("
            SELECT type_scan, TIME(timestamp) as scan_time 
            FROM scans 
            WHERE ouvrier_id = $ouvrierId 
            AND DATE(timestamp) = '$currentDate'
            ORDER BY timestamp
        ")->fetch_all(MYSQLI_ASSOC);
        
        $arrival = null;
        $departure = null;
        $status = 'Absent';
        
        foreach ($scans as $scan) {
            if ($scan['type_scan'] === 'entrée') {
                $arrival = $scan['scan_time'];
            } else {
                $departure = $scan['scan_time'];
            }
        }
        
        if ($arrival) {
            if (strtotime($arrival) > strtotime($ouvrier['heure_debut'])) {
                $status = 'En retard';
            } else {
                $status = 'Présent';
            }
        }
        
        $report[] = [
            'date' => $currentDate,
            'arrival' => $arrival,
            'departure' => $departure,
            'status' => $status
        ];
        
        $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 day'));
    }
    
    echo json_encode(['report' => $report]);
}
?>