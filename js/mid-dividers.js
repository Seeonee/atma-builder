jQuery(document).ready(function ($) {


    var redrawWidthsBasedOnExpansion = function(expansion) {
        if (expansion == undefined) {
            return;
        }
        var card = $('.card');
        var cardRect = card[0].getBoundingClientRect();
        var x = cardRect['x'];
        var cardWidth = cardRect['width'];
        var cardScale = cardWidth / card.width();
        var rect = expansion.getBoundingClientRect();
        var leftWidth = rect['left'] - x;
        var rightWidth = cardWidth - rect['right'] + x;
        $('.mid-divider .side.left').width(leftWidth / cardScale);
        $('.mid-divider .side.right').width(rightWidth / cardScale);
    }


    cardRefresher.register(function(card) {
        // On focus, temporarily hide horizontal mid-card dividers.
        // On unfocus, also update their widths.
        card.find('.expansion [contenteditable]').focus(function (e) {
            card.find('.mid-divider').addClass('editing');
        });
        card.find('.expansion [contenteditable]').focusout(function (e) {
            redrawWidthsBasedOnExpansion(e.target);
            card.find('.mid-divider').removeClass('editing');
        });

        redrawWidthsBasedOnExpansion(card.find('.expansion .content')[0]);
    });

 
});
