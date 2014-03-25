var buttonContent = { closed: '\u25B8', opened: '\u25BE' },
    scrollInfiniLimit = '',
    eventObj;
function _t(key,args){
    value = i18n[key];
    if(args!=null){
        for(i=0;i<args.length;i++){
            value = value.replace('$'+(i+1),args[i]);
        }
    }
    return value;
}

$(function() {

    $( '.wrapper' ).on( 'click', '.js-feed__entry', function( event ) { 
        event.preventDefault();
        eventObj = new EventObject( event );
    });

    //$(".js-toggle-button").click( function() {
    //    toggleFolder( $(this) );
    //});

    //$( '.sidebar' ).on( 'click', '.js-mark-as-read', function() {
    //    button = $(this);
    //    if( button.parents('.js-feed__item').length ) {
    //        if(confirm(_t('CONFIRM_MARK_FEED_AS_READ')))
    //            window.location='action.php?action=readAll&feed=' + button.parents('.js-feed__item').data('id');
    //    } else if( button.parents('.js-folder__item').length ) {
    //        if(confirm(_t('READ_ALL_FOLDER_CONFIRM')))
    //            window.location='action.php?action=readFolder&folder=' + button.parents('.js-folder').data('id');
    //    } else {
    //        if(confirm(_t('LEEDVIBES_READ_ALL_CONFIRM')))
    //            window.location='action.php?action=readAll';
    //    }
    //});

    $(window).data('ajaxready', true);
    $('.wrapper').append('<div id="loader" class="infinite-scroll hidden">'+_t('LOADING')+'</div>');
    $(window).data('page', 1);
    $(window).data('nblus', 0);

    setScrollInfiniLimit();

    var load = false;
    var offset = $('.wrapper:last').offset(); 

    $(window).scroll(function(){
        if((offset.top-$(window).height() <= $(window).scrollTop()) 
        && load==false) {
            scrollInfini();
        }
    });
});

function EventObject( event ) { 
    this.entry   = $(event.currentTarget);
    this.target  = $(event.target);
    this.content = this.entry.find( this.contentClass );
    this.targetClass = '.' + this.target.attr('class');

    if( this.targetClass == this.buttonClass ) {
        this.readUnreadButtonAction();
    }

    if( this.target.parents( this.headerClass ).length ) {
        this.toggleEvent();
    }
}

EventObject.prototype = {
    headerClass:  '.js-article__header',
    contentClass: '.js-article__content',
    buttonClass:  '.js-read-unread',
    
    existingEntryFocused: $('.js-feed__entry.js-focus'),

    getContent: function() {
        return this.entry.find( contentClass );
    },

    readUnreadButtonAction: function(){
        var id = this.entry.data('id');

        if( this.target.hasClass('js-read-unread') ){
            readThis( this.target, id );
        }
    },

    toggleEvent: function() {
        var websiteView = this.entry.hasClass('js-website'); // [todo] - move this var to LeedRSSOrSiteView plugin

        this.toggleFocus();
        this.toggleItem( websiteView );
    },

    toggleFocus: function() {
        // If we are not clicking on the already focused element
        // And there is and existing focused element
        // Then remove focus class
        if( ( this.entry[0] != this.existingEntryFocused[0] ) && this.existingEntryFocused.length ) {
            this.existingEntryFocused.removeClass('js-focus feed__entry--focus');
        }

        this.entry.toggleClass('js-focus feed__entry--focus');
    },

    toggleItem: function( special ) {
        var existingEntryFocusedContent = this.existingEntryFocused.find('.js-article__content');

        var readOrUnreadAtToggle = function ( entry ) {
            // [todo] - See if it is possible to get entry from object scope
            if( ! entry.find('[type="checkbox"]').prop("checked") ) {
                // [todo] - See if it is possible to get entry from object scope
                if( entry.hasClass('js-event--read') ) {
                    entry.hide();
                }

                if( entry.hasClass('js-focus') ) {
                    // [facto] - children used here but parent needed on readThis function
                    readThis( entry.children(), entry.data('id') );
                }
            }
        }

        function handler( customToggle ) {
            // [fix] - If click on event title after clicked unread
            if( existingEntryFocusedContent.length && ( this.content[0] != existingEntryFocusedContent[0] ) ) {
                customToggle();
                if( eventObj.existingEntryFocused.hasClass('js-event--read') ) {
                    eventObj.existingEntryFocused.hide();
                }

            }
        }

        if( special ) {
            handler( function() { toggleWebsite( existingEntryFocusedContent ) } );
            toggleWebsite( this.content, readOrUnreadAtToggle( this.entry ) );
        } else {
            handler( function() { existingEntryFocusedContent.toggle() } );
            this.toggleContent( readOrUnreadAtToggle( this.entry ) );
        }

        this.content.toggle();
    },

    toggleContent: function( callback ) {
        eventId = this.entry.data('id');
        if( this.content.children().length == 0 ) {
            $.ajax({
                url: "./plugins/leedvibes/article_content.php",
                data:{ id: eventId },
                context: this
            })
                .done(function( data ) {
                    this.content.append( data );
                    if( typeof( callback ) == 'function' )
                        callback();
                })
                .fail(function() {
                    alert( "error" );
                });
        } else {
            this.content.empty();
        }

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

function countersHandler( feedID, operation ) {
    var feed = $('.js-feed__item[data-id="'+feedID+'"]'),
        elements = [ feed.find('.js-feed-counter'),
                     feed.parents('.js-folder').find('.js-folder-counter'),
                     $('.js-total-counter')
                    ];

    var counterHandler = function( counter ) {
        var i = parseInt(counter.html());
        if( operation == '+' || operation == 'plus' ) {
            i++;
        } else {
            i--;
        }

        return i;
    }

    for (i = 0; i < elements.length; ++i) {
        var element = elements[i];
        element.html( counterHandler( element ) );
    }

}

function setScrollInfiniLimit() {
    // Catch the 5th event from the bottom
    scrollInfiniLimit = $('.js-feed__entry').slice(-5, -4);
}


/* FROM marigolds/js/script.js */
function readThis(element,id,callback){
    var entry = $(element).parents('.js-feed__entry');
    var nextEvent = $('#'+id).next();
    //sur les éléments non lus
    if(!entry.hasClass('js-event--read')){
        entry.find('[type="checkbox"]').prop('checked', true);
        // Decrement feed number
        countersHandler( entry.data('feed-id') );
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
        $.ajax({
            url: "./action.php?action=readContent",
            data:{id:id},
            success:function(msg){
                if(msg.status == 'noconnect') {
                    alert(msg.texte)
                } else {
                    // on compte combien d'article ont été lus afin de les soustraires de la requête pour le scroll infini
                    $(window).data('nblus', $(window).data('nblus')+1);
                    // on diminue le nombre d'article en haut de page
                    $('#nbarticle').html(parseInt($('#nbarticle').html()) - 1);
                    if(scrollInfiniLimit.offset().top < ($(window).scrollTop() + $(window).height()) ) {
                        scrollInfini( true );
                    }
                }
            }
        });
    }else{  // sur les éléments lus
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

function scrollInfini(go) {
    var deviceAgent = navigator.userAgent.toLowerCase();
    var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);

    if($('.wrapper').length) {
        // On teste si ajaxready vaut false, auquel cas on stoppe la fonction
        if ($(window).data('ajaxready') == false) return;

        if( go 
           || (($(window).scrollTop() + $(window).height()) + 50 >= $(document).height()
           || agentID && ($(window).scrollTop() + $(window).height()) + 150 > $(document).height()))
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
                    setScrollInfiniLimit();
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
