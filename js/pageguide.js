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
        var guide   = $("#tlyPageGuide"),
            wrapper = $('<div>', { id: 'tlyPageGuideWrapper' });

        $('<div/>', {
            'title': 'Launch Page Guide',
            'class': 'tlypageguide_toggle',
        }).append('page guide')
          .append('<div><span>' + guide.data('tourtitle') + '</span></div>')
          .append('<a>', {
            'href' : 'javascript:void(0);',
            'title' : 'close guide'
            'html' : 'close guide &raquo;'
          }).appendTo(wrapper);

        wrapper.append(guide);
        wrapper.append($('<div>', { 'id' : 'tlyPageGuideMessages' }))
        $('body').append(wrapper);

        var pg = new tl.pg.PageGuide($('#tlyPageGuideWrapper'));
        pg.ready(function() {
            pg.$base.children(".tlypageguide_toggle").animate({ "right": "-120px" }, 250);
        });
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
    var dvtop = $(window).scrollTop(),
        dvbtm = dvtop + $(window).height(),
        eltop = $(elem).offset().top,
        elbtm = eltop + $(elem).height();

    return (elbtm >= dvtop) && (eltop <= dvbtm - 100);
};

tl.pg.PageGuide.prototype.ready = function(callback) {
    var that = this,
        interval = window.setInterval(function() {
            if (!$('#loading').is(':visible')) {
                callback();
                clearInterval(interval);
            }
        }, 250);
    return this;
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
        /*
         * If -n < x < 0, then the result of x % n will be x, which is
         * negative. To get a positive remainder, compute (x + n) % n.
         */
        that.cur_idx = (that.cur_idx + that.$items.length - 1) % that.$items.length;
        that.show_message(that.$items[that.cur_idx], true);
        return false;
    });

    /* register resize callback */
    $(window).resize(function() { that.position_tour(); });
};

tl.pg.PageGuide.prototype.show_message = function (item, left) {
    this.$message.empty()
      .append('<a href="#" class="tlypageguide_close" title="Close Guide">close</a>')
      .append('<span>' + $(item).children('ins').html() + '</span>')
      .append('<div>' + $(item).children('div').html() + '</div>')
      .append('<a href="#" class="tlypageguide_back" title="Next">Previous</a>')
      .append('<a href="#" class="tlypageguide_fwd" title="Next">Next</a>');

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
    this.$items = this.$all_items.filter(function () {
        return $($(this).data('tourtarget')).is(':visible');
    });

    this.$items.each(function() {
        var $p = $($(this).data('tourtarget')).filter(':visible:first')
        if ($p.length) {
            var arrow = $(this),
                setLeft = $p.offset().left,
                setTop  = $p.offset().top;

            if (arrow.hasClass("tlypageguide_top")) {
                setTop -= 60;
            } else if (arrow.hasClass("tlypageguide_bottom")) {
                setTop += $p.outerHeight() + 15;
            } else {
                setTop += 5;
            }

            if (arrow.hasClass("tlypageguide_right")) {
                setLeft += $p.outerWidth(false) + 15;
            } else if (arrow.hasClass("tlypageguide_left")) {
                setLeft -= 65;
            } else {
                setLeft += 5;
            }

            arrow.css({ "left": setLeft + "px", "top": setTop + "px" });
        }
    });
};
