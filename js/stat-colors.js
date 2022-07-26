jQuery(document).ready(function ($) {


    var STATS = [
        'tough', 
        'calm', 
        'hasty', 
        'bright', 
        'sly'
    ];

    var colorStats = function(card) {
        card.find('.main u').each(function(i, e) {
            e = $(e);
            var text = $.trim(e.text())
            if (STATS.includes(text)) {
                e.attr('class', text);
            } else {
                e.removeClass();
            }
        });
    }


    cardRefresher.register(function(card) {
        if (card.hasClass('player')) {
            card.find('.main .content.underlinable').focusout(function (e) {
                colorStats(card);
            });

            colorStats(card);
        }
    });

 
});
