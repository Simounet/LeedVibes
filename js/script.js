$(window)
    .data('ajaxready', true)
    .data('page', 1)
    .data('nblus', 0);

var eventObj;
const idsDisplayed = [];
const undoMarkAsRead = {
    ids: [],
    class: '.js-undo-mark-as-read',

    addId: function (id) {
        this.ids.push(id);
        if (this.ids.length === 1) {
            document.querySelector(this.class).classList.remove('hidden');
        }
    },

    pop: function () {
        const lastMarkAsReadEntryId = this.ids.pop();
        if (this.ids.length === 0) {
            document.querySelector(this.class).classList.add('hidden');
        }
        return lastMarkAsReadEntryId;
    },

    init: function () {
        $(this.class).click(() => {
            this.undoMarkAsRead();
        });
    },

    undoMarkAsRead: function () {
        'use strict';

        if (this.ids.length === 0) {
            return false;
        }

        const lastReadEntry = this.pop();
        document
            .querySelector('article[data-id="' + lastReadEntry + '"]')
            .querySelector('.js-read-unread')
            .click();
    }
};
let anonymousState = 0;

function _t (key, args) {
    let value = i18n[key];
    if (typeof (args) === 'object') {
        args.map((arg, i) => {
            value = value.replace('$' + (i + 1), arg);
        });
    }
    return value;
}

const cookieHelper = {
    set: (name, value) => {
        document.cookie = `${name}=${value};samesite=Lax;path=/;max-age=31536000`;
    },

    remove: (name) => {
        document.cookie = `${name}=auto;samesite=Lax;path=/;max-age=0`;
    },

    exists: (name) => {
        return document.cookie
            .split(';')
            .map((cookie) => cookie.split('='))
            .filter((cookie) => cookie[0].trim() === name).length;
    }
};

(function darkTheme () {
    const rootEl = document.querySelector('html');
    const themeDom = {
        darkClass: 'dark-theme',

        toggleClass (el) {
            return el.classList.toggle(this.darkClass);
        },

        addClass (el) {
            return el.classList.add(this.darkClass);
        },

        removeClass (el) {
            return el.classList.remove(this.darkClass);
        }
    };
    const themeCookie = {
        values: {
            light: 'light',
            dark: 'dark'
        },

        name: 'theme',

        getValue (isDarkTheme) {
            return isDarkTheme ? this.values.dark : this.values.light;
        },

        setCookie (isDarkTheme) {
            const value = this.getValue(isDarkTheme);
            cookieHelper.set(this.name, value);
        },

        removeCookie () {
            cookieHelper.remove(this.name);
        },

        exists () {
            return cookieHelper.exists(this.name);
        }
    };
    const preferedColorScheme = {
        choose () {
            if (this.isAvailable() && themeCookie.exists() === 0) {
                const isPreferedColorSchemeDark = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                if (themeCookie.exists() === 0) {
                    themeDom[isPreferedColorSchemeDark ? 'addClass' : 'removeClass'](rootEl);
                }
            }
        },

        isAvailable () {
            return typeof window.matchMedia === 'function';
        },

        init () {
            if (!this.isAvailable()) {
                return false;
            }
            this.choose();
            window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
                this.choose();
            });
        }
    };
    const addListeners = () => {
        $(function () {
            'use strict';
            const themeButtonLow = document.querySelector('.js-theme-toggle-set[data-theme="light"]');
            themeButtonLow.addEventListener('click', () => {
                themeDom.removeClass(rootEl);
                themeCookie.setCookie(false);
            });
            const themeButtonHigh = document.querySelector('.js-theme-toggle-set[data-theme="dark"]');
            themeButtonHigh.addEventListener('click', () => {
                themeDom.addClass(rootEl);
                themeCookie.setCookie(true);
            });
            const themeButtonAuto = document.querySelector('.js-theme-toggle-set[data-theme="auto"]');
            themeButtonAuto.addEventListener('click', () => {
                themeCookie.removeCookie();
                preferedColorScheme.choose();
            });
        });
    };
    preferedColorScheme.init();
    addListeners();
})();

