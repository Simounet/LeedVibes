var scrollInfiniLimit = '',
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

    $(".js-toggle-button").click( function() {
        toggleFolder( $(this) );
    });

    $(".js-toggle-target").click( function() {
        var button = $(this);
        $( button.data( 'target' ) ).slideToggle( 200 );
        button.toggleClass( 'is-toggled' );
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

    $('.wrapper').append('<div id="loader" class="infinite-scroll hidden">'+_t('LOADING')+'</div>');

    setScrollInfiniLimit();

    var load = false;
    var offset = $('.wrapper:last').offset(); 

    $(window)
        .data('ajaxready', true)
        .data('page', 1)
        .data('nblus', 0)
        .scroll(function(){
            if((offset.top-$(window).height() <= $(window).scrollTop()) 
            && load==false) {
                scrollInfini();
            }
        });
});

function EventObject( event ) { 
    this.target  = $(event.target);
    this.targetClasses = ( typeof( this.target.attr('class') ) != 'undefined' ) ? this.target.attr('class') : '';

    this.entry   = $(event.currentTarget);
    this.content = this.entry.find( '.' + this.contentClass );

    // Work around for SVGs click handling
    var favoriteTarget = this.target.parents( '.' + this.favoriteClass )
    var isFavoriteAction = favoriteTarget.length;
    if( isFavoriteAction ) {
        this.favorite( favoriteTarget );
        return;
    }

    // Read button handling
    if( this.targetClasses.indexOf( this.readButtonClass ) != -1 ) {
        this.hideEntryIfNotUnfolded();
        this.readUnreadButtonAction();
    }

    this.existingEntryFocused = $('.js-feed__entry.js-focus');
    this.isExistingEntryFocused = this.existingEntryFocused.length;
    this.currentEntryIsPrevious = ( this.entry[0] == this.existingEntryFocused[0] );

    this.existingEntryFocusedContent = this.currentEntryIsPrevious ?
        false
        :
        this.existingEntryFocused.find( '.' + this.contentClass );

    // If click on the entry's title
    // Or on the entry's header
    if( this.target.parents( '.' + this.headerClass ).length
        || this.target.hasClass( this.headerClass )
    ) {
        this.toggleEvent();
    }
}

