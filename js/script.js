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
    
    // [facto] - regroup listeners on click
    $( '.wrapper' ).on( 'click', '.js-article__header', function( event ) {
        event.preventDefault();
        toggleEvent( $(this) );
    });

    $( '.sidebar' ).on( 'click', '.js-mark-as-read', function() {
        button = $(this);
        if( button.parents('.js-feed__item').length ) {
            if(confirm(_t('CONFIRM_MARK_FEED_AS_READ')))
                window.location='action.php?action=readAll&feed=' + button.parents('.js-feed__item').data('id');
        } else if( button.parents('.js-folder__item').length ) {
            if(confirm(_t('READ_ALL_FOLDER_CONFIRM')))
                window.location='action.php?action=readFolder&folder=' + button.parents('.js-folder').data('id');
        } else {
            if(confirm(_t('LEEDVIBES_READ_ALL_CONFIRM')))
                window.location='action.php?action=readAll';
        }
    });

    $(window).data('ajaxready', true);
    $('.wrapper').append('<div id="loader" class="infinite-scroll hidden">'+_t('LOADING')+'</div>');
    $(window).data('page', 1);
    $(window).data('nblus', 0);

    var load = false;
    var offset = $('.wrapper:last').offset(); 

    $(window).scroll(function(){
        if((offset.top-$(window).height() <= $(window).scrollTop()) 
        && load==false) {
            scrollInfini();
        }
    });
});

function toggleEvent( e ) {
    var existingEntryFocused = $('.js-feed__entry.js-focus');

    var eventContainer = e.parents('.js-feed__entry'),
        websiteView = eventContainer.hasClass('js-website');
    toggleFocus( eventContainer, existingEntryFocused);
    toggleItem( eventContainer, websiteView, existingEntryFocused );
}

function toggleItem( e, special, existingEntryFocused ) {
    var content = e.find('.js-article__content'),
        existingEntryFocusedContent = existingEntryFocused.find('.js-article__content');

    var readOrUnreadAtToggle = function () {
        if( ! e.find('[type="checkbox"]').prop("checked") ) {
            readOrUnread( e );
        }
    }

    function handler( customToggle ) {
        if(  existingEntryFocusedContent.length && ( content[0] != existingEntryFocusedContent[0] ) ) {
            customToggle();
            if( existingEntryFocused.hasClass('js-event--read') ) {
                existingEntryFocused.hide();
            }

        }
    }

    if( special ) {
        handler( function() { toggleWebsite( existingEntryFocusedContent ) } );
        toggleWebsite( content, readOrUnreadAtToggle );
    } else {
        handler( function() { existingEntryFocusedContent.toggle() } );
        toggleContent( e.data('id'), content, readOrUnreadAtToggle );
    }
    content.toggle();
}

function toggleContent( eventId, el, callback ) {
    if( el.children().length == 0 ) {
        $.ajax({
            url: "./plugins/leedvibes/article_content.php",
            data:{ id: eventId },
        })
            .done(function( data ) {
                el.append( data );
                if( typeof( callback ) == 'function' )
                    callback();
            })
            .fail(function() {
                alert( "error" );
            });
    }

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
        existingEntryFocused.removeClass('js-focus feed__entry--focus');
    }

    entry.toggleClass('js-focus feed__entry--focus');
}

function readOrUnread( entry ) {
    if( entry.hasClass('js-event--read') ) {
        entry.hide();
    }

    if( entry.hasClass('js-focus') ) {
        // [facto] - children used here but parent needed on readThis function
        readThis( entry.children(), entry.data('id') );
    }
}

function countersHandler( feedID, operation ) {
    var counterHandler = function( counter ) {
        var i = parseInt(counter.html());
        if( operation == '+' || operation == 'plus' ) {
            i++;
        } else {
            i--;
        }

        return i;
    }

    var feed = $('.js-feed__item[data-id="'+feedID+'"]');

    var feedCounter = feed.find('.js-feed-counter');
    feedCounter.html( counterHandler( feedCounter ) );

    var folderCounter = feed.parents('.js-folder').find('.js-folder-counter');
    folderCounter.html( counterHandler( folderCounter ) );
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
    
    $( '.wrapper' ).on( 'click', '.js-read-unread', handler );
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
    var entry = $(element).parents('.js-feed__entry');
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
                    entry.find('[type="checkbox"]').prop('checked', true);
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
                    $('#nbarticle').html(parseInt($('#nbarticle').html()) - 1);
                    // Decrement feed number
                    countersHandler( entry.data('feed-id') );
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
                            entry.find('[type="checkbox"]').prop('checked', false);
                            entry.removeClass('js-event--read');
                            if(callback){
                                callback();
                            }
                        }
                    }
            });
            // Increment feed number
            countersHandler( entry.data('feed-id'), '+' );
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