const shareButtonAction = async (title, url) => {
    const shareData = {
        title,
        url
    };
    await navigator.share(shareData);
};

$(function () {
    'use strict';

    anonymousState = $('[data-anonymous-state]').data('anonymous-state');
    undoMarkAsRead.init();

    $('.wrapper').on('click keypress', '.js-event', function (event) {
        if (event.type === 'click' || event.which === 13) {
            eventObj = new EventObject(event);
        }
    });

    $('.js-toggle-button').click(function () {
        toggleFolder($(this));
    });

    $('.js-toggle-target').click(function (event) {
        event.preventDefault();
        const button = $(this);
        const targetElement = $(button.data('target'));
        const bodyOverflowNeeded = button.data('toggle-overflow') || false;
        const isExpanded = targetElement.data('is-opened');
        const alreadyOpened = $('[data-is-opened="true"]');
        alreadyOpened
            .attr('data-is-opened', false)
            .data('is-opened', false);

        if (isExpanded) {
            if (bodyOverflowNeeded !== false) {
                $('body').css('overflow', '');
            }
            targetElement
                .attr('data-is-opened', false)
                .data('is-opened', false);
        } else {
            targetElement
                .attr('data-is-opened', true)
                .data('is-opened', true);
            if (bodyOverflowNeeded !== false) {
                $('body').css('overflow', 'hidden');
            }
        }
    });

    $('.js-feeds-list-toggle').click(function () {
        $(this).toggleClass('is-opened');
    });

    const refreshEl = $('.js-new-events');
    const syncCode = $(this).data('sync-code');
    refreshEl.click(function (e) {
        e.preventDefault();
        refreshEvents(syncCode);
    });

    $('.sidebar').on('click', '.js-mark-as-read', function () {
        const button = $(this);
        markAsRead(button);
    });

    const popin = {
        el: document.querySelector('.js-popin'),
        previousFocusedEl: null,

        brightnessClass: 'js-brightness-list',
        shortcutsClass: 'js-shortcuts-list',

        show: function (name) {
            Mousetrap.bind('esc', () => { this.close(); });
            const isShortcuts = name === this.shortcutsClass;
            this.previousFocusedEl = document.activeElement;
            this.el.querySelector('.js-brightness-list').classList[isShortcuts ? 'add' : 'remove']('hidden');
            this.el.querySelector('.js-shortcuts-list').classList[isShortcuts ? 'remove' : 'add']('hidden');
            this.el.classList.remove('hidden');
            this.el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').focus();
        },

        close: function () {
            this.el.classList.add('hidden');
            this.previousFocusedEl.focus();
        },

        showShortcuts: function () {
            this.show(this.shortcutsClass);
        },

        toggleShortcuts: function () {
            this.el.querySelector('.js-brightness-list').classList.add('hidden');
            this.el.querySelector('.js-shortcuts-list').classList.remove('hidden');
            this.el.classList.toggle('hidden');
        },

        showBrightness: function () {
            this.show(this.brightnessClass);
        },

        init: function () {
            this.el.addEventListener('click', this.close.bind(this));
        }
    };
    popin.init();

    $('.js-shortcuts-toggle').on('click', function () {
        popin.showShortcuts();
    });
    $('.js-brightness-toggle').on('click', function () {
        popin.showBrightness();
    });

    pushIdsDisplayed($('.js-event'));

    const userAction = new UserActionObject();
    Mousetrap.bind('j', function () { userAction.moveForward(); });
    Mousetrap.bind('k', function () { userAction.moveBackward(); });
    Mousetrap.bind('f', function () { userAction.clickFocused('.js-favorite'); });
    Mousetrap.bind('x', function () { userAction.markAsReadFocused('.js-read-unread'); });
    Mousetrap.bind('g h', function () { window.location.href = $('[data-link="home"]')[0].href; });
    Mousetrap.bind('g f', function () { window.location.href = $('[data-link="favorites"]')[0].href; });
    Mousetrap.bind('g s', function () { window.location.href = $('[data-link="settings"]')[0].href; });
    Mousetrap.bind('r', function () { refreshEvents(syncCode); });
    Mousetrap.bind('?', function () { popin.toggleShortcuts(); });

    Mousetrap.bind('m', function () {
        const button = $('.selected').find('.js-mark-as-read');
        markAsRead(button);
    });
});

