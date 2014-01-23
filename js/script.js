var buttonContent = { closed: '\u25B8', opened: '\u25BE' };
$('document').ready(function(){
    $(".js-toggle-button").click( function() {
        toggleFolder( $(this) );
    } );
});

function toggleFolder( button ) {
    feedBloc = $('.js-toggle-item[data-folder-id="' + button.data("folder-id") + '"]');

    open = 0;
    if( feedBloc.css('display') == 'none' ) {
        open = 1;
    }

    feedBloc.slideToggle(200);
    $(button).html((!open ? buttonContent.closed : buttonContent.opened ));
    
    $.ajax({
        url: "./action.php?action=changeFolderState",
        data:{ id: feedBloc.data('folder-id'), isopen: open }
    });
}
