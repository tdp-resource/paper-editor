<?php

class YunPlus
{
    private $url;
    private $html;

    private $document;
    private $xpath;

    public function getArticle($url)
    {
        if (empty($url)) {
            return ['error' => '参数错误'];
        }

        $this->xpathInit($url);

        //云+社区
        if (strpos($url, 'cloud.tencent.com/developer/article')) {
            $subject = $this->xpathQuery('//h1[@class="article-title J-articleTitle"]');
            $content = $this->xpathQuery('//div[@class="rno-markdown J-articleContent"]');
            $starRequired = false !== strpos($this->html, '关注作者，阅读全部精彩内容');
        }
        //腾讯新闻
        elseif (strpos($url, 'new.qq.com')) {
            [$subject, $content] = $this->getMetaWithGBK();
            $subject = preg_replace('/_腾讯新闻/', '', $subject);
        }
        //新浪新闻
        elseif (strpos($url, 'sina.com.cn')) {
            $subject = $this->xpathQuery('//h1[@class="main-title"]');
            $content = $this->getDescription();
        }
        //通用模式 
        else {
            $subject = $this->getTitle();
            $content = $this->getDescription();
        }

        return [
            'url' => $this->url,
            'subject' => trim(strip_tags($subject)),
            'summary' => mb_substr(trim(str_replace("\n", "", strip_tags($content))), 0, 100),
            'starRequired' => $starRequired ?? false,
        ];
    }

    ////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * 获取文章标题
     */
    private function getTitle()
    {
        $find = $this->xpath->query('//meta[@property="og:title"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@property="twitter:title"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//title');
        if ($find && $find->count() > 0) {
            return $find->item(0)->textContent;
        }

        return '获取失败';
    }

    /**
     * 获取文章简介
     */
    private function getDescription()
    {
        $find = $this->xpath->query('//meta[@property="og:description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@property="twitter:description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@name="description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        return '获取失败';
    }

    ////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * 从head里获取文章信息（DOMDocument对utf-8之外的网页处理不大行）
     */
    private function getMetaWithGBK($convert2utf8 = true)
    {
        $subject = preg_match('@title>(.*)</@', $this->html, $matches) ? $matches[1] : '';
        $description = preg_match('@name="description\S\s+content="(.*)"@', $this->html, $matches) ? $matches[1] : '';

        if ($convert2utf8) {
            $subject = $this->convert2utf8($subject);
            $description = $this->convert2utf8($description);
        }

        return [$subject, $description];
    }

    private function convert2utf8($str)
    {
        if (mb_check_encoding($str, 'UTF-8')) {
            return $str;
        }
        $str = mb_convert_encoding($str, 'UTF-8', 'GB18030');
        return $str !== false  ? $str : '';
    }

    ////////////////////////////////////////////////////////////////////////////////////////////

    private function xpathInit($url)
    {
        $this->url = $url;
        $this->html = $this->httpRequest($url);

        $this->document = new DOMDocument();
        $this->document->loadHTML('<?xml version="1.0" encoding="UTF-8"?>' . $this->html, LIBXML_NOERROR);
        $this->document->normalize();

        $this->xpath = new DOMXPath($this->document);
    }

    private function xpathQuery($rule, $i = 0)
    {
        $nodeList = $this->xpath->query($rule);

        if (isset($nodeList[$i])) {
            return $this->document->saveHTML($nodeList[$i]);
        }
    }

    private function httpRequest($url)
    {
        if (isset($_ENV['PROXY_URL'])) {
            $url = $_ENV['PROXY_URL'] . urlencode($url);
        }

        $ch = curl_init($url);

        $header = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36 Edg/99.0.1150.46'
        ];

        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);

        list($res, $err) = [curl_exec($ch), curl_errno($ch), curl_close($ch)];

        return $err ? '' : $res;
    }
}
