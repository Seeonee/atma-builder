jQuery(document).ready(function ($) {


    var REVERSE_MODIFIERS = {
        'bold': '*',
        'italic': '_',
        'underline': '^'
    };
    var REVERSE_INDENTS = {
        'gm-cost-free': '}',
        'gm-cost-1': '{',
        'gm-cost-2': '{{', 
        'bullet': '|'
    };

    var fixB = s => s.replace(/(\*)([_^\s]*)([\s\S]*?)([_^\s]*)\1/g, '$2$1$3$1$4');
    var fixI = s => s.replace(/(_)([*^\s]*)([\s\S]*?)([*^\s]*)\1/g, '$2$1$3$1$4');
    var fixU = s => s.replace(/(\^)([*_\s]*)([\s\S]*?)([*_\s]*)\1/g, '$2$1$3$1$4');


    // Recursive walk to reconstruct fancy text from text field nodes.
    class TextFieldFancifier {
        constructor(root) {
            this.root = root;
            this.buffer = '';
            this.attributes = {
                'bold': false, 
                'italic': false, 
                'underline': false,
            };
        }

        get() {
            let blankAttributes = jQuery.extend(true, {}, this.attributes);
            this.walk(this.root[0], this.attributes);
            this.pushAttributes(blankAttributes);
            this.buffer = $.trim(this.buffer); // .replace(/(\n+)([*_^]+)/g, '$2$1');

            // We want all modifier pairs to exclude as much whitespace as possible.
            this.buffer = fixB(this.buffer);
            this.buffer = fixI(this.buffer);
            this.buffer = fixU(this.buffer);

            // console.log('>>>\n' + this.buffer);
            return this.buffer;
        }

        walk(node, parentAttributes) {
            var name = node.nodeName.toLowerCase();
            var type = node.nodeType;
            if (type == 3) { // Text node.
                this.pushAttributes(parentAttributes);
                this.pushText(node.textContent);
                return;
            }

            let style = node.style || {};
            let bold = style.fontWeight && style.fontWeight.search('bold') >= 0;
            let italic = style.fontStyle && style.fontStyle.search('italic') >= 0;
            let underline = style.fontVariant && style.fontVariant.search('small-caps') >= 0;

            var attributes = jQuery.extend(true, {}, parentAttributes);
            if (name == 'b' || name == 'strong' || bold) {
                attributes.bold = true;
            } else if (name == 'i' || name == 'em' || italic) {
                attributes.italic = true;
            } else if (name == 'u' || underline) {
                attributes.underline = true;
            }
            if (name == 'br' || name == 'div') {
                this.pushText('\n');
            } else if (name == 'blockquote') {
                attributes.bold = false;
                attributes.italic = false;
                attributes.underline = false;
                this.pushAttributes(attributes);
                this.pushText(REVERSE_INDENTS[$(node).attr('class')] + ' ');
            }
            for (var i = 0; i < node.childNodes.length; i++) {
                this.walk(node.childNodes[i], attributes);
            }
            if (name == 'blockquote') {
                this.pushText('\n');
            }
        }

        pushAttributes(attributes) {
            for (var k in attributes) {
                if (attributes[k] != this.attributes[k]) {
                    this.attributes[k] = attributes[k];
                    this.pushText(REVERSE_MODIFIERS[k]);
                }
            }
        }

        pushText(text) {
            this.buffer += text;
        }
    }


    // Extract a text field's contents in fancy form.
    // Scoped for use by external code.
    getTextFieldContentsFancy = function(element) {
        return new TextFieldFancifier(element).get();
    }



    // Old HTML fancifier.
    // Convert Google Sheets HTML into plain "formatted" fancy text.
    // Scoped for use by external code.
    fancifyHTML = function(data) {
        var attributes = {
            'bold': false, 
            'italic': false, 
            'underline': false, 
        }
        var buffer = '';
        $(data.replace(/html/g, 'div')).find('span').each(function(i) {
            var style = $(this).attr('style');
            if (style) {
                for (var k in REVERSE_MODIFIERS) {
                    if (style.includes(k) != attributes[k]) {
                        buffer += REVERSE_MODIFIERS[k];
                        attributes[k] = !attributes[k];
                    }
                }
            }
            buffer += $(this).text();
        });
        for (var k in REVERSE_MODIFIERS) {
            if (attributes[k]) {
                buffer += REVERSE_MODIFIERS[k];
            }
        }
        return buffer;
    }


    // Extract a text field's contents in fancy form.
    // Scoped for use by external code.
    fancifyHTML = function(data) {
        if (!data) {
            return data;
        }
        data = data.replace(/html/g, 'div').replace(/body/g, 'root');
        data = data.replace(/\r\n/g, '');
        let element = $(data).find('root');
        return new TextFieldFancifier(element).get();
    }
 
 
 
});
