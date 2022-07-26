jQuery(document).ready(function ($) {


    var STATS = [
        'tough', 
        'calm', 
        'hasty', 
        'bright', 
        'sly', 
        'health'
    ];

    var updateUpgradeStat = function(card, fireEvent=true) {
        if (card.hasClass('super')) {
            var stat = card.find('.upgrader').find('option:selected').val();
            var tag = card.find('.stat');
            tag.attr('class', 'stat tag position {0}'.format(stat))
            var label = tag.find('.label');
            label.text(stat);

            if (fireEvent) {
                label.trigger('updated');
            }
        }
    }

    cardRefresher.register(function(card) {
        card.find('.upgrader').on('change', function(e) {
            updateUpgradeStat(card);
        });

        updateUpgradeStat(card, false);
    });

 
});
