<?php

header('HTTP/1.1 200 OK');
header('Content-Type: application/json; charset=utf-8');

$id = $_GET['id'] ?? '';
$ff = $_GET['ff'] ?? '';

if (!$id) {
    exit(json_encode(['error' => '文章Id错误'], 320));
}

$ef = dirname(__DIR__) . '/.env';
if (is_file($ef)) {
    $_ENV += parse_ini_file($ef);
}

require_once __DIR__ . '/class/YunPlus.php';

$plus = new YunPlus();

$data = [];

foreach ((array)$id as $i) {
    $data[] = $plus->getArticle($i, $ff);
}

echo json_encode($data, 320);
