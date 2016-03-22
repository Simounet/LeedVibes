/*jslint browser: true*/ /*global  $*/ /*global  i18n*/ /*global console*/ /*global alert*/ /*global confirm*/ /*global toggleWebsite*/
var infiniteScrollLimit = '',
    eventObj,
    idsDisplayed = [];
function _t(key,args){
    var value = i18n[key];
    if(typeof( args ) !== 'undefined' ){
        for(var i=0;i<args.length;i++){
            value = value.replace('$'+(i+1),args[i]);
        }
    }
    return value;
}

$(function() {
    "use strict";

    $( '.wrapper' ).on( 'click', '.js-event', function( event ) { 
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

    $('.js-new-events').click( function() {
        getNewEvents( $(this).data( 'sync-code' ) );
        cleanReadEvents();
    });

    $( '.sidebar' ).on( 'click', '.js-mark-as-read', function() {
        var button = $(this),
            confirmText = '',
            url = 'action.php?action=';
        if( button.parents('.js-feed__item').length ) {
            confirmText = 'CONFIRM_MARK_FEED_AS_READ';
            url += 'readAll&feed=' + button.parents('.js-feed__item').data('id');
        } else if( button.parents('.js-folder__item').length ) {
            confirmText = 'READ_ALL_FOLDER_CONFIRM';
            url += 'readFolder&folder=' + button.parents('.js-folder').data('id');
        } else {
            confirmText = 'LEEDVIBES_READ_ALL_CONFIRM';
            url += 'readAll';
        }
        url += '&last-event-id=' + idsDisplayed[0];
        if(! confirm(_t(confirmText))) {
            return false;
        }

        $.ajax({
            url: url
        })
            .done(function() {
                var isTotalCounterButton = button.hasClass( 'js-total-counter' ),
                    isSelectedItem = button.parents( '.selected' ).length;
                if(
                    isTotalCounterButton &&
                    ! isSelectedItem
                ) {
                    window.location=url;
                }
                if( isSelectedItem ) {
                    $('.js-event').remove();
                    $('#no-more-events').removeClass( 'hidden' );
                }

                var buttonToClear = isTotalCounterButton ?
                    $('.js-mark-as-read')
                    :
                    button;
                var buttonCount = buttonToClear.html();
                if(
                    buttonToClear.hasClass( 'js-folder-counter' ) ||
                    isTotalCounterButton
                ) {
                    if( isTotalCounterButton ) {
                        buttonToClear
                            .addClass('hidden')
                            .html( "0" );
                    } else {
                        $('.js-total-counter' ).html( parseInt( $('.js-total-counter').html() ) - buttonCount );
                        buttonToClear
                            .addClass( 'hidden' )
                            .html( "0" )
                            .parents( '.js-folder' )
                            .find('.js-mark-as-read')
                                .addClass( 'hidden' )
                                .html( "0" );
                    }
                } else {
                    feedCounters( buttonToClear.parents('.js-feed__item').data( 'id' ), '-', buttonCount );
                }
            })
            .fail(function() {
                alert( "error" );
            });

    });

    pushIdsDisplayed( $('.js-event') );

    setScrollInfiniLimit();

    $(window)
        .data('ajaxready', true)
        .data('page', 1)
        .data('nblus', 0)
        .scroll(function(){
            if( canLoadMore() ) {
                infiniteScroll();
            }
        });
});

function canLoadMore() {
    "use strict";
    if( $('#no-more-events').is( ':visible' ) ) {
        $(window).unbind('scroll');
    }
    if( (
            ( typeof( infiniteScrollLimit.offset() ) !== 'undefined' ) &&
            infiniteScrollLimit.offset().top < (
                $(window).scrollTop() + $(window).height()
            )
        ) &&
        $(window).data( 'ajaxready' ) === true
    ) {
        return true;
    }

}

function EventObject( event ) { 
    "use strict";
    this.target  = $(event.target);
    this.targetClasses = ( typeof( this.target.attr('class') ) != 'undefined' ) ? this.target.attr('class') : '';

    this.entry   = $(event.currentTarget);
    this.content = this.entry.find( '.' + this.contentClass );

    if( this.target.hasClass( this.favoriteClass ) ) {
        this.favorite( this.target );
        return;
    }

    // Read button handling
    if( this.targetClasses.indexOf( this.readButtonClass ) != -1 ) {
        this.hideEntryIfNotUnfolded();
        this.readUnreadButtonAction();
    }

    this.existingEntryFocused = $('.js-event.js-focus');
    this.isExistingEntryFocused = this.existingEntryFocused.length;
    this.currentEntryIsPrevious = ( this.entry[0] == this.existingEntryFocused[0] );

    this.existingEntryFocusedContent = this.currentEntryIsPrevious ?
        false
        :
        this.existingEntryFocused.find( '.' + this.contentClass );

    // If click on the entry's title
    // Or on the entry's header
    if( ! this.target.hasClass( this.readButtonClass ) &&
        (
            this.target.parents( '.' + this.headerClass ).length ||
            this.target.hasClass( this.headerClass )
        )
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
        "use strict";
        var id = this.entry.data('id');

        if( this.target.hasClass( this.readButtonClass ) ){
            readThis( $(this.target), id );
        }
    },

    toggleEvent: function() {
        "use strict";
        var websiteView = this.entry.hasClass('js-website-view'); // [todo] - move this var to LeedRSSOrSiteView plugin

        this.toggleHeaderFocus();
        this.toggleItem( websiteView );
    },

    toggleHeaderFocus: function() {
        "use strict";
        // If we are not clicking on the already focused element
        // And there is and existing focused element
        // Then remove focus class
        if( ! this.currentEntryIsPrevious && this.isExistingEntryFocused ) {
            this.existingEntryFocused.removeClass('js-focus event--focus');
        }

        this.entry.toggleClass('js-focus event--focus');
    },

    toggleItem: function( special ) {
        "use strict";
        var entry = this.entry,
            target = this.target;

        var readOrUnreadAtToggle = function () {
            if( ! entry.hasClass( 'js-event--read' ) && entry.hasClass('js-focus') ) {
                readThis( $(target), entry.data('id') );
            }
        };

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
        "use strict";
        var eventId = this.entry.data('id');
        if( this.content.children().length === 0 ) {
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
        "use strict";
        if(
            ! this.target.siblings( '[type="checkbox"]' ).prop( 'checked' ) &&
           this.content.not( ':visible' ).length
        ) {
            this.entry.addClass( 'hidden' );
        }
    },

    favorite: function( favoriteTarget ) {
        "use strict";
        var favAction = ( this.entry.data( 'favorite' ) == 1 ) ? 'remove' : 'add',
            favText = ( this.entry.data( 'favorite' ) != 1 ) ? 'UNFAVORIZE' : 'FAVORIZE';

        favoriteTarget.toggleClass('article-favorite--favorited');
        this.entry.data( 'favorite', ! this.entry.data( 'favorite' ) );
        $.ajax({
            url: "./action.php?action=" + favAction + "Favorite",
            data:{id: this.entry.data( 'id' )},
            success:function(msg){
                if(msg.status == 'noconnect') {
                    alert(msg.texte);
                } else {
                    if( console && console.log && typeof( msg ) !== 'undefined' ) console.log(msg);
                    favoriteTarget
                        .prop( 'alt', _t( favText ) )
                        .prop( 'title', _t( favText ) );
                }
            }
        });
    }
};

function toggleFolder( button ) {
    "use strict";
    var folderBloc = button.parents('.js-folder'),
        feedBloc = folderBloc.find('.js-toggle-item');

    var open = 0;
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

function feedCounters( feedID, operation, operationNumber ) {
    "use strict";
    if( typeof( operationNumber ) === 'undefined' ) {
        operationNumber = 1;
    }
    var feed = $('.js-feed__item[data-id="'+feedID+'"]'),
        elements = [ feed.find('.js-feed-counter'),
                     feed.parents('.js-folder').find('.js-folder-counter'),
                     $('.js-total-counter')
                    ];

    var counterHandler = function( counter ) {
        var i = parseInt(counter.html());
        if( operation == '+' || operation == 'plus' ) {
            i += operationNumber;
        } else {
            i -= operationNumber;
        }

        return i;
    };

    for (var i = 0; i < elements.length; ++i) {
        var element = elements[i],
            newCount = counterHandler( element );
        element.html( newCount );
        if( newCount === 0 ) {
            element.addClass( 'hidden' );
        } else {
            element.removeClass( 'hidden' );
        }
    }

}

function setScrollInfiniLimit() {
    "use strict";
    // Catch the 5th event from the bottom
    infiniteScrollLimit = $('.js-event').slice(-5, -4);
}

function readThis(element,id,callback){
    "use strict";
    // [facto] - get entry directly
    var entry = element.parents('.js-event'),
        nextEvent = $('#'+id).next(),
        readUnreadButton = entry.find( '.js-read-unread' );
    if(!entry.hasClass('js-event--read')){
        entry.find('[type="checkbox"]').prop('checked', true);
        // Decrement feed number
        feedCounters( entry.data('feed-id') );
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
                    alert(msg.texte);
                } else {
                    // nblus increment, used by the infinite scroll function
                    $(window).data('nblus', $(window).data('nblus')+1);
                }
            }
        });
    }else{
        readUnreadButton.prop( 'title', _t( 'LEEDVIBES_MARK_AS_READ' ) );
        $.ajax({
                url: "./action.php?action=unreadContent",
                data:{id:id},
                success:function(msg){
                    if(msg.status == 'noconnect') {
                        alert(msg.texte);
                    } else {
                        if( console && console.log && typeof( msg ) !== 'undefined' ) console.log(msg);
                        entry.find('[type="checkbox"]').prop('checked', false);
                        entry.removeClass('event--read js-event--read');
                        if(callback){
                            callback();
                        }
                    }
                }
        });
        // Increment feed number
        feedCounters( entry.data('feed-id'), '+' );
    }

}

