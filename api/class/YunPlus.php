<?php

class YunPlus
{
    private $url;
    private $html;

    private $document;
    private $xpath;

    public function getArticle($id, $full = false)
    {
        $this->xpathInit('https://cloud.tencent.com/developer/article/' . $id);
        $subject = $this->xpathQuery('//h1[@class="article-title J-articleTitle"]');
        $content = $this->xpathQuery('//div[@class="rno-markdown J-articleContent"]');
        return [
            'url' => $this->url,
            'subject' => trim(strip_tags($subject)),
            'summary' => mb_substr(trim(strip_tags($content)), 0, 100),
            'content' => $full ? $content : '',
        ];
    }

    private function xpathInit($url)
    {
        $this->url = $url;
        $this->html = $this->httpRequest($url);

        $this->document = new DOMDocument();
        $this->document->loadHTML($this->html, LIBXML_NOERROR);
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
        $proxy = 'https://cmd.rehiy.com/curl.php?key=sdf34er32edfv45r3weffvrtyvrf';
        $param = '&url=' . urlencode($url);
        return file_get_contents($proxy . $param);
    }
}
