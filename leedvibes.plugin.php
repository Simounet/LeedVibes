<?php
/*
@name LeedVibes
@author Simounet <contact@simounet.net>
@link http://www.simounet.net
@licence WTFPL
@version 1.0.0
@description A Leed interface close to the old good Netvibes
*/

include( __DIR__ . '/classes/Utils.php' );

function leedvibes( &$event ) {
    $utils = new Utils();
    $event->dateFormatted = $utils->formatDate( $event->getPubdate() );
}

Plugin::addHook("event_pre_title", "leedvibes");

?>