function targetThisEvent(event,focusOn){
    "use strict";
    var target = $(event);
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
}

function infiniteScroll() {
    "use strict";
    var loading = $('#infinite-scroll-loading'),
        loadingFadeTime = 500,
        loadingDelayTime = 2000;
    $(window).data('ajaxready', false);

    loading.removeClass( 'hidden' );

    var urlVars = getAllUrlVars(),
        action  = urlVars.action,
        folder  = urlVars.folder,
        feed    = urlVars.feed,
        order   = ( typeof( urlVars.order ) !== 'undefined' ) ? '&order=' + urlVars.order : '';

    $.ajax({
        url: './article.php',
        type: 'post',
        data: 'scroll='+$(window).data('page')+'&nblus='+$(window).data('nblus')+'&action='+action+'&folder='+folder+'&feed='+feed+order,

        success: function(data) {
            if (data.replace(/^\s+/g,'').replace(/\s+$/g,'') !== '')
            {
                $('.articles').append(data);
                $(window).data('page', $(window).data('page')+1);
            } else {
                loading.addClass( 'hidden' );
                $('#no-more-events').removeClass( 'hidden' );
            }
         },
        complete: function(){
            loading.addClass( 'hidden' );
            $(window).data('ajaxready', true);
            setScrollInfiniLimit();
        }
    });
}