const uiSideToggle = function () {
    const uiSideCookieKey = 'ui-side';
    const uiSide = {
        LEFT: 'left',
        RIGHT: 'right'
    };

    document.querySelector('[data-js="ui-side"]').addEventListener('click', () => {
        const usedHand = document.querySelector('html').classList.toggle('ui-side-reverse')
            ? uiSide.LEFT
            : uiSide.RIGHT;
        cookieHelper.set(uiSideCookieKey, usedHand);
    });
};

document.addEventListener('DOMContentLoaded', function (event) {
    uiSideToggle();
    const firstSentinelEl = document.getElementsByClassName('js-article__header')[0];
    const articlesPerPage = $('[data-articles-per-page]').data('articles-per-page');
    if (typeof (firstSentinelEl) !== 'object') {
        return false;
    }
    let watchCount = Math.floor(articlesPerPage / 2);
    const sentinel = {
        el: null,
        set: function (el) {
            this.el = el;
            this.el.classList.add('sentinel');
            sentinelObserver.observe(this.el);
        },
        unset: function () {
            if (!this.el) { return; }
            sentinelObserver.unobserve(this.el);
            this.el.classList.remove('sentinel');
            this.el = null;
        }
    };
    const sentinelListener = function (entries) {
        entries.map(entry => {
            if (entry.isIntersecting) {
                sentinel.unset();
                infiniteScroll().then(function () {
                    updateSentinel();
                });
            }
        });
    };
    const updateSentinel = function () {
        const newSentinelEl = document.getElementsByClassName('js-article__header')[watchCount];
        if (typeof (newSentinelEl) !== 'object') {
            return false;
        }
        sentinel.set(newSentinelEl);
        watchCount += articlesPerPage;
    };
    const sentinelObserver = new IntersectionObserver(sentinelListener);
    updateSentinel();
});

function UserActionObject () {}

UserActionObject.prototype = {
    focusedClass: 'event--focused',
    focusedEl: $(),
    prevEl: false,
    nextEl: false,

    setFocusedEl: function (el) {
        el.addClass(this.focusedClass);
        this.focusedEl = el;
    },

    setPrevEl: function () {
        this.prevEl = this._getEl('prev');
    },

    setNextEl: function () {
        this.nextEl = this._getEl('next');
    },

    _getEl: function (action) {
        if (this.focusedEl.length === 0 || this.focusedEl[0].parentNode === null) {
            return $('.js-event:visible').first();
        }
        const el = this.focusedEl[action]('.js-event');
        if (el.length > 0) {
            return el;
        }
        const existingEl = action + 'El';
        return this[existingEl];
    },

    moveForward: function () {
        this.setNextEl();
        this._move(this.nextEl);
    },

    moveBackward: function () {
        this.setPrevEl();
        this._move(this.prevEl);
    },

    _move: function (el) {
        this.focusedEl.removeClass(this.focusedClass);
        this.setFocusedEl(el);
    },

    markAsReadFocused: function (selector) {
        this.clickFocused(selector);
        this.moveForward();
    },

    clickFocused: function (selector) {
        if (typeof (this.focusedEl).length > 0) {
            return false;
        }
        this.focusedEl.find(selector).first().click();
    }
};

