<?php

class Utils {

    public function formatDate( $timestamp ) {
        $now = strtotime("now");
        $diff = round( ( $now - $timestamp ) / 60 );

        $less_than_one_hour = $diff < 60 ? true : false;
        $less_than_one_day = $diff < 1400 ? true : false;
        $current_year = date('yyyy', $timestamp) == date('yyyy') ? true : false;

        if( $timestamp > $now ) {
            $date_tmp = _t('LEEDVIBES_IN_THE_FUTURE');
        } elseif( $less_than_one_hour ) {
            $date_tmp = $diff . ' ' . _t('LEEDVIBES_MN');
        } elseif( $less_than_one_day ) {
            $date_tmp = date('G:i', $timestamp);
        } elseif( $current_year ) {
            $date_tmp = date('j M', $timestamp);
        } else {
            $date_tmp = date('j M Y', $timestamp);
        }

        $date['value'] = $date_tmp;
        $date['title'] = date('H:i Y-m-d', $timestamp);

        return $date;
    }
}