// Returns an array containing all the url's variables
function getAllUrlVars()
{
    "use strict";
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        if (hash[1]){
            var rehash = hash[1].split('#');
            vars[hash[0]] = rehash[0];
        } else {
            vars[hash[0]] = '';
        }


    }
    return vars;
}

function getNewEvents(code){
    "use strict";
    var noNewEvents =  $('#no-new-events');

    // Check if ajax queries are locked
    if( $(window).data('ajaxready') === false ) return;

    // Lock ajax queries
    $(window).data('ajaxready', false);

    // Loaders config
    var loadingClass = 'animation-spin',
        loader = $('.js-new-events').children(":first"),
        loaderFadeTime = 500;

    // Show loader
    loader.addClass( loadingClass );
    loader.prop( 'disabled', 'disabled' );

    var lastEventClass = 'event--new-last';
    $( '.' + lastEventClass ).removeClass( lastEventClass );

    var urlVars = getAllUrlVars(),
        action  = urlVars.action,
        folder  = urlVars.folder,
        feed    = urlVars.feed,
        order   = ( typeof( urlVars.order ) !== 'undefined' ) ? '&order=' + urlVars.order : '',
        lastIdChecked = idsDisplayed[0];

    $.ajax({
        url: './article.php',
        type: 'POST',
        dataType: "html",
        data: 'custom-action=new-events&action='+action+'&folder='+folder+'&feed='+feed+order+'&last-id-checked='+lastIdChecked,

        success: function(data) {
            if( data.replace(/^\s+/g,'').replace(/\s+$/g,'') !== '' ) {
                var newEvents = [];
                $( $.parseHTML( $.trim( data ) ) ).each( function() {
                    var parsedNode = $(this);
                    if( parsedNode.prop("tagName") === 'ARTICLE' ) {
                        newEvents.push( parsedNode );
                        feedCounters( parsedNode.data('feed-id'), '+' );
                    }
                });
                $( '.articles' )
                    .prepend( newEvents );
                // Updating first id general info for the next call
                //.data( 'first-id', $( $(data)[0] ).data( 'id' ) );
                pushIdsDisplayed( $( newEvents ) );
                $('.js-infinite-scroll-end').addClass( 'hidden' );
            } else {

                if( ! noNewEvents.is( ':visible' ) ) {
                    notifSlide( noNewEvents );
                }

            }

        },
        complete: function(){
            updateEventsDate();

            // Ajax queries autorized again
            $(window).data( 'ajaxready', true );
            loader.prop( 'disabled', '' );

            // Hide loader
            setTimeout(
                function() {
                    loader.removeClass( loadingClass );
                },
                loaderFadeTime
            );

        }
    });
}

