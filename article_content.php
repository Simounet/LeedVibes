<?php

    if( isset( $_GET['id'] ) ) {
        require_once( __DIR__ . '/../../common.php' );
        
        $view = 'article_content';

        $eventManager = new Event();
        $value = $eventManager->loadAll(array('id'=>$_GET['id']));

        raintpl::configure("tpl_dir", __DIR__ . '/');
        raintpl::configure( 'cache_dir', '../../cache/' );
        $tpl->assign('value',$value[0]);
        $tpl->assign('creator',$value[0]->getCreator());
        $tpl->draw( $view );
    }

?>
