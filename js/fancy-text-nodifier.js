jQuery(document).ready(function ($) {


    // Constants.
    var MODIFIERS = {
        '*': 'bold',
        '_': 'italic',
        '^': 'underline'
    };
    var INDENTS = {
        '{': 'gm-cost-1', 
        '{{': 'gm-cost-2', 
        '|': 'bullet', 
        '}': 'gm-cost-free'
    };


    // Class which walks a section of fancy text 
    // and returns an array of node objects 
    // ready to be inserted into a selection range.
    class Nodifier {
        constructor(text) {
            this.text = text;
            this.nodes = [];
            this.buffer = '';
            this.attributes = {
                'bold': false, 
                'italic': false, 
                'underline': false,
            };
            this.indentNode = undefined;
            this.newline = false;
        }

        get() {
            // Stupid Windows newlines.
            this.text = this.text.replace(/\r\n?/g, '\n');
            // More than two consecutive newlines are pointless.
            this.text = this.text.replace(/\n\n+/g, '\n\n');
            // Remove space after indents.
            this.text = this.text.replace(/([{}|]+) /g, '$1');
            // Clear out empty indented lines.
            // TODO?

            // Main loop to walk the text.
            for (var i = 0; i < this.text.length; i++) {
                var c = this.text[i];
                if (c == '\n') {
                    this.flushBuffer();
                    if (this.indentNode) {
                        this.flushIndent();
                    } else {
                        // Insert linebreak.
                        if (!this.newline) {
                            this.appendNode($('<br>')[0]);
                        } else {
                            this.appendNode($('<div class="br">')[0]);
                        }
                    }
                } else if (c in MODIFIERS) {
                    this.flushBuffer();
                    // Toggle the attribute.
                    this.attributes[MODIFIERS[c]] = !this.attributes[MODIFIERS[c]];
                } else if (c in INDENTS) {
                    if (this.newline) {
                        // Start an indent.
                        this.indentNode = $('<blockquote class="{0}">'.format(INDENTS[c]));
                    } else if (this.indentNode) {
                        // Update (or increment) the current indent.
                        if (c == '{' && this.indentNode.attr('class') == INDENTS['{']) {
                            this.indentNode.attr('class', INDENTS['{{']);
                        } else {
                            this.indentNode.attr('class', INDENTS[c]);
                        }
                    }
                } else {
                    this.buffer += c;
                }
                this.newline = c == '\n';
            }
            this.flushBuffer();
            this.flushIndent();
            return this.nodes;
        }

        flushBuffer() {
            var s = this.buffer;
            this.buffer = '';
            // Empty buffer means nothing to do.
            if (s.length == 0) {
                return;
            }

            // Likewise, no attributes means push plain text.
            if (!this.attributes.bold && !this.attributes.italic && !this.attributes.underline) {
                this.appendNode(document.createTextNode(s));
                return;
            }

            // Wrap some (possibly nested) attribute elements around the text.
            if (this.attributes.underline) {
                s = '<u>{0}</u>'.format(s);
            }
            if (this.attributes.italic) {
                s = '<i>{0}</i>'.format(s);
            }
            if (this.attributes.bold) {
                s = '<b>{0}</b>'.format(s);
            }
            this.appendNode($(s)[0]);
        }

        flushIndent() {
            var node = this.indentNode;
            this.indentNode = undefined;
            if (node && node[0].hasChildNodes()) {
                this.appendNode(node[0]);
            }
        }

        appendNode(node) {
            if (this.indentNode) {
                $(node).appendTo(this.indentNode);
            } else {
                // Add nodes in reverse order.
                this.nodes.unshift(node);
            }
        }
    }


    // Convert fancy text into insertable nodes.
    // Scoped for use by external code.
    nodifyFancyText = function(text) {
        return new Nodifier(text).get();
    }


});
