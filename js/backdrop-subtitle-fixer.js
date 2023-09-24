jQuery(document).ready(function ($) {


    var updateBackdropSubtitle = function(card) {
        var title = card.find('.title .content')[0];
        var subtitle = card.find('.subtitle');
        var range = document.createRange();
        range.setStart(title, 0);
        range.setEnd(title, 1);
        var lines = range.getClientRects().length - 1;
        if (lines > 1) {
            subtitle.addClass('lowered');
        } else {
            subtitle.removeClass('lowered');
        }
    }


    cardRefresher.register(function(card) {
        if (card.hasClass('backdrop') && card.hasClass('front')) {
            card.find('.title .content').focusout(function (e) {
                updateBackdropSubtitle(card);
            });
            updateBackdropSubtitle(card);
        }
    });

 
});
