jQuery(document).ready(function ($) {

    // Support auto text field resizing on the (multiline) title fields.
    var TITLE_WIDTH_MIN = 475;
    var TITLE_WIDTH_MAX = 600;


    var refreshTitleWidth = function(card) {
        let title = card.find('.title .content')[0];
        if (!title) {
            return;
        }

        var cardWidth = card[0].getBoundingClientRect()['width'];
        var cardScale = cardWidth / card.width();

        var multi = title.innerHTML.includes('<br>');
        var width = title.getBoundingClientRect()['width'] / cardScale;
        var parent = $(title.parentElement);
        var isLarge = parent.hasClass('large');

        if (isLarge) {
            if (multi || width >= TITLE_WIDTH_MAX) {
                parent.removeClass('large');
            }
        } else {
            if (!multi && width < TITLE_WIDTH_MIN) {
                parent.addClass('large');
            }
        }
    }

    
    cardRefresher.register(function(card) {
        if (card.find('.title.large')[0]) {
            card.find('.title.large .content').on('keyup', function(e) {
                refreshTitleWidth(card);
            });

            refreshTitleWidth(card);
        }
    });

 
});
