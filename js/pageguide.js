/*
 * Tracelytics PageGuide
 *
 * Copyright 2012 Tracelytics
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Contributing Author: Tracelytics Team
 */

/* PageGuide usage:

    Preferences:
        auto_show_first - Whether or not to focus on the first visible item
                        immediately on PG open (default true)
        track_events_cb - Optional callback for tracking user interactions
                        with pageguide.  Should be a method taking a single
                        parameter indicating the name of the interaction.
                        (default none)

*/
tl = window.tl || {};
tl.pg = tl.pg || {};

tl.pg.default_prefs = { 'auto_show_first': true,
                        'track_events_cb': null };

$(function() {
    /* page guide object, for pages that have one */

    if ($("#tlyPageGuide").length) {
        var guide = $("#tlyPageGuide");

        var guideWrapper = $('<div/>', {
            id: 'tlyPageGuideWrapper'
        }).appendTo('body');

        $('<div/>', {
            'title': 'Launch Page Guide',
            'class': 'tlypageguide_toggle',
            html: 'page guide<div><span>' + guide.data('tourtitle') +
                    '</span></div><a href="javascript:void(0);" title="close guide">close guide &raquo;</a>'
        }).appendTo(guideWrapper);

        guide.appendTo(guideWrapper);

        $('<div/>', { id: 'tlyPageGuideMessages' }).appendTo(guideWrapper);

        var pg = new tl.pg.PageGuide($('#tlyPageGuideWrapper'));
        var listener = new tl.pg.Listener(guideWrapper, $('#loading'));
        listener.scheduleCallback();
    }
});

tl.pg.PageGuide = function (pg_elem, preferences) {
    this.preferences = $.extend(tl.pg.default_prefs, preferences || {});
    this.$base = pg_elem;
    this.$all_items = $('#tlyPageGuide > li', this.$base);
    this.$items = $([]); /* fill me with visible elements on pg expand */
    this.$message = $('#tlyPageGuideMessages');
    this.$fwd = $('a.tlypageguide_fwd', this.$base);
    this.$back = $('a.tlypageguide_back', this.$base);
    this.cur_idx = 0;
    this.open = false;
    this.track_event = this.preferences.track_events_cb || function (_) { return; };

    /* set up deferred init */
    var that = this;
    $(document).ready( function() {
        that._on_ready();
    });
};

tl.pg.isScrolledIntoView = function(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom - 100));
};


/* to be executed on pg expand */
tl.pg.PageGuide.prototype._on_expand = function () {
    var that = this;

    /* set up initial state */
    this.position_tour();
    this.cur_idx = 0;

    $.d = document;
    $.w = window;
    // create a new stylesheet:
    var ns = $.d.createElement('style');
    $.d.getElementsByTagName('head')[0].appendChild(ns);

    // keep Safari happy
    if (!$.w.createPopup) {
        ns.appendChild($.d.createTextNode(''));
        ns.setAttribute("type", "text/css");
    }

    // get a pointer to the stylesheet you just created
    var sh = $.d.styleSheets[$.d.styleSheets.length - 1];

    // space for IE rule set
    var ie = "";

    /* add number tags and PG shading elements */
    this.$items.each(function(i) {
        var $p = $($(this).data('tourtarget') + ":visible:first");
        $p.addClass("tlypageguide_shadow tlypageguide_shadow" + i);

        var node_text = '.tlypageguide_shadow' + i + ':after { height: ' +
                            $p.outerHeight() + 'px; width: ' + $p.outerWidth(false) + 'px; }';

        // modern browsers
        if (!$.w.createPopup) {
            var k = $.d.createTextNode(node_text, 0);
            ns.appendChild(k);
        }
        // for IE
        else {
            ie += node_text;
        }

        $(this).prepend('<ins>' + (i + 1) + '</ins>');
        $(this).data('idx', i);
    });

    // is IE? slam styles in all at once:
    if ($.w.createPopup) {
        sh.cssText = ie;
    }

    /* interaction: click PG element */
    var item_click_handle = function () {
        that.track_event('PG.specific_elt');
        that.cur_idx = $(this).data('idx');
        that.show_message(this);
    };

    this.$items.off('click', item_click_handle);
    this.$items.on('click', item_click_handle);

    /* decide to show first? */
    if (this.preferences.auto_show_first && this.$items.length > 0) {
        this.show_message(this.$items[0]);
    }
};