EventObject.prototype = {
    headerClass:  'js-article__header',
    contentClass: 'js-article__content',
    readButtonClass:  'js-read-unread',
    favoriteClass: 'js-favorite',

    readUnreadButtonAction: function(){
        var id = this.entry.data('id');

        if( this.target.hasClass( this.readButtonClass ) ){
            readThis( $(this.target), id );
        }
    },

    toggleEvent: function() {
        var websiteView = this.entry.hasClass('js-website'); // [todo] - move this var to LeedRSSOrSiteView plugin

        this.toggleHeaderFocus();
        this.toggleItem( websiteView );
    },

    toggleHeaderFocus: function() {
        // If we are not clicking on the already focused element
        // And there is and existing focused element
        // Then remove focus class
        if( ! this.currentEntryIsPrevious && this.isExistingEntryFocused ) {
            this.existingEntryFocused.removeClass('js-focus feed__entry--focus');
        }

        this.entry.toggleClass('js-focus feed__entry--focus');
    },

    toggleItem: function( special ) {
        var entry = this.entry,
            target = this.target;

        var readOrUnreadAtToggle = function () {
            if( ! entry.hasClass( 'js-event--read' ) && entry.hasClass('js-focus') ) {
                readThis( $(target), entry.data('id') );
            }
        }

        // Content handling
        if( special ) {
            toggleWebsite( this.content, readOrUnreadAtToggle() );
        } else {
            this.toggleContent( readOrUnreadAtToggle() );
        }

        // Hide the previous entry
        if( this.existingEntryFocusedContent.length ) {
            if( special ) {
                toggleWebsite( this.existingEntryFocusedContent );
            }
            this.existingEntryFocused.addClass( 'hidden' );
            this.existingEntryFocusedContent.removeClass( 'article__content--is-opened' );
        }

        // Toggle current entry
        this.content.toggleClass( 'article__content--is-opened' );

        $(window).scrollTop( this.entry.offset().top );
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

    },

    hideEntryIfNotUnfolded: function() {
        if(
            ! this.target.siblings( '[type="checkbox"]' ).prop( 'checked' )
           && this.content.not( ':visible' ).length
        ) {
            this.entry.addClass( 'hidden' );
        }
    },

    favorite: function( favoriteTarget ) {
        var favImage = favoriteTarget,
            favAction = ( this.entry.data( 'favorite' ) == 1 ) ? 'remove' : 'add',
            favText = ( this.entry.data( 'favorite' ) != 1 ) ? 'UNFAVORIZE' : 'FAVORIZE';

        favImage.toggleClass('article-favorite--favorited');
        this.entry.data( 'favorite', ! this.entry.data( 'favorite' ) );
        $.ajax({
            url: "./action.php?action=" + favAction + "Favorite",
            data:{id: this.entry.data( 'id' )},
            success:function(msg){
                if(msg.status == 'noconnect') {
                    alert(msg.texte)
                } else {
                    if( console && console.log && msg!="" ) console.log(msg);
                    favImage
                        .prop( 'alt', _t( favText ) )
                        .prop( 'title', _t( favText ) );
                }
            }
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
    $(button).toggleClass('folder-closed');
    
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
    // [facto] - get entry directly
    var entry = element.parents('.js-feed__entry'),
        nextEvent = $('#'+id).next(),
        readUnreadButton = entry.find( '.js-read-unread' );
    //sur les éléments non lus
    if(!entry.hasClass('js-event--read')){
        entry.find('[type="checkbox"]').prop('checked', true);
        // Decrement feed number
        countersHandler( entry.data('feed-id') );
        entry.addClass('event--read js-event--read');
        readUnreadButton.prop( 'title', _t( 'LEEDVIBES_MARK_AS_UNREAD' ) );

        if( ( entry.find('.js-article__content').css('display') == 'none' ) && element.hasClass('js-read-unread') ) {
            // If the article is not visible
            // We pressed the read button as first action
            // So we doesn't need to toggle the content opened class
            if( entry.find( '.js-article__content' ).is( ':visible' ) ) {
                entry.toggleClass( 'article__content--is-opened',function(){
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
        readUnreadButton.prop( 'title', _t( 'LEEDVIBES_MARK_AS_READ' ) );
        $.ajax({
                url: "./action.php?action=unreadContent",
                data:{id:id},
                success:function(msg){
                    if(msg.status == 'noconnect') {
                        alert(msg.texte)
                    } else {
                        if( console && console.log && msg!="" ) console.log(msg);
                        entry.find('[type="checkbox"]').prop('checked', false);
                        entry.removeClass('event--read js-event--read');
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
            var loading = $('#infinite-scroll-loading'),
                loadingFadeTime = 500,
                loadingDelayTime = 2000;
            // lorsqu'on commence un traitement, on met ajaxready à false
            $(window).data('ajaxready', false);

            showOrHide( loading, 'show' );

            // récupération des variables passées en Get
            var action = getUrlVars()['action'];
            var folder = getUrlVars()['folder'];
            var feed = getUrlVars()['feed'];
            var order = ( getUrlVars()['order'] != '' ) ? '&order=' + getUrlVars()['order'] : '';

            $.ajax({
                url: './article.php',
                type: 'post',
                data: 'scroll='+$(window).data('page')+'&nblus='+$(window).data('nblus')+'&action='+action+'&folder='+folder+'&feed='+feed+order,

                success: function(data) {
                    if (data.replace(/^\s+/g,'').replace(/\s+$/g,'') != '')
                    {    // on les insère juste avant le loading
                        loading.before(data);
                        //on supprime de la page le script pour ne pas intéragir avec les next & prev
                        //$('article .scriptaddbutton').remove();
                        //si l'élement courant est caché, selectionner le premier élément du scroll
                        //ou si le div loading est sélectionné (quand 0 article restant suite au raccourcis M)
                        //if (($('article section.eventSelected').attr('style')=='display: none;')
                        //    || ($('article div.eventSelected').attr('id')=='loading'))
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
                        showOrHide( loading, 'hide' );
                    } else {
                        showOrHide( loading, 'hide' );
                        showOrHide( $('#no-more-events'), 'show' );
                    }
                 },
                complete: function(){
                    // le chargement est terminé, on fait disparaitre notre loading
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

//synchronisation manuelle lancée depuis le boutton du menu
function synchronize(code){
    if(code!=''){
        $('#articles').prepend('<section>'+
        '<iframe class="importFrame" src="action.php?action=synchronize&format=html&code='+code+'" name="idFrameSynchro" id="idFrameSynchro" width="100%" height="300" ></iframe>'+
        '</section>');
    }else{
        alert(_t('YOU_MUST_BE_CONNECTED_FEED'));
    }
}

function showOrHide( identifier, action ) {
    var el = $( identifier );

    if( ! action || action == 'show' ) {
        el.animate(
            {opacity: 'show', height: 'show'},
            {duration: 'slow', complete: function() { el.removeClass( 'hidden' ); }}
        )
    }

    if( ! action || action == 'hide' ) {
        el.delay( 4000 )
            .animate(
                {opacity: 'hide', height: 'hide'},
                {duration: 'slow', complete: function() { el.addClass( 'hidden'); }}
            );
    }
}