function cleanReadEvents() {
    $('.js-event--read').remove();
}

function notifSlide( el ) {
    "use strict";
    el
        .animate(
            {opacity: 'show', height: 'show'},
            {duration: 'slow'}
        )
        .delay( 4000 )
        .animate(
            {opacity: 'hide', height: 'hide'},
            {duration: 'slow'}
        );
}

function pushIdsDisplayed( events ) {
    "use strict";
    events.each( function() {
        var id = $(this).data('id');

        if( typeof( id ) !== 'undefined' ) {
            idsDisplayed.push( id );
        }
    });

    idsDisplayed.sort();
    idsDisplayed.reverse();
}

function updateEventsDate() {
    "use strict";

    var dateNow = new Date();

    $('[data-timestamp]:not([data-timestamp=""])').each( function() {
        var eventItem = $(this),
            eventItemDataAttribute = 'timestamp',
            date = new Date( eventItem.data( eventItemDataAttribute ) *1000 );

        var newDate = getNewEventDate( date );

        if( typeof( newDate ) == 'number' ) {
            if( newDate === 0 ) {
                eventItem.html( _t( 'LEEDVIBES_NOW' ) );
            } else {
                eventItem.html( newDate + ' ' + _t( 'LEEDVIBES_MN' ) );
            }
        } else if( newDate ) {
            eventItem.html( newDate );
            eventItem.removeData( eventItemDataAttribute );
        }
    });

    function getNewEventDate( date ) {

        var diff = dateNow.getTime() - date.getTime(),
            diffMinutes = Math.floor( diff / 1000 / 60 ),
            timeMinutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
            timeString = date.getHours() + ':' + timeMinutes;

        // If the event date is in the future
        // We do nothin' (Jon Snow)
        if( diff < 1 ) {
            return false;
        }

        var result = ( diffMinutes < 60 ) ?
                diffMinutes
                :
                timeString;

        return result;

    }

}
