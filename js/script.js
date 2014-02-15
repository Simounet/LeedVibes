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
    addEventsButtonLuNonLus();
    
    $(".js-toggle-button").click( function() {
        toggleFolder( $(this) );
    });
    
    $(".js-article__header").click( function( event ) {
        event.preventDefault();
        toggleEvent( $(this) );
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

function toggleEvent( e ) {
    var existingEntryFocused = $('.js-feed__entry.js-focus'),
        websiteView = e.hasClass('js-website');

    toggleFocus( e.parents('.js-feed__entry'), existingEntryFocused);
    toggleItem( e, websiteView, existingEntryFocused );
}

function toggleItem( e, special, existingEntryFocused ) {
    var content = e.siblings('.js-article__content'),
        existingEntryFocusedContent = existingEntryFocused.find('.js-article__content');

    if( special ) {
        if(  existingEntryFocusedContent.length && ( content[0] != existingEntryFocusedContent[0] ) ) {
            toggleWebsite( existingEntryFocusedContent );
            existingEntryFocused
                .hide()
                .find('[type="checkbox"]').prop("checked", function(i,val) { return !val; });
        }
        toggleWebsite( content );
    } else {
        if(  existingEntryFocusedContent.length && ( content[0] != existingEntryFocusedContent[0] ) ) {
            existingEntryFocusedContent.toggle();
            existingEntryFocused
                .hide()
                .find('[type="checkbox"]').prop("checked", function(i,val) { return !val; });
        }
        content.toggle();
    }

    readOrUnread( e );
}

function toggleFolder( button ) {
    folderBloc = button.parents('.js-folder');
    feedBloc = folderBloc.find('.js-toggle-item');

    open = 0;
    if( feedBloc.css('display') == 'none' ) {
        open = 1;
    }

    feedBloc.slideToggle(200, function() {
        $(this).toggleClass('hidden');
    });
    $(button).html((!open ? buttonContent.closed : buttonContent.opened ));
    
    $.ajax({
        url: "./action.php?action=changeFolderState",
        data:{ id: folderBloc.data('id'), isopen: open }
    });
}

function toggleFocus( entry, existingEntryFocused ) {
    // If we are not clicking on the already focused element
    // And there is and existing focused element
    // Then remove focus class
    if( ( entry[0] != existingEntryFocused[0]) && existingEntryFocused.length ) {
        existingEntryFocused.removeClass('js-focus');
    }

    entry.toggleClass('js-focus');
}

function toggleWebsite( element ) {
    if( element.not(':has(iframe)').length ) {
        jQuery('<iframe frameborder="0" src="' + element.data('article-url') + '" style="width: 100%; height: 100%;" />').appendTo( element );
    } else {
        element.children('iframe').remove();
    }
}

function readOrUnread( e ) {
    var entry = e.parents('.js-feed__entry');
    if( entry.find('.js-article__content:visible').length )
        entry.find('[type="checkbox"]').prop('checked', true);
    if( entry.hasClass('js-event--read') ) {
        entry.hide();
    }

    if( entry.hasClass('js-focus') ) {
        readThis( e, entry.data('id') );
    }
}

/* FROM marigolds/js/script.js */
/* Fonctions de séléctions */
/* Cette fonction sera utilisé pour le scroll infinie, afin d'ajouter les évènements necessaires */
function addEventsButtonLuNonLus(){
    var handler = function(event){
        var target = event.target,
            id = $(this).parents('.js-feed__entry').data('id');

        if($(target).hasClass('js-read-unread')){
            buttonAction(target, id);
        }
    }
    
    $('.js-read-unread').bind('click', handler);
}

function buttonAction(target,id){
    // Check unreadEvent
    if($('#pageTop').html()){
        var from=true;
    }else{
        var from='';
    }
    readThis(target,id,from);
}

function readThis(element,id,from,callback){
    var entry = $(element).parents('.feed__entry');
    var nextEvent = $('#'+id).next();
    //sur les éléments non lus
    if(!entry.hasClass('js-event--read')){
        $.ajax({
            url: "./action.php?action=readContent",
            data:{id:id},
            success:function(msg){
                if(msg.status == 'noconnect') {
                    alert(msg.texte)
                } else {
                    entry.addClass('js-event--read');
                    if( ( entry.find('.js-article__content').css('display') == 'none' ) && $(element).hasClass('js-read-unread') ) {
                        entry.hide(0,function(){
                            if(callback){
                                callback();
                            }else{
                                targetThisEvent(nextEvent,true);
                            }
                            // on simule un scroll si tous les events sont cachés
                            if($('article section:last').attr('style')=='display: none;') {
                                $(window).scrollTop($(document).height());
                            }
                        });
                    }
                    // on compte combien d'article ont été lus afin de les soustraires de la requête pour le scroll infini
                    $(window).data('nblus', $(window).data('nblus')+1);
                    // on diminue le nombre d'article en haut de page
                    $('#nbarticle').html(parseInt($('#nbarticle').html()) - 1)
                }
            }
        });
    }else{  // sur les éléments lus
            // si ce n'est pas un clic sur le titre de l'event
        if(from!='title'){
            $.ajax({
                    url: "./action.php?action=unreadContent",
                    data:{id:id},
                    success:function(msg){
                        if(msg.status == 'noconnect') {
                            alert(msg.texte)
                        } else {
                            if( console && console.log && msg!="" ) console.log(msg);
                            entry.removeClass('js-event--read');
                            // on compte combien d'article ont été remis à non lus
                            if ((activeScreen=='') || (activeScreen=='selectedFolder')|| (activeScreen=='selectedFeedNonLu'))
                                $(window).data('nblus', $(window).data('nblus')-1);
                            if(callback){
                                callback();
                            }
                        }
                    }
            });
        }
    }

}

function targetThisEvent(event,focusOn){
    target = $(event);
    if(target.prop("tagName")=='SECTION'){
        $('.eventSelected').removeClass('eventSelected');
        target.addClass('eventSelected');
        var id = target.attr('id');
        if(id && focusOn)window.location = '#'+id;
    }
    if(target.prop("tagName")=='DIV'){
        $('.eventSelected').removeClass('eventSelected');
        target.addClass('eventSelected');
    }
    // on débloque les touches le plus tard possible afin de passer derrière l'appel ajax
}
