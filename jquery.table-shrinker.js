jQuery.fn.chained = [].reverse;
(function ($, window, document, undefined) {
    "use strict";
    var pluginName = "tableShrinker",
        defaults = {
            useZebra: true,
            useObserver: true, //not supported by old browsers
            useTransitions: true,
            transitionSpeed: 300,
            ignoreWhenHit: 'button, a, .btn',
            customToggle: ['<span>˅</span>','<span>˄</span>'],
            customToggleAll: ['<span>˅</span>','<span>˄</span>'],
            showToggle: true,
            showToggleAll: true,
            loadCollapsed: null
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
            let _this = this;
            let _showToggle = _this.settings.showToggle;
            let _showToggleAll = _this.settings.showToggleAll;
            let _toggle = _this.settings.customToggle;
            let _toggleAll = _this.settings.customToggleAll;
            let _loadCollapsed = _this.settings.loadCollapsed == true ? true : $(_this.element).hasClass('load-collapsed')
            let _suffixes = '';
            let _headerRow = null;

            // instance variables
            _this.$t = $(_this.element);

            // Init values
            _this._transitionSpeed = _this.settings.useTransitions == true ? _this.settings.transitionSpeed : 0;
            _this._currentSize = Math.max(document.documentElement.clientWidth, $(window).width() || 0);

            _this.$ths = _this.$t.children('thead').first().find('> tr > th');
            _this.$trs = _this.$t.children('tbody').first().find('> tr');

            _this.$trs.each(function (rId){
                let r = $(this).after('<tr class="blank-row"></tr>').after('<tr class="shrink-wrapper"><td colspan="99"></td></tr>');
                _this.$ths.each(function (hId) {
                    if(r.children('td').attr('colspan') != null) return//ignore if has colspan
                    if($(this)[0].className.match('shrinkable')) r.find('td').eq(hId).addClass('shrinkable')
                    var re = new RegExp('(?:shrink-)([a-z]*)[^ ]?');
                    let result;
                    if(r.parents('table').first().find('th').eq(hId)[0]){
                        result = r.parents('table').first().find('th').eq(hId)[0].className.match(re);
                    }
                    if (result){
                        //setup shrink/unshrinked elements

                        if(r.find('td').eq(hId).parents('table').first() != null){

                            _suffixes = _suffixes + ' ' + result[1];
                            r.next('.shrink-wrapper').find('td').append('<div class="shrink-row" style="display:none"><div class="unshrink-' + result[1] + '"><div>' + r.parents('table').first().find('th').eq(hId).html() + '</div><div>' + r.find('td').eq(hId).html() + '</div></div></div>')
                            r.children('td').eq(hId).addClass('shrink-'+ result[1])


                        }
                        //setup toggle buttons
                        if(hId == r.children('td').last().index() && r.children('td:not(:has(table))').length > 0){
                            r.append('<td class="shrink-toggle">'+ _toggle[0] +'</td>')
                            _headerRow = r.parents('table').first().children('thead').children('tr');
                            _suffixes.trim().split(" ").forEach(function (val){r.find('td.shrink-toggle').addClass('unshrink-' + val)})
                            if(rId == 0 ){
                                if(_showToggleAll){
                                    _headerRow.append('<th class="shrink-toggle-all">' + _toggleAll[0] + '</th>');
                                    _suffixes.trim().split(" ").forEach(function (val){_headerRow.find('th.shrink-toggle-all').addClass('unshrink-' + val)})
                                }
                                else if(!_showToggleAll && _showToggle){
                                    _headerRow.append('<th> </th>');
                                    _suffixes.trim().split(" ").forEach(function (val){_headerRow.find('th.shrink-toggle-all').addClass('unshrink-' + val)})
                                }
                            }
                        }
                    }
                })
            })
            $('.shrink-row:has(table)').addClass('has-table');

            // Bind events
            _this.$t.children('thead').first().children('tr').on("click", _this.toggleAll.bind(_this)); // toggle-all for main table

            _this.$t.find('.shrink-row.has-table table>thead>tr').on("click", _this.toggleAll.bind(_this)); // toggle-all for shrinked tables

            if(_this.$t.parents('table').length == 0) _this.$t.children('tbody').first().children('tr').on("click", _this.toggle.bind(_this));

            if (_this.settings.useObserver) _this.createObserverEvent();

            if (_loadCollapsed) _this.$t.find('>thead>tr').click();
        },
        toggleAll: function (e){
            if ($(e.target).is(this.settings.ignoreWhenHit)){
                return
            }
            if (window.getSelection().type != "Range"){

                $(e.target).parents('table').first().toggleClass('has-collapsed')

                let currentTable = $(e.target).parents('table').first();
                let nextWrapperList = currentTable.children('tbody').find('>tr.shrink-wrapper');
                let isWrapperListVisible = currentTable.hasClass('has-collapsed') ? 1 : 0;

                this.updateToggleAll(currentTable, isWrapperListVisible);


                if(this.settings.useObserver){
                    let _updateZebra = this.updateZebra;
                    if(isWrapperListVisible) nextWrapperList.find('td>div.shrink-row > div').on('visibility', function(e) {_updateZebra(nextWrapperList)});
                    else nextWrapperList.find('td>div.shrink-row > div').off('visibility');
                }else if(this.settings.useZebra) this.updateZebra(nextWrapperList);

                if(isWrapperListVisible){
                    nextWrapperList.find('>td>div.shrink-row:hidden').slideDown(this._transitionSpeed);
                }else{
                    nextWrapperList.find('>td>div.shrink-row:visible').slideUp(this._transitionSpeed);
                }
            }
        },
        updateToggleAll : function(wrapper, wrapperListVisiblity){
            wrapper.find('>thead>tr>th.shrink-toggle-all, >tbody>tr>td.shrink-toggle').html(this.settings.customToggleAll[wrapperListVisiblity]);
        },
        toggle: function (e){
            if ($(e.target).is(this.settings.ignoreWhenHit)){
                return
            }
            if (window.getSelection().type != "Range"){
                let nextWrapper = $(e.target).closest('tr').next('.shrink-wrapper');
                let isWrapperVisible = nextWrapper.find('td>div.shrink-row > div:visible').length > 0 ? 0 : 1;
                if(this.settings.showToggle) this.updateToggle(nextWrapper, isWrapperVisible);
                if(this.settings.useObserver){
                    let _updateZebra = this.updateZebra;
                    if(isWrapperVisible) nextWrapper.find('td>div.shrink-row > div').on('visibility', function(e) {_updateZebra(nextWrapper)});
                    else nextWrapper.find('td>div.shrink-row > div').off('visibility');
                }else if(this.settings.useZebra) this.updateZebra(nextWrapper);
                nextWrapper.find('>td>div.shrink-row').slideToggle(this._transitionSpeed);
            };
        },
        updateToggle : function(wrapper, wrapperVisiblity){
            wrapper.prev('tr').children('.shrink-toggle').first().html(this.settings.customToggle[wrapperVisiblity]);
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