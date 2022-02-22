<?php

$id = $argv[1] ?? $_GET['id'] ?? 0;

if ($id < 1) {
    $error = json_encode(['error' => '文章Id错误']);
    exit($error);
}

require_once __DIR__ . '/class/YunPlus.php';

$brt = new YunPlus();

echo json_encode($brt->getArticle($id));
