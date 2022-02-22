<?php

header('HTTP/1.1 200 OK');
header('Content-Type: application/json; charset=utf-8');

$id = $argv[1] ?? $_GET['id'] ?? 0;
$ff = $argv[2] ?? $_GET['ff'] ?? 0;

if ($id < 1) {
    $data = json_encode(['error' => '文章Id错误'], 320);
    exit($data);
}

require_once __DIR__ . '/class/YunPlus.php';

$plus = new YunPlus();
$data = $plus->getArticle($id, $ff);

echo json_encode($data, 320);
