jQuery(document).ready(function ($) {


    // https://stackoverflow.com/questions/3640187/how-can-i-modify-pasted-text
    // https://stackoverflow.com/questions/43438665/how-to-modify-pasted-data-jquery
    // https://stackoverflow.com/questions/25941559/is-there-a-way-to-keep-execcommandinserthtml-from-removing-attributes-in-chr
    // https://stackoverflow.com/questions/3997659/replace-selected-text-in-contenteditable-div


    var restrictFancyText = function(text, options) {
        var result = text;
        if (options.includes('uppercase')) {
            result = result.toUpperCase();
        }
        if (!options.includes('boldable')) {
            result = result.replace(/\*/g, '');
        }
        if (!options.includes('italicizable')) {
            result = result.replace(/_/g, '');
        }
        if (!options.includes('underlinable')) {
            result = result.replace(/\^/g, '');
        }
        if (!options.includes('indentable')) {
            result = result.replace(/[{}|]\s?/g, '');
        }
        if (!options.includes('multiline')) {
            result = result.replace(/[\r\n]/g, '');
        }
        return result;
    }

    insertFancyTextIntoContent = function(text, content) {
        content.empty();
        text = restrictFancyText(text, content.attr('class').split(' '));
        let nodes = nodifyFancyText(text);
        nodes.forEach(node => $(node).prependTo(content));
    }


    // Pass nodes constructed from the text fancifier into here.
    var pasteNodesIntoSelection = function(nodes) {
        var sel, range;
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            nodes.forEach(function(node) {
                range.insertNode(node);
            });
        }

        // Move the caret immediately after the inserted span.
        range.setStartAfter(nodes[0]);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }


    cardRefresher.register(function(card) {
        card.find('[contenteditable]').bind('paste', function(e) {
            e.preventDefault();
            
            var target = $(e.target);
            if (!target.attr('contenteditable')) {
                target = target.closest('[contenteditable');
            }

            var data = e.originalEvent.clipboardData;
            var text = fancifyHTML(data.getData('text/html')) || data.getData('text/plain');
            text = restrictFancyText(text, target.attr('class').split(' '));
            var nodes = nodifyFancyText(text);
            pasteNodesIntoSelection(nodes);
        });
    });

 
});