function getButtonCount (buttonEl) {
    return buttonEl
        .find('[data-count="number"]')
        .html();
}

function markAsRead (button) {
    let confirmText = '';
    let url = 'action.php?action=';
    let feedEl = {};
    let name = '';
    if (button.parents('.js-feed__item').length) {
        feedEl = button.parents('.js-feed__item');
        name = feedEl.find('.js-feed-name').html() + '\n';
        confirmText = 'CONFIRM_MARK_FEED_AS_READ';
        url += 'readAll&feed=' + feedEl.data('id');
    } else if (button.parents('.js-folder__item').length) {
        feedEl = button.parents('.js-folder');
        name = feedEl.find('.js-folder-name').html() + '\n';
        confirmText = 'READ_ALL_FOLDER_CONFIRM';
        url += 'readFolder&folder=' + feedEl.data('id');
    } else {
        confirmText = 'LEEDVIBES_READ_ALL_CONFIRM';
        url += 'readAll';
    }
    url += '&last-event-id=' + idsDisplayed[0];
    if (!confirm(name + _t(confirmText))) {
        return false;
    }

    $.ajax({
        url
    })
        .done(function () {
            const isTotalCounterButton = button.hasClass('js-total-counter');
            const isSelectedItem = button.parents('.selected').length;
            if (
                isTotalCounterButton &&
            !isSelectedItem
            ) {
                window.location = url;
            }
            if (isSelectedItem) {
                $('.js-event').remove();
                $('#no-more-events').removeClass('hidden');
            }

            const buttonToClear = isTotalCounterButton ? $('.js-mark-as-read') : button;
            const buttonCount = getButtonCount(buttonToClear);
            if (
                buttonToClear.hasClass('js-folder-counter') ||
            isTotalCounterButton
            ) {
                if (isTotalCounterButton) {
                    buttonToClear
                        .addClass('hidden')
                        .html('0');
                } else {
                    const totalButton = $('.js-total-counter');
                    totalButton.html(parseInt(getButtonCount(totalButton)) - buttonCount);
                    buttonToClear
                        .addClass('hidden')
                        .html('0')
                        .parents('.js-folder')
                        .find('.js-mark-as-read')
                        .addClass('hidden')
                        .html('0');
                }
            } else {
                feedCounters(buttonToClear.parents('.js-feed__item').data('id'), '-', buttonCount);
            }
        })
        .fail(function () {
            alert('error');
        });
}

function refreshEvents (syncCode) {
    const urlVars = getAllUrlVars();
    switch (urlVars.action) {
        case 'favorites':
            cleanUnstarredEvents();
            break;
        default:
            getNewEvents(syncCode, urlVars);
            hideReadEvents();
            break;
    }
}

function getBubblingTarget (current, targetClass) {
    const parentEl = current.parents('.' + targetClass);
    return parentEl.length === 1
        ? parentEl
        : current;
}

function EventObject (event) {
    'use strict';
    this.target = $(event.target);

    if (typeof event.target.dataset.shareTitle === 'string' && event.target.dataset.shareTitle.length > 0) {
        shareButtonAction(event.target.dataset.shareTitle, event.target.dataset.shareUrl);
    }

    this.entry = $(event.currentTarget);
    this.content = this.entry.find('.' + this.contentClass);

    this.target = getBubblingTarget(this.target, this.favoriteClass);
    if (this.target.hasClass(this.favoriteClass)) {
        event.preventDefault();
        this.favorite(this.target);
        return;
    }

    this.target = getBubblingTarget(this.target, this.readButtonClass);
    if (this.target.hasClass(this.readButtonClass)) {
        event.preventDefault();
        this.hideEntryIfNotUnfolded();
        this.readUnreadButtonAction();
    }

    this.existingEntryFocused = $('.js-event.js-focus');
    this.isExistingEntryFocused = this.existingEntryFocused.length;
    this.currentEntryIsPrevious = (this.entry[0] === this.existingEntryFocused[0]);

    this.existingEntryFocusedContent = this.currentEntryIsPrevious ? false : this.existingEntryFocused.find('.' + this.contentClass);

    // If click on the entry's title
    // Or on the entry's header
    if (!this.target.hasClass(this.readButtonClass) &&
        (
            this.target.parents('.' + this.titleClass).length ||
            this.target.hasClass(this.titleClass) ||
            this.target.parents('.' + this.articleClass).length ||
            this.target.hasClass(this.articleClass)
        )
    ) {
        event.preventDefault();
        this.toggleEvent();
    }
}

