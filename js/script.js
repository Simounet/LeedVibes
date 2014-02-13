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

    feedBloc.slideToggle(200, function() {
        $(this).toggleClass('hidden');
    });
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

/* FROM marigolds/js/script.js */
/* Fonctions de séléctions */
/* Cette fonction sera utilisé pour le scroll infinie, afin d'ajouter les évènements necessaires */
function addEventsButtonLuNonLus(){
    var handler = function(event){
        var target = event.target;
        var id = $(this).data('id');
        if($(target).hasClass('js-read-unread')){
            buttonAction(target,id);
        }else{
            targetThisEvent(this);
        }
    }
    // on vire tous les évènements afin de ne pas avoir des doublons d'évènements
    $('section article').unbind('click');
    // on bind proprement les click sur chaque section
    $('section article').bind('click', handler);
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
    var activeScreen = $('#pageTop').html();
    var parent = $(element).parent().parent();
    var nextEvent = $('#'+id).next();
    //sur les éléments non lus
    if(!parent.hasClass('eventRead')){
        $.ajax({
            url: "./action.php?action=readContent",
            data:{id:id},
            success:function(msg){
                if(msg.status == 'noconnect') {
                    alert(msg.texte)
                } else {
                    if( console && console.log && msg!="" ) console.log(msg);
                    switch (activeScreen){
                        case '':
                            // cas de la page d'accueil
                            parent.addClass('eventRead');
                            parent.fadeOut(200,function(){
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
                            // on compte combien d'article ont été lus afin de les soustraires de la requête pour le scroll infini
                            $(window).data('nblus', $(window).data('nblus')+1);
                            // on diminue le nombre d'article en haut de page
                            $('#nbarticle').html(parseInt($('#nbarticle').html()) - 1)
                        break;
                        case 'selectedFolder':
                        case 'selectedFeedNonLu':
                            parent.addClass('eventRead');
                            if(callback){
                                callback();
                            }else{
                                targetThisEvent(nextEvent,true);
                            }
                            // on compte combien d'article ont été lus afin de les soustraires de la requête pour le scroll infini
                            $(window).data('nblus', $(window).data('nblus')+1);
                        break;
                        default:
                            // autres cas : favoris, selectedFeed ...
                            parent.addClass('eventRead');
                            if(callback){
                                callback();
                            }else{
                                targetThisEvent(nextEvent,true);
                            }
                        break;
                    }
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
                            parent.removeClass('eventRead');
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
