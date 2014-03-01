<?php

class Utils {

    public function formatDate( $timestamp ) {
        $now = strtotime("now");
        $diff = round( ( $now - $timestamp ) / 60 );

        $less_than_one_hour = $diff < 60 ? true : false;
        $less_than_one_day = $diff < 1400 ? true : false;
        $current_year = date('yyyy', $timestamp) == date('yyyy') ? true : false;

        if( $timestamp > $now ) {
            $date = _t('LEEDVIBES_IN_THE_FUTURE');
        } elseif( $less_than_one_hour ) {
            $date = $diff . ' ' . _t('LEEDVIBES_MN');
        } elseif( $less_than_one_day ) {
            $date = date('G:i', $timestamp);
        } elseif( $current_year ) {
            $date = date('j M', $timestamp);
        } else {
            $date = date('j M Y', $timestamp);
        }

        return $date;
    }
}