EventObject.prototype = {
    titleClass: 'js-article__title',
    articleClass: 'js-article__description',
    contentClass: 'js-leedvibes-article-content',
    readButtonClass: 'js-read-unread',
    favoriteClass: 'js-favorite',

    readUnreadButtonAction: function () {
        'use strict';
        const id = this.entry.data('id');

        if (this.target.hasClass(this.readButtonClass)) {
            readThis($(this.target), id);
        }
    },

    toggleEvent: function () {
        'use strict';
        this.toggleHeaderFocus();
        this.toggleItem();
    },

    toggleHeaderFocus: function () {
        'use strict';
        // If we are not clicking on the already focused element
        // And there is and existing focused element
        // Then remove focus class
        if (!this.currentEntryIsPrevious && this.isExistingEntryFocused) {
            this.existingEntryFocused.removeClass('js-focus event--focus');
        }

        this.entry.toggleClass('js-focus event--focus');
    },

    toggleItem: function () {
        'use strict';
        const entry = this.entry;
        const target = this.target;

        const readOrUnreadAtToggle = function () {
            if (!entry.hasClass('js-event--read') && entry.hasClass('js-focus')) {
                readThis($(target), entry.data('id'));
            }
        };

        this.toggleContent(readOrUnreadAtToggle());

        // Hide the previous entry
        if (this.existingEntryFocusedContent.length) {
            this.existingEntryFocused.addClass('hidden');
            this.existingEntryFocusedContent.removeClass('leedvibes-article-content--is-opened');
        }

        // Toggle current entry
        this.content.toggleClass('leedvibes-article-content--is-opened');

        $(window).scrollTop(this.entry.offset().top);
    },

    toggleContent: function (callback) {
        'use strict';
        const eventId = this.entry.data('id');
        if (this.content.children().length === 0) {
            $.ajax({
                url: './plugins/leedvibes/article_content.php',
                data: { id: eventId },
                context: this
            })
                .done(function (data) {
                    this.content.append(data);
                    if (typeof (callback) === 'function') {
                        callback();
                    }
                })
                .fail(function () {
                    alert('error');
                });
        } else {
            this.content.empty();
        }
    },

    hideEntryIfNotUnfolded: function () {
        'use strict';
        if (
            !this.target.hasClass('article__read-read') &&
           this.content.not(':visible').length
        ) {
            this.entry.addClass('hidden');
        }
    },

    favorite: function (favoriteTarget) {
        'use strict';
        const favAction = (this.entry.data('favorite') === 1) ? 'remove' : 'add';
        const favText = (this.entry.data('favorite') !== 1) ? 'UNFAVORIZE' : 'FAVORIZE';

        favoriteTarget
            .toggleClass('article-favorite--favorited')
            .toggleClass('js-favorite--favorited');

        const favDataFavorite = (this.entry.data('favorite') === 1)
            ? 0
            : 1;
        this.entry.data('favorite', favDataFavorite);
        $.ajax({
            url: './action.php?action=' + favAction + 'Favorite',
            data: { id: this.entry.data('id') },
            success: function (msg) {
                if (!anonymousState && msg.status === 'noconnect') {
                    alert(msg.texte);
                } else {
                    favoriteTarget
                        .prop('alt', _t(favText))
                        .prop('title', _t(favText));
                }
            }
        });
    }
};

