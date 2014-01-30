var buttonContent = { closed: '\u25B8', opened: '\u25BE' };
$('document').ready(function(){
    $(".js-toggle-button").click( function() {
        toggleFolder( $(this) );
    });
    
    $(".js-article__title").click( function( event ) {
        event.preventDefault();
        if( $(this).hasClass('js-website') ) {
            toggleWebsite( $(this).siblings('.js-article__content') );
        }
        
        $(this).siblings('.js-article__content').toggle();
    });
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

function toggleWebsite( element ) {
    if( element.not(':has(iframe)').length ) {
        jQuery('<iframe frameborder="0" src="' + element.data('article-url') + '" style="width: 100%; height: 100%;" />').appendTo( element );
    } else {
        element.children('iframe').remove();
    }
}