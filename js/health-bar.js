jQuery(document).ready(function ($) {

    // Walk a container.
    // Return the outermost blockquote tag containing a nested node.
    // Return undefined if none is found.
    var makeHeart = function(isNew) {
        var heart = $('<span class="heart">');
        if (isNew) {
            heart.addClass('new');
        }

        var left = $('<span class="left">');
        $('<span class="polygon">').appendTo(left);
        // $('<span class="fill">').appendTo(left);
        // $('<span class="cap">').appendTo(left);
        var anchor = $('<span class="anchor">');
        left.appendTo(anchor);
        anchor.appendTo(heart);

        // $('<img src="images/heart.png">').appendTo(heart);
        $('<span class="image">').appendTo(heart);

        var right = $('<span class="right">');
        $('<span class="polygon">').appendTo(right);
        // $('<span class="fill">').appendTo(right);
        // $('<span class="cap">').appendTo(right);
        right.appendTo(heart);
        return heart;
    }

    // Given a string, create a sequence of hearts to display.
    var redrawHealthBar = function(s) {
        var hearts = $('.healthbar .hearts');
        hearts.empty();
        s = $.trim(s).replace(/\S/g, 'a').replace(/ +a/g, 'A');
        if (s.length == 0) {
            s = 'a';
        }
        for (var i = 0; i < s.length; i++) {
            makeHeart(s[i] == 'A').appendTo(hearts);
        }
    }


    cardRefresher.register(function(card) {
        // On focus, hide hearts.
        card.find('.healthbar [contenteditable]').focus(function (e) {
            card.find('.healthbar .hearts').addClass('editing');
        });
        // On focus loss, update and show hearts.
        card.find('.healthbar [contenteditable]').focusout(function (e) {
            redrawHealthBar($(e.target).text());
            card.find('.healthbar .hearts').removeClass('editing');
        });

        // Auto-replace characters in the text field with heart icons.
        card.find('.healthbar .content').on('keyup paste', function(e) {
            if (e.which < 0x30 || e.ctrlKey) {
                return true; // Unprintable.
            }
            var target = $(e.target);
            var text = $.trim(target.text());
            text = text.replace(/\S/g, '♥').replace(/\s+/, ' ');
            var offset = window.getSelection().getRangeAt(0).startOffset;
       
            target.text(text);
            
            var selection = window.getSelection();
            var range = document.createRange();
            range.setStart(e.target.childNodes[0], offset);
            range.collapse();
            selection.removeAllRanges();
            selection.addRange(range);
        });

        // Initialize the hearts for the current extra (remove this eventually).
        redrawHealthBar(card.find('.healthbar .content').text());
    });

 
});
