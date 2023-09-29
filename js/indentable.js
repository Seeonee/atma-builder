jQuery(document).ready(function ($) {

    // https://prograils.com/posts/ceasta-create-custom-text-area-using-contenteditable-element

    // Walk a container.
    // Return the outermost blockquote tag containing a nested node.
    // Return undefined if none is found.
    var findContainingBlockquote = function(container, node) {
        if (node == undefined) {
            node = window.getSelection().getRangeAt(0).startContainer;
            if (node.nodeName == 'BLOCKQUOTE') {
                return $(node);
            }
        }
        var children = container.childNodes;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (node === child) {
                return undefined;
            } else if (child.contains(node)) {
                if (child.nodeName == 'BLOCKQUOTE') {
                    return $(child);
                } else {
                    return findContainingBlockquote(child, node);
                }
            }
        }
        return undefined;
    }

    var INDENT_CHARS = ['{', '}', '|'];
    var INDENT_CLASSES = {
        '{': 'gm-cost-1',
        '{{': 'gm-cost-2',
        '}': 'gm-cost-free',
        '|': 'bullet'
    }

    cardRefresher.register(function(card) {
        // Shift + tab will clear any indent.
        card.find('.content.indentable').on('keydown', function(e) {
            if (e.which == 9) { // Tab.
                if (e.shiftKey) {
                    document.execCommand('outdent', true, null);
                }
                return false;
            }
        });
        // The special character keys apply indents, 
        // then flavor them with custom symbol prefixes.
        // Repeated presses will cycle and ultimately clear the symbol/indent.
        card.find('.content.indentable').on('keypress', function(e) {
            var c = String.fromCharCode(e.which).toLowerCase();
            if ($.inArray(c, INDENT_CHARS) >= 0) {
                var blockquote = findContainingBlockquote(e.target);
                if (blockquote == undefined) {
                    document.execCommand('indent', true, null);
                    blockquote = findContainingBlockquote(e.target);
                    blockquote.removeAttr('style');
                    blockquote.addClass(INDENT_CLASSES[c]);
                } else {
                    var current = blockquote.attr('class');
                    // Handle "incrementing" of GM costs.
                    if (c == '{' && (current == INDENT_CLASSES['{'] || 
                                     current == INDENT_CLASSES['{{'])) {
                        c = '{{';
                    }
                    var desired = INDENT_CLASSES[c];
                    if (current != desired) {
                        blockquote.removeClass(current);
                        blockquote.addClass(desired);
                    } else {
                        document.execCommand('outdent', true, null);
                    }
                }
                return false;
            // } else if (c == '[') {
            //     let sel = window.getSelection();
            //     let range = sel.getRangeAt(0);
            //     let span = $('<span class="gm-symbol">{</span>')[0];
            //     range.collapse(true);
            //     range.insertNode(span);

            //     // Move the caret immediately after the inserted span
            //     range.setStartAfter(span);
            //     range.collapse(true);
            //     sel.removeAllRanges();
            //     sel.addRange(range);

            //     return false;
            }
            return true;
        });

        // Two consecutive enters inserts a "double" newline.
        card.find('.content.multiline').on('keypress', function(e) {
            var target = $(e.target);
            if (e.which == 13) {
                let r = window.getSelection().getRangeAt(0);
                let n = r.startContainer;
                let p;
                if (n.nodeName == 'SPAN') { // Outer text field. We're between <br>s, then.
                    p = n.childNodes[r.startOffset - 1];
                } else if (n.nodeType == 3 && r.startOffset == 0) { // We're in a text node.
                    p = n.previousSibling;
                }
                let inTextNode = n.nodeType == 3;
                let inTextWithinBlockquote = inTextNode && n.parentNode && n.parentNode.nodeName == 'BLOCKQUOTE';
                let atEndOfRow = true; // for now...
                if (inTextNode && inTextWithinBlockquote && atEndOfRow) {
                    // We have to manually roll into a new blockquote element.
                    document.execCommand("insertHtml", true, `</blockquote><blockquote class="${n.parentNode.className}">`);
                    return false;
                }
                let inBlockquote = n.nodeName == 'BLOCKQUOTE';
                let inEmptyBlockquote = n.childNodes.length == 0;
                let inBlockquoteContainingOnlyBr = n.childNodes.length == 1 && n.childNodes[0].nodeName == 'BR';
                if (inBlockquote && (inEmptyBlockquote || inBlockquoteContainingOnlyBr)) {
                    // We're in an empty blockquote. Remove it.
                    document.execCommand('outdent', true, null);
                    document.execCommand("insertHtml", true, '<div class="br" />');
                    return false;
                }
                if (p && (p.nodeName == 'BR' || p.nodeName == 'BLOCKQUOTE')) {
                    document.execCommand("insertHtml", true, '<div class="br" />');
                    return false;
                } else {
                    return true;
                }
            }
            return true;
        });
    });

 
});
