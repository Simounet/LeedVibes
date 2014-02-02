var buttonContent = { closed: '\u25B8', opened: '\u25BE' };
function _t(key,args){
    value = i18n[key];
    if(args!=null){
        for(i=0;i<args.length;i++){
            value = value.replace('$'+(i+1),args[i]);
        }
    }
    return value;
}

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

    $(".js-mark-as-read").click( function() {
        button = $(this);
        if( button.parents('.js-feed__item').length ) {
            if(confirm(_t('CONFIRM_MARK_FEED_AS_READ')))
                window.location='action.php?action=readAll&feed=' + button.parents('.js-feed__item').data('id');
        } else {
            if(confirm(_t('READ_ALL_FOLDER_CONFIRM')))
                window.location='action.php?action=readFolder&folder=' + button.parents('.js-folder').data('id');
        }
    });
});

function toggleFolder( button ) {
    folderBloc = button.parents('.js-folder');
    feedBloc = folderBloc.find('.js-toggle-item');

    open = 0;
    if( feedBloc.css('display') == 'none' ) {
        open = 1;
    }

    feedBloc.slideToggle(200);
    $(button).html((!open ? buttonContent.closed : buttonContent.opened ));
    
    $.ajax({
        url: "./action.php?action=changeFolderState",
        data:{ id: folderBloc.data('id'), isopen: open }
    });
}

function toggleWebsite( element ) {
    if( element.not(':has(iframe)').length ) {
        jQuery('<iframe frameborder="0" src="' + element.data('article-url') + '" style="width: 100%; height: 100%;" />').appendTo( element );
    } else {
        element.children('iframe').remove();
    }
}
