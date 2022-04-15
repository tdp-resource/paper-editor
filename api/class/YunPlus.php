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

        //云+社区
        if (strpos($url, 'cloud.tencent.com/developer/article')) {
            $this->xpathInit($url);
            $subject = $this->xpathQuery('//h1[@class="article-title J-articleTitle"]');
            $content = $this->xpathQuery('//div[@class="rno-markdown J-articleContent"]');
            $starRequired = false !== strpos($this->html, '关注作者，阅读全部精彩内容');
        }
        //腾讯新闻
        elseif (strpos($url, 'new.qq.com')) {
            $this->xpathInit($url, 'GB18030');
            $subject = $this->getTitle();
            $content = $this->getDescription();
            $subject = preg_replace('/_腾讯新闻/', '', $subject);
        }
        //新浪新闻
        elseif (strpos($url, 'sina.com.cn')) {
            $this->xpathInit($url);
            $subject = $this->xpathQuery('//h1[@class="main-title"]');
            $content = $this->getDescription();
        }
        //通用模式 
        else {
            $this->xpathInit($url);
            $subject = $this->getTitle();
            $content = $this->getDescription();
            $subject = str_replace(' - OSCHINA - 中文开源技术交流社区', '', $subject);
        }

        return [
            'url' => $this->url,
            'subject' => trim(strip_tags($subject)),
            'summary' => mb_substr(trim(str_replace("\n", '', strip_tags($content))), 0, 100),
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

    private function xpathInit($url, $charset = 'UTF-8')
    {
        $this->url = $url;
        $this->html = $this->httpRequest($url);

        if ($charset != 'UTF-8') {
            $this->html = mb_convert_encoding($this->html, 'UTF-8', $charset);
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . $this->html;

        $this->document = new DOMDocument();
        $this->document->loadHTML($xml, LIBXML_NOERROR);
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