tl.pg.PageGuide.prototype._on_ready = function () {
    var that = this;

    /* interaction: open/close PG interface */
    $('.tlypageguide_toggle, #tlyPageGuideMessages .tlypageguide_close', this.$base).live('click', function() {
        var $message = $("#tlyPageGuideMessages");
        if (that.open) {
            that.track_event('PG.close');
            that.$items.toggleClass('expanded');

            $message.animate({ height: "0" }, 500, function() {
                $(this).hide();
            });
            /* clear number tags and shading elements */
            $('ins').remove();
            $('body').removeClass('tlypageguide-open');
        }
        else {
            that.track_event('PG.open');
            that._on_expand();
            that.$items.toggleClass('expanded');
            $('body').addClass('tlypageguide-open');
        }

        that.open = !that.open;
        return false;
    });

    /* interaction: fwd/back click */
    this.$fwd.live('click', function() {
        that.track_event('PG.fwd');
        that.cur_idx = (that.cur_idx + 1) % that.$items.length;
        that.show_message(that.$items[that.cur_idx]);
        return false;
    });
    this.$back.live('click', function() {
        that.track_event('PG.back');
        /* it is too bad that mod is not implemented correctly in js */
        that.cur_idx = (that.cur_idx + that.$items.length - 1) % that.$items.length;
        that.show_message(that.$items[that.cur_idx], true);
        return false;
    });

    /* register resize callback */
    $(window).resize(function() { that.position_tour(); });
};

tl.pg.PageGuide.prototype.show_message = function (item, left) {
    /* TODO make this a jquery template */
    var h = '<a href="#" class="tlypageguide_close" title="Close Guide">close</a><span>' +
        $(item).children("ins").html() +
        '</span><div>' +
        $(item).children("div").html() +
        '</div>';
    h += '<a href="#" class="tlypageguide_back" title="Next">Previous</a>';
    h += '<a href="#" class="tlypageguide_fwd" title="Next">Next</a>';
    this.$message.html(h);

    this.$items.removeClass("tlypageguide-active");

    $(item).addClass("tlypageguide-active");

    if (!tl.pg.isScrolledIntoView($(item))) {
        $('html,body').animate({scrollTop: $(item).offset().top - 50}, 500);
    }

    if (this.$message.is(":visible")) {
        this.roll_number($("#tlyPageGuideMessages span"), left);
    }
    else {
        this.$message.show().animate({ height: "100px" }, 500);
    }
};

tl.pg.PageGuide.prototype.roll_number = function (num_wrapper, left) {
    if (left) {
        num_wrapper.animate({ 'text-indent': "50px" }, 200, function() {
            $(this).css({ 'text-indent': "-50px" });
            $(this).animate({ 'text-indent': "0" }, 200);
        });
    }
    else {
        num_wrapper.animate({ 'text-indent': "-50px" }, 200, function() {
            $(this).css({ 'text-indent': "50px" });
            $(this).animate({ 'text-indent': "0" }, 200);
        });
    }
};

tl.pg.PageGuide.prototype.position_tour = function () {
    /* set PG element positions for visible tourtargets */
    this.$items = this.$all_items.filter(function () { return $($(this).data('tourtarget')).is(':visible'); });
    this.$items.each(function(i) {
        var tour_target = $(this).data('tourtarget');
        var $p = $(tour_target + ":visible:first");
        if ($p.length) {
            var arrow = $(this);
            var position = $p.offset();

            var setLeft = position.left + 5;
            var setTop = position.top + 5;

            if (arrow.hasClass("tlypageguide_bottom")) { setTop = position.top + $p.outerHeight() + 15; }
            if (arrow.hasClass("tlypageguide_left")) { setLeft = position.left - 65; }
            if (arrow.hasClass("tlypageguide_top")) { setTop = position.top - 60; }
            if (arrow.hasClass("tlypageguide_right")) { setLeft = position.left + $p.outerWidth(false) + 15; }

            arrow.css({ "left": setLeft + "px", "top": setTop + "px" });
        }
    });
};

tl.pg.Listener = function(pgElt, loadingElt) {
    this.pgElt = pgElt;
    this.loadingElt = loadingElt;
    this.interval = 250;
    console.log('init pgl');
};

tl.pg.Listener.prototype.start = function() {};

tl.pg.Listener.prototype.scheduleCallback = function() {
    var that = this;
    var cb = function() {
        that.callback();
    };
    window.setTimeout(cb, this.interval);
};

tl.pg.Listener.prototype.callback = function() {
    if (!this.loadingElt.is(':visible')) {
        this.pgElt.children(".tlypageguide_toggle").animate({ "right": "-120px" }, 250);
    }
    else {
        this.scheduleCallback();
    }
};
