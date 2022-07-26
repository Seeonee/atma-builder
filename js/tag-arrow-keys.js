jQuery(document).ready(function ($) {


    var isPlus = function(e) {
        return (e.which == 187 && e.shiftKey) || 
            (e.which == 107 && !e.shiftKey);
    }

    var isMinus = function(e) {
        return (e.which == 189 || e.which == 109) && 
            e.shiftKey == false;
    }

    var isArrow = function(e) {
        return [37, 38, 39, 40].includes(e.which);
    }

    var isNumber = function(e) {
        return [0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69].includes(e.which) || 
            (!e.shiftKey && [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39].includes(e.which));
    }

    var isSpecial = function(e) {
        return [8, 46, 9, 13].includes(e.which); // Backspace, delete, tab, newline.
    }


    // https://jsfiddle.net/Mottie/8w5x7e1s/
    var selectAll = function(content) {
        var range, selection;
        if (document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(content);
            range.select();
        } else if (window.getSelection) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(content);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // Allow numeric stat/cost "tags" to adjust values in response to up/down arrow keys.
    cardRefresher.register(function(card) {
        // Extras are 0+ only.
        card.find('.cost .content[contenteditable]').on('keyup', function(e) {
            var target = $(e.target);
            if (e.which == 38 || e.which == 40) { // Up and down arrows.
                var value = parseInt(target.text());
                if (!isNaN(value)) {
                    value = value + (e.which == 38 ? 1 : -1);
                    if (value >= 0) {
                        target.text(value);
                    }
                }
            }
            selectAll(target[0]);
        });
        card.find('.cost .content[contenteditable]').on('keydown', function(e) {
            console.log(e.which);
            return isArrow(e) || isNumber(e) || isSpecial(e);
        });

        // Player stats can also be negative.
        card.find('.modifier[contenteditable]').on('keyup', function(e) {
            var target = $(e.target);
            if (e.which == 38 || e.which == 40) { // Up and down arrows.
                var negative = target.hasClass('negative');
                var value = parseInt(target.text());
                if (!isNaN(value)) {
                    var modifier = e.which == 38 ? 1 : -1;
                    if (negative) {
                        value *= -1;
                    }
                    value += modifier;
                    if (!negative && value < 0) {
                        target.addClass('negative');
                    } else if (negative && value == 0) {
                        target.removeClass('negative');
                    }
                    target.text(Math.abs(value));
                }
            }
            selectAll(target[0]);
        });
        card.find('.modifier[contenteditable]').on('keydown', function(e) {
            if (isPlus(e)) {
                $(e.target).removeClass('negative');
                return false;
            } else if (isMinus(e)) {
                var target = $(e.target);
                var value = parseInt(target.text());
                if (value != 0) {
                    target.addClass('negative');
                }
                return false;
            } else { 
                return isArrow(e) || isNumber(e) || isSpecial(e);
            }
        });

        // Select text on focus.
        card.find('.cost .content[contenteditable]').on('focus', function(e) {
            selectAll(e.target);
        });
        card.find('.modifier[contenteditable]').on('focus', function(e) {
            selectAll(e.target);
        });
    });


});
