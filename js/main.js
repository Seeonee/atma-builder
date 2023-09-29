jQuery(document).ready(function ($) {

    // Article about copying browser contents as image:
    // https://stackoverflow.com/questions/10721884/render-html-to-an-image/10722025


    // https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
    String.prototype.format = String.prototype.format || function () {
        var str = this.toString();
        if (arguments.length) {
            var t = typeof arguments[0];
            var key;
            var args = ("string" === t || "number" === t) ?
                Array.prototype.slice.call(arguments)
                : arguments[0];

            for (key in args) {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }

        return str;
    };
    

    // List of methods to call again when a card is reconstructed.
    class CardRefresher {
        constructor() {
            this.methods = [];
        }

        register(f) {
            this.methods.push(f);
        }

        refresh(card) {
            this.methods.forEach((f) => { f(card); });
        }
    }
    
    cardRefresher = new CardRefresher();


    // Custom styling we support.
    var STYLES = {
        'b': 'boldable',
        'i': 'italicizable',
        'u': 'underlinable'
    }

    // Helper methods for ctrl+shift+R (refresh).
    var walkNodes = function(root, mutator) {
        mutator(root);
        for (var i = 0; i < root.childNodes.length; i++) {
            walkNodes(root.childNodes[i], mutator);
        }
    }

    
    // Reworks a text field after editing stops.
    // Mainly cleans up a bunch of dumb inconsistencies.
    var refreshTextField = function(container, fireEvents=true) {
        container[0].normalize();
        var text = container.html();
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/--+|—/g, '–');
        text = text.replace(/<br>\s*<br>/g, '<br><div class="br" />');
        text = $.trim(text);
        // Remove empty tags and trailing newlines.
        text = text.replace(/<[biu]*>\s*<\/[biu][^>]*>/g, '');
        text = text.replace(/(\n|\r|<br>|<div class="br"><\/div>)+$/, '');
        // There are a bunch of edge cases involving trailing newlines near format closures; fix later.
        // text = text.replace(/(\n|\r|<br>|<div class="br"><\/div>|<div class="br" \/>)*(<\/[biu]>*)(\n|\r|<br>|<div class="br"><\/div>|<div class="br" \/>)+$/, '$2');
        // Remove line breaks inside of blockquotes.
        text = text.replace(/(<br>)+<\/blockquote>/g, '</blockquote>');

        container.html(text);

        // Apply legit uppercase to the contents of uppercase text fields.
        // if (container.hasClass('uppercase')) {
        //     text = text.toUpperCase();
        // }
        if (container.hasClass('uppercase')) {
            walkNodes(container[0], function(node) {
                if (node.nodeType == 3) { // Text node.
                    node.textContent = node.textContent.toUpperCase();
                }
            });
        }
        // Ensure we don't leave a text field empty.
        var anyText = false;
        walkNodes(container[0], function(node) {
            if (node.nodeType == 3 && $.trim(node.textContent).length > 0) {
                anyText = true;
            }
        });
        if (!anyText) {
            let value = container.data('empty-value');
            container.html(value || '?');
        }

        if (fireEvents) {
            container.trigger('updated');
        }
    }


    cardRefresher.register(function(card) {
        // For single line text fields, enter clears focus instead of adding newline.
        // For multiline, ctrl+enter (carriage return) clears it.
        card.find('[contenteditable]').on('keypress', function(e) {
            var target = $(e.target);
            if (e.which == 13 || e.which == 10) { // Newline or carriage return.
                if (!target.hasClass('multiline') || e.ctrlKey) {
                    target.blur();
                    return false;
                }
            }
            return true;
        });

        // Toggle on/off a class for text fields being edited.
        card.find('[contenteditable]').focus(function (e) {
            $(e.target).addClass('editing');
            $(e.target).parent().addClass('editing');
        });
        card.find('[contenteditable]').focusout(function (e) {
            $(e.target).removeClass('editing');
            $(e.target).parent().removeClass('editing');
            refreshTextField($(e.target));
        });

        // Allow bolding, italicization, and underlining as appropriate.
        card.find('[contenteditable]').on('keydown', function(e) {
            var target = $(e.target);
            var c = String.fromCharCode(e.which).toLowerCase();
            if (e.ctrlKey && c in STYLES) {
                if (target.hasClass(STYLES[c])) {
                    return true;
                }
                return false;
            } else {
                return true;
            }
        });

        // Ctrl+shift+R normalizes text elements and fixes non-breaking spaces.
        card.find('[contenteditable]').on('keydown', function(e) {
            var c = String.fromCharCode(e.which).toLowerCase();
            if (c == 'r' && e.ctrlKey && e.shiftKey) {
                refreshTextField($(e.target));
                return false;
            }
            return true;
        });

        card.find('.content').each(function() {
            refreshTextField($(this), false);
        });

        // Disable spellchecking unless it's explicitly on.
        if (!(window.localStorage.getItem('spellcheck'))) {
            card.find('[contenteditable]').attr('spellcheck', 'false');
        }

        // Update card art when changed.
        card.find('.art-url [contenteditable]').focusout(function (e) {
            card.find('.art img').attr('src', $(e.target).text());
        });
    });


    $('body').on('keydown', (e) => {
        var c = String.fromCharCode(e.which).toLowerCase();
        if (c == 's' && e.ctrlKey && e.shiftKey) {
            contentManager._save();
            return false;
        }
    });


});