function toggleFolder (button) {
    'use strict';
    const folderBloc = button.parents('.js-folder');
    const feedBloc = folderBloc.find('.js-toggle-item');
    const folderNameEl = folderBloc.find('.js-folder-name');
    const folderNameText = folderNameEl.text();
    const isAriaExpanded = button.attr('aria-expanded') === 'true';
    const newAriaExpanded = isAriaExpanded
        ? 'false'
        : 'true';
    button.attr('aria-expanded', newAriaExpanded);
    const buttonTitle = isAriaExpanded
        ? 'LEEDVIBES_FOLDER_TOGGLE_OFF'
        : 'LEEDVIBES_FOLDER_TOGGLE_ON';
    button.prop('title', _t(buttonTitle, [folderNameText]));

    feedBloc.slideToggle(200, function () {
        $(this).toggleClass('hidden');
    });
    button.toggleClass('folder-closed');

    const open = isAriaExpanded
        ? 0
        : 1;
    $.ajax({
        url: './action.php?action=changeFolderState',
        data: { id: folderBloc.data('id'), isopen: open }
    });
}

function feedCounters (feedID, operation, operationNumber) {
    'use strict';
    if (typeof (operationNumber) === 'undefined') {
        operationNumber = 1;
    }
    const feed = $('.js-feed__item[data-id="' + feedID + '"]');
    const elements = [
        feed.find('.js-feed-counter'),
        feed.parents('.js-folder').find('.js-folder-counter'),
        $('.js-total-counter')
    ];

    const counterHandler = function (counter) {
        const currentValue = parseInt(counter.html());
        return operation === '+' || operation === 'plus'
            ? currentValue + operationNumber
            : currentValue - operationNumber;
    };

    elements.map(element => {
        const counterEl = element.find('[data-count="number"]');
        const textEl = element.find('[data-count="text"]');
        const newCount = counterHandler(counterEl);
        const newCountTextKey = newCount > 1 ? 'LEEDVIBES_UNREADS' : 'LEEDVIBES_UNREAD';
        counterEl.html(newCount);
        textEl.html(_t(newCountTextKey));
        if (newCount === 0) {
            element.addClass('hidden');
        } else {
            element.removeClass('hidden');
        }
    });
}

function readThis (element, id, callback) {
    'use strict';
    // [facto] - get entry directly
    const entry = element.parents('.js-event');
    const nextEvent = $('#' + id).next();
    const readUnreadButton = entry.find('.js-read-unread');
    const readUnreadImage = readUnreadButton.find('img');
    const entryReadClasses = 'event--read js-event--read';
    if (!entry.hasClass('js-event--read')) {
        readUnreadButton.addClass('article__read-read');
        // Decrement feed number
        feedCounters(entry.data('feed-id'));
        entry.addClass(entryReadClasses);
        readUnreadImage.prop('alt', _t('LEEDVIBES_MARK_AS_UNREAD'));

        if ((entry.find('.js-leedvibes-article-content').css('display') === 'none') && element.hasClass('js-read-unread')) {
            // If the article is not visible
            // We pressed the read button as first action
            // So we doesn't need to toggle the content opened class
            if (entry.find('.js-leedvibes-article-content').is(':visible')) {
                entry.toggleClass('leedvibes-article-content--is-opened', function () {
                    if (callback) {
                        callback();
                    } else {
                        targetThisEvent(nextEvent, true);
                    }
                    // on simule un scroll si tous les events sont cachés
                    if ($('article section:last').attr('style') === 'display: none;') {
                        $(window).scrollTop($(document).height());
                    }
                });
            }
        }
        undoMarkAsRead.addId(id);
        $.ajax({
            url: './action.php?action=readContent',
            data: { id },
            success: function (msg) {
                if (!anonymousState && msg.status === 'noconnect') {
                    alert(msg.texte);
                } else {
                    // nblus increment, used by the infinite scroll function
                    $(window).data('nblus', $(window).data('nblus') + 1);
                }
            }
        });
    } else {
        entry.removeClass(entryReadClasses + ' hidden');
        readUnreadImage.prop('alt', _t('LEEDVIBES_MARK_AS_READ'));
        $.ajax({
            url: './action.php?action=unreadContent',
            data: { id },
            success: function (msg) {
                if (!anonymousState && msg.status === 'noconnect') {
                    alert(msg.texte);
                } else {
                    readUnreadButton.removeClass('article__read-read');
                    entry.removeClass('event--read js-event--read');
                    if (callback) {
                        callback();
                    }
                }
            }
        });
        // Increment feed number
        feedCounters(entry.data('feed-id'), '+');
    }
}

function targetThisEvent (event, focusOn) {
    'use strict';
    const target = $(event);
    if (target.prop('tagName') === 'SECTION') {
        $('.eventSelected').removeClass('eventSelected');
        target.addClass('eventSelected');
        const id = target.attr('id');
        if (id && focusOn)window.location = '#' + id;
    }
    if (target.prop('tagName') === 'DIV') {
        $('.eventSelected').removeClass('eventSelected');
        target.addClass('eventSelected');
    }
}

function infiniteScroll () {
    'use strict';
    const noMoreEventsEl = $('#no-more-events');
    if (noMoreEventsEl.is(':visible')) {
        return Promise.resolve();
    }
    const loading = $('#infinite-scroll-loading');
    $(window).data('ajaxready', false);

    loading.removeClass('hidden');

    const urlVars = getAllUrlVars();
    const action = urlVars.action;
    const folder = urlVars.folder;
    const feed = urlVars.feed;
    const order = (typeof (urlVars.order) !== 'undefined') ? '&order=' + urlVars.order : '';

    return $.ajax({
        url: './article.php',
        type: 'post',
        data: 'scroll=' + $(window).data('page') + '&nblus=' + $(window).data('nblus') + '&action=' + action + '&folder=' + folder + '&feed=' + feed + order,

        success: function (data) {
            if (data.replace(/^\s+/g, '').replace(/\s+$/g, '') !== '') {
                const articlesEls = $.parseHTML($.trim(data)).filter(item => item.tagName === 'ARTICLE' && !idsDisplayed.includes(item.dataset.id));
                const articles = $(articlesEls);
                $('.articles').append(articles);
                pushIdsDisplayed(articles);
                $(window).data('page', $(window).data('page') + 1);
                const articlesPerPage = $('[data-articles-per-page]').data('articles-per-page');
                const noMoreEvents = $(data).filter('article').length < articlesPerPage;
                if (noMoreEvents) {
                    loading.addClass('hidden');
                    noMoreEventsEl.removeClass('hidden');
                }
            } else {
                loading.addClass('hidden');
                noMoreEventsEl.removeClass('hidden');
            }
        },
        complete: function () {
            loading.addClass('hidden');
            $(window).data('ajaxready', true);
        }
    });
}

// Returns an array containing all the url's variables
function getAllUrlVars () {
    'use strict';
    const vars = [];
    const urlParams = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    urlParams.map(urlParam => {
        const [key, value] = urlParam.split('=');
        vars.push(key);
        if (value) {
            const rehash = value.split('#');
            vars[key] = rehash[0];
        } else {
            vars[key] = '';
        }
    });
    return vars;
}

function getNewEvents (code, urlVars) {
    'use strict';
    const noNewEvents = $('#no-new-events');

    // Check if ajax queries are locked
    if ($(window).data('ajaxready') === false) return;

    // Lock ajax queries
    $(window).data('ajaxready', false);

    // Loaders config
    const loadingClass = 'animation-spin';
    const loader = $('.js-new-events').children(':first');
    const loaderFadeTime = 500;

    // Show loader
    loader.addClass(loadingClass);
    loader.prop('disabled', 'disabled');

    const lastEventClass = 'event--new-last';
    $('.' + lastEventClass).removeClass(lastEventClass);

    const action = urlVars.action;
    const folder = urlVars.folder;
    const feed = urlVars.feed;
    const order = (typeof (urlVars.order) !== 'undefined') ? '&order=' + urlVars.order : '';
    const lastIdChecked = idsDisplayed[0];

    $.ajax({
        url: './article.php',
        type: 'POST',
        dataType: 'html',
        data: 'custom-action=new-events&action=' + action + '&folder=' + folder + '&feed=' + feed + order + '&last-id-checked=' + lastIdChecked,

        success: function (data) {
            if (data.replace(/^\s+/g, '').replace(/\s+$/g, '') !== '') {
                const newEvents = [];
                $($.parseHTML($.trim(data))).each(function () {
                    const parsedNode = $(this);
                    if (parsedNode.prop('tagName') === 'ARTICLE') {
                        newEvents.push(parsedNode);
                        feedCounters(parsedNode.data('feed-id'), '+');
                    }
                });
                $('.articles')
                    .prepend(newEvents);
                // Updating first id general info for the next call
                // .data( 'first-id', $( $(data)[0] ).data( 'id' ) );
                pushIdsDisplayed($(newEvents));
                $('.js-infinite-scroll-end').addClass('hidden');
            } else {
                if (!noNewEvents.is(':visible')) {
                    notifSlide(noNewEvents);
                }
            }
        },
        complete: function () {
            updateEventsDate();

            // Ajax queries autorized again
            $(window).data('ajaxready', true);
            loader.prop('disabled', '');

            // Hide loader
            setTimeout(
                function () {
                    loader.one('animationiteration webkitAnimationIteration', function () {
                        $(this).removeClass(loadingClass);
                    });
                },
                loaderFadeTime
            );
        }
    });
}

function hideReadEvents () {
    $('.js-event--read')
        .not('.hidden')
        .addClass('hidden');
}

function cleanUnstarredEvents () {
    $('.js-favorite')
        .not('.article-favorite--favorited')
        .parents('.js-event')
        .remove();
}

function notifSlide (el) {
    'use strict';
    el
        .animate(
            { opacity: 'show', height: 'show' },
            { duration: 'slow' }
        )
        .delay(4000)
        .animate(
            { opacity: 'hide', height: 'hide' },
            { duration: 'slow' }
        );
}

function pushIdsDisplayed (events) {
    'use strict';
    events.each(function () {
        const id = $(this).data('id');

        if (typeof (id) !== 'undefined') {
            idsDisplayed.push(id);
        }
    });

    idsDisplayed.sort((a, b) => b - a);
}

function updateEventsDate () {
    'use strict';

    const dateNow = new Date();

    $('[data-timestamp]:not([data-timestamp=""])').each(function () {
        const eventItem = $(this);
        const eventItemDataAttribute = 'timestamp';
        const date = new Date(eventItem.data(eventItemDataAttribute) * 1000);

        const newDate = getNewEventDate(date);

        if (typeof (newDate) === 'number') {
            if (newDate === 0) {
                eventItem.html(_t('LEEDVIBES_NOW'));
            } else {
                eventItem.html(newDate + ' ' + _t('LEEDVIBES_MN'));
            }
        } else if (newDate) {
            eventItem.html(newDate);
            eventItem.removeData(eventItemDataAttribute);
        }
    });

    function getNewEventDate (date) {
        const diff = dateNow.getTime() - date.getTime();
        const diffMinutes = Math.floor(diff / 1000 / 60);
        const timeMinutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        const timeString = date.getHours() + ':' + timeMinutes;

        // If the event date is in the future
        // We do nothin' (Jon Snow)
        if (diff < 1) {
            return false;
        }

        const result = (diffMinutes < 60) ? diffMinutes : timeString;

        return result;
    }
}
