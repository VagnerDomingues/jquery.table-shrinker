var resizeEvent;

function updateCollapsed() {
    $("tr.shrink-row + tr.shrink-wrapper:visible").each(function (id, e) {
        if ($(e).height()) { $(e).prev("tr").addClass("collapsed"); }
        else { $(e).prev("tr").removeClass("collapsed"); }
    });
};

function updateZebra() {
    setTimeout(function () {
        $(".shrink.shrink-use-zebra tr.shrink-row + tr.shrink-wrapper:visible").each(function () {
            $(this).find("> td > div.shrinked-row:not(:has(table)) div:visible").each(function (i) {
                $(this).parent().removeClass("even odd");
                $(this).parent().addClass(i % 2 === 0 ? "even" : "odd");
            });
        });
    }, 300);
};

jQuery.fn.chained = [].reverse;
(function ($, window, document) {
    "use strict";
    var pluginName = "tableShrinker",
        defaults = {
            useZebra: true,
            useTransitions: true,
            transitionSpeed: 300,
            ignoreWhenHit: "input, button, a, .btn",
            customToggle: ["<span>˅</span>", "<span>˄</span>"],
            customToggleAll: ["<span>˅</span>", "<span>˄</span>"],
            showToggle: true,
            showToggleAll: false,
            iconsOnLeft: false,
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
        init() {
            // local variables
            let _this = this;
            let _toggle = _this.settings.customToggle;
            let _toggleAll = _this.settings.customToggleAll;
            let _useZebra = _this.settings.useZebra === true ? true : $(_this.element).hasClass("shrink-use-zebra");
            let _showToggle = _this.settings.showToggle === true ? true : $(_this.element).hasClass("shrink-show-toggle");
            let _showToggleAll = _this.settings.showToggleAll === true ? true : $(_this.element).hasClass("shrink-show-toggle-all");
            let _iconsOnLeft = _this.settings.iconsOnLeft === true ? true : $(_this.element).hasClass("shrink-icons-on-left");
            let _loadCollapsed = _this.settings.loadCollapsed === true ? true : $(_this.element).hasClass("shrink-load-collapsed");
            let _suffixes = "";
            let _headerRow = null;
            let _atLeastOneToShrink = null;

            // instance properties
            _this.$t = $(_this.element);
            _this.$ths = _this.$t.children("thead").first().find("> tr > th");
            _this.$trs = _this.$t.children("tbody").first().find("> tr");
            _this.transitionSpeed = _this.settings.useTransitions === true ? _this.settings.transitionSpeed : 0;

            if (_useZebra) { _this.$t.addClass("shrink-use-zebra"); }
            if (_iconsOnLeft) { _this.$t.addClass("shrink-icons-on-left"); }

            // start shrinkable restructure
            _this.$trs.each(function (rId) {
                let r = $(this).addClass("shrink-row").after("<tr class=\"blank-row\"></tr>").after("<tr class=\"shrink-wrapper\"><td colspan=\"99\"></td></tr>");
                _this.$ths.each(function (hId) {
                    if (r.children("td").attr("colspan") != null) { return; }//ignore if has colspan
                    if ($(this)[0].className.match("shrinkable")) { r.find("td").eq(hId).addClass("shrinkable"); }
                    let re = new RegExp("(?:shrink-)([a-z]*)[^ ]?");
                    let result;
                    if (r.parents("table").first().find("th").eq(hId)[0]) {
                        result = r.parents("table").first().find("th").eq(hId)[0].className.match(re);
                    }
                    if (result) {
                        _atLeastOneToShrink = true;

                        //setup shrink/unshrinked elements
                        if (r.find("td").eq(hId).parents("table").first() != null) {

                            _suffixes = _suffixes + " " + result[1];

                            if (r.parents("table").first().find("th").eq(hId).html().trim() === "") {
                                r.next(".shrink-wrapper").find("td").append("<div class=\"shrinked-row\" style=\"display:none\"><div class=\"unshrink-" + result[1] + "\"><div style=\"width:100%\">" + r.find("td").eq(hId).html() + "</div></div></div>");
                            } else {
                                r.next(".shrink-wrapper").find("td").append("<div class=\"shrinked-row\" style=\"display:none\"><div class=\"unshrink-" + result[1] + "\"><div>" + r.parents("table").first().find("th").eq(hId).html() + "</div><div>" + r.find("td").eq(hId).html() + "</div></div></div>");
                            };
                            r.children("td").eq(hId).addClass("shrink-" + result[1]);
                        };
                    };

                    //setup toggle buttons
                    if (_atLeastOneToShrink) {
                        if (hId === r.children("td").last().index() && r.children("td:not(:has(table))").length > 0) {

                            //setup toggle

                            if (_iconsOnLeft) {
                                if (_showToggle) { r.prepend("<td class=\"shrink-toggle shrink-toggle-left\">" + _toggle[0] + "</td>"); }
                                else { r.prepend("<td class=\"shrink-toggle\"></td>"); }
                            }
                            else {
                                if (_showToggle) { r.append("<td class=\"shrink-toggle\">" + _toggle[0] + "</td>"); }
                                else { r.append("<td class=\"shrink-toggle\"></td>"); }
                            }

                            _suffixes.trim().split(" ").forEach(function (val) { r.find("td.shrink-toggle").addClass("unshrink-" + val); });

                            //setup toggleAll
                            if (rId === 0 && !_iconsOnLeft || rId === _this.$trs.length - 1 && _iconsOnLeft) {
                                _headerRow = r.parents("table").first().children("thead").children("tr");

                                if (_iconsOnLeft) {
                                    if (_showToggleAll) { _headerRow.prepend("<th class=\"shrink-toggle-all shrink-toggle-left\">" + _toggleAll[0] + "</th>"); }
                                    else { _headerRow.prepend("<th class=\"shrink-toggle-all hidden\"></th>"); }
                                }
                                else {
                                    if (_showToggleAll) { _headerRow.append("<th class=\"shrink-toggle-all\">" + _toggleAll[0] + "</th>"); }
                                    else { _headerRow.append("<th class=\"shrink-toggle-all hidden\"></th>"); }
                                }

                                _suffixes.trim().split(" ").forEach(function (val) { _headerRow.find("th.shrink-toggle-all").addClass("unshrink-" + val); });
                            };
                        };

                    }
                });
            });
            $(".shrinked-row:has(table)").addClass("shrink-has-table");

            // Bind events
            _this.$t.children("thead").first().children("tr").on("click", _this.toggleAll.bind(_this)); // toggle-all for main table

            _this.$t.find(".shrinked-row.shrink-has-table table>thead>tr").on("click", _this.toggleAll.bind(_this)); // toggle-all for shrinked tables

            if (_this.$t.parents("table").length === 0) { _this.$t.children("tbody").first().children("tr").on("click", _this.toggle.bind(_this)); }

            if (_loadCollapsed) { _this.$t.find(">thead>tr").click(); }
        },
        toggle(e) {
            if ($(e.target).is(this.settings.ignoreWhenHit)) {
                return;
            }
            if (window.getSelection().type !== "Range" && !$(e.target).parents("table").first().find(".shrinked-row").is(":animated")) {
                let nextWrapper = $(e.target).closest("tr").next(".shrink-wrapper");

                setTimeout(this.updateToggle(nextWrapper, nextWrapper.find("td>div.shrinked-row > div:visible").length > 0 ? 0 : 1), this.transitionSpeed);

                nextWrapper.find(">td>div.shrinked-row").slideToggle(this.transitionSpeed);

                if ($(e.target).parents("table").first().hasClass("shrink-use-zebra")) { updateZebra(); }

                setTimeout(function () { updateCollapsed(); }, this.transitionSpeed);
            }
        },
        toggleAll(e) {
            if ($(e.target).is(this.settings.ignoreWhenHit)) {
                return;
            }
            if (window.getSelection().type !== "Range" && !$(e.target).parents("table").first().find(".shrinked-row").is(":animated")) {
                let currentTable = $(e.target).parents("table").first();

                currentTable.toggleClass("shrink-collapsed");

                let isAlreadyCollapsed = currentTable.hasClass("shrink-collapsed") ? 1 : 0;

                setTimeout(this.updateToggleAll(currentTable, isAlreadyCollapsed), this.transitionSpeed);

                if (isAlreadyCollapsed) { currentTable.find(">tbody>tr.shrink-wrapper>td>div.shrinked-row:hidden").slideDown(this.transitionSpeed, function () { }); }
                else { currentTable.find(">tbody>tr.shrink-wrapper>td>div.shrinked-row:visible").slideUp(this.transitionSpeed, function () { }); }

                if ($(e.target).parents("table").first().hasClass("shrink-use-zebra")) { updateZebra(); }

                setTimeout(function () { updateCollapsed(); }, this.transitionSpeed);
            }
        },
        updateToggle(wrapper, toggleState) {
            let _showToggle = this.settings.showToggle === true ? true : $(this.element).hasClass("shrink-show-toggle");
            if (_showToggle) { wrapper.prev("tr").children(".shrink-toggle").first().html(this.settings.customToggle[toggleState]); }
        },
        updateToggleAll(table, toggleState) {
            let _showToggleAll = this.settings.showToggleAll === true ? true : table.hasClass("shrink-show-toggle-all");
            let _showToggle = this.settings.showToggle === true ? true : table.hasClass("shrink-show-toggle");

            if (_showToggleAll) { table.find(">thead>tr>th.shrink-toggle-all").first().html(this.settings.customToggleAll[toggleState]); }
            if (_showToggle) { table.find(">tbody>tr>td.shrink-toggle:not(.hidden)").html(this.settings.customToggle[toggleState]); }
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

}(jQuery, window, document));

$(window).on("resize", function () {
    updateZebra();
    updateCollapsed();
});