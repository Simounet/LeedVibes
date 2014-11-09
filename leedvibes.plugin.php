<?php
/*
@name LeedVibes
@author Simounet <contact@simounet.net>
@link http://www.simounet.net
@licence MIT
@version 1.0.0
@description A Leed interface close to the old good Netvibes
*/

include( __DIR__ . '/classes/Utils.php' );

function leedvibes( &$event ) {
    $utils = new Utils();
    $event->dateFormatted = $utils->formatDate( $event->getPubdate() );

    $feed = new Feed();
    $usedFeed = $feed->getById($event->getFeed());
    $event->feedName = $usedFeed->getName();
}

function setLeedvibesTemplate() {
    raintpl::configure("tpl_dir", 'plugins/leedvibes/' );
}

Plugin::addHook("event_pre_title", "leedvibes");
Plugin::addHook("index_pre_treatment", "setLeedvibesTemplate");

?>