function scrollInfini() {
    var deviceAgent = navigator.userAgent.toLowerCase();
    var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);

    if($('.wrapper').length) {
        // On teste si ajaxready vaut false, auquel cas on stoppe la fonction
        if ($(window).data('ajaxready') == false) return;

        if(($(window).scrollTop() + $(window).height()) + 50 >= $(document).height()
           || agentID && ($(window).scrollTop() + $(window).height()) + 150 > $(document).height())
        {
            // CONFIGS
            var loader = $('.wrapper #loader'),
                loaderFadeTime = 500,
                loaderDelayTime = 2000;
            // lorsqu'on commence un traitement, on met ajaxready à false
            $(window).data('ajaxready', false);

            //j'affiche mon loader pour indiquer le chargement
            if( loader.hasClass('hidden') ) {
                loader
                    .fadeIn(loaderFadeTime)
                    .removeClass('hidden');
            } else {
                loader.fadeIn(loaderFadeTime);
            }

            // récupération des variables passées en Get
            var action = getUrlVars()['action'];
            var folder = getUrlVars()['folder'];
            var feed = getUrlVars()['feed'];
            var order = ( getUrlVars()['order'] != '' ) ? '&order=' + getUrlVars()['order'] : '';

            $.ajax({
                url: './article.php',
                type: 'post',
                data: 'scroll='+$(window).data('page')+'&nblus='+$(window).data('nblus')+'&action='+action+'&folder='+folder+'&feed='+feed+order,

                //Succès de la requête
                success: function(data) {
                    if (data.replace(/^\s+/g,'').replace(/\s+$/g,'') != '')
                    {    // on les insère juste avant le loader
                        loader.before(data);
                        //on supprime de la page le script pour ne pas intéragir avec les next & prev
                        //$('article .scriptaddbutton').remove();
                        //si l'élement courant est caché, selectionner le premier élément du scroll
                        //ou si le div loader est sélectionné (quand 0 article restant suite au raccourcis M)
                        //if (($('article section.eventSelected').attr('style')=='display: none;')
                        //    || ($('article div.eventSelected').attr('id')=='loader'))
                        //{
                        //    targetThisEvent($('article section.scroll:first'), true);
                        //}
                        // on les affiche avec un fadeIn
                        $('.wrapper article.scroll').fadeIn(600);
                        // on supprime le tag de classe pour le prochain scroll
                        $('.wrapper article.scroll').removeClass('scroll');
                        $(window).data('ajaxready', true);
                        $(window).data('page', $(window).data('page')+1);
                        $(window).data('enCoursScroll',0);
                        // appel récursif tant qu'un scroll n'est pas detecté.
                        if ($(window).scrollTop()==0) scrollInfini();
                        loader
                            .delay(loaderDelayTime)
                            .fadeOut(loaderFadeTime);
                    } else {
                        loader
                            .fadeOut(loaderFadeTime);
                        $('.wrapper')
                            .append('<div class="infinite-scroll--end js-infinite-scroll--end">'+_t('LEEDVIBES_NO_MORE_EVENT')+'</div>');
                    }
                 },
                complete: function(){
                    // le chargement est terminé, on fait disparaitre notre loader
                    loader
                        .delay(loaderDelayTime)
                        .fadeOut(loaderFadeTime);
                }
            });
        }
    }
};

// permet de récupérer les variables passée en get dans l'URL et des les parser
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        if (hash[1]){
            rehash = hash[1].split('#');
            vars[hash[0]] = rehash[0];
        } else {
            vars[hash[0]] = '';
        }


    }
    return vars;
}
