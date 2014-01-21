$('document').ready(function(){
    $('.js-toggle-item').hide();
    $(".js-toggle").html( '\u25B8' );

    $(".js-toggle").click( function() {
        toggleFolder( $(this) );
    } );
});

function toggleFolder( e ) {
    feedBloc = $(e).siblings('.js-toggle-item');

    open = 0;
    if( feedBloc.css('display') == 'none' ) {
        open = 1;
    }

    feedBloc.slideToggle(200);
    $(e).html((!open ? '\u25B8' : '\u25BE'));
}
