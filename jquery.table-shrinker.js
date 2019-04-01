(function ($, window, document, undefined) {
    "use strict";
    var pluginName = "tableShrinker",
        defaults = {
            useZebra: true,
            useObserver: true, //not supported by old browsers
            useTransitions: true,
            transitionSpeed: 300,
            ignoreWhenHit: 'button, a, .btn',
            showToggler: true,
            customToggler: ['<span>+</span>','<span>-</span>']
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            // local variables
            var _showToggler = this.settings.showToggler;
            let _toggler = this.settings.customToggler;

            let _suffixes = ''

            // local elements
            let $t = $('table.shrink');
            let $ths = $t.find('thead th');
            let $trs = $t.find('tbody tr');

            // Init values
            this._transitionSpeed = this.settings.useTransitions == true ? this.settings.transitionSpeed : 0;
            this._currentSize = Math.max(document.documentElement.clientWidth, $(window).width() || 0);

            $trs.each(function (rId){
                let r = $(this).after('<tr class="blank-row"></tr>').after('<tr class="shrink-wrapper"><td colspan="99"></td></tr>')
                $ths.each(function (hId) {
                    if($(this)[0].className.match('shrinkable')) r.find('td').eq(hId).addClass('shrinkable')
                    var re = new RegExp('(?:shrink-)(..)[ ]?');
                    let result = $(this)[0].className.match(re);
                    if (result) {
                        if(rId == 0) {_suffixes = _suffixes + ' ' + result[1]}

                        r.next('.shrink-wrapper').find('td').append('<div class="shrink-row" style="display:none"><div class="unshrink-' + result[1] + '"><div>' + $(this).html() + '</div><div>' + r.find('td').eq(hId).html() + '</div></div></div>')
                        r.find('td').eq($(this).index()).addClass('shrink-'+ result[1])
                    }
                })
                if(_showToggler){
                    $(this).append('<td class="shrink-toggler">'+ _toggler[0] +'</td>')
                }
            })
            if(_showToggler) _suffixes.trim().split(" ").forEach(function (val){ $('td.shrink-toggler').addClass('unshrink-' + val)})

            // Bind events
            $t.not('tr:not(:has(th)):not(.shrink-wrapper)').on("click", this.toogleShrinkContent.bind(this));

            if (this.settings.useObserver) {
                this.createObserverEvent();
            }
        },
        toogleShrinkContent: function (e){
            if ($(e.target).is(this.settings.ignoreWhenHit)){
                e.stopPropagation();
                return
            }
            if (window.getSelection().type != "Range"){
                let clickedWrapper = $(e.target).closest('tr').next('.shrink-wrapper');
                let isWrapperVisible = clickedWrapper.find('td>div.shrink-row > div:visible').length > 0 ? 0 : 1
                if(this.settings.showToggler) this.updateToggler(clickedWrapper, isWrapperVisible);
                if(this.settings.useObserver){
                    let _updateZebra = this.updateZebra;
                    if(isWrapperVisible) clickedWrapper.find('td>div.shrink-row > div').on('visibility', function(e) {_updateZebra(clickedWrapper)});
                    else clickedWrapper.find('td>div.shrink-row > div').off('visibility');
                }else if(this.settings.useZebra) this.updateZebra(clickedWrapper);
                clickedWrapper.find('td>div.shrink-row').slideToggle(this._transitionSpeed);
            };
        },
        updateToggler : function(wrapper, wrapperVisiblity){
            wrapper.prev('tr').find('.shrink-toggler').html(this.settings.customToggler[wrapperVisiblity]);
        },
        updateZebra: function (wrapper){
            wrapper.find('td>div.shrink-row > div:visible').parent().each(function (i) {
                $(this).removeClass('even odd');
                $(this).addClass(i % 2 == 0 ? 'even': 'odd');
            });
        },
        createObserverEvent :function(){
            if (window.IntersectionObserver) {
                $.event.special.visibility = {
                    setup: function() {
                        function event(visibility) {
                            var e = $.Event("visibility");
                            e.visible = visibility;
                            return e;
                        }
                        var element = this;
                        var $element = $(this);
                        var observer = new IntersectionObserver(function(entries) {
                            var e = event($element.is(':visible'));
                            ($.event.dispatch || $.event.handle).call(element, e);
                        }, {
                            root: document.body
                        });
                        observer.observe(this);
                        $.data(this, 'observer', observer);
                    },
                    teardown: function() {
                        var observer = $.data(this, 'observer');
                        if (observer) {
                            observer.unobserve(this);
                            $.removeData(this, 'observer');
                        }
                    }
                };
            };
        }
    });
    // A lightweight plugin wrapper around the constructor, preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin-" + pluginName)) {
                $.data(this, "plugin-" + pluginName, new Plugin(this, options));
            }
        });
    };
})(jQuery, window, document);
