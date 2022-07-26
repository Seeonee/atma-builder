jQuery(document).ready(function ($) {


    var TWISTS = {
        'backfire': 'Backfire a player\'s action upon them in spectactular fashion.', 
        'deplete': 'Deplete a resource, degrade a tool, or remove an asset.', 
        'foreshadow': 'Foreshadow a new challenge looming on the horizon.', 
        'offer': 'Offer a tempting opportunity, possibly with a catch.', 
        'promote': 'Promote an extra into a star with a name and story.', 
        'reveal': 'Reveal a new truth, changing their perception of the world.', 
        'challenge': 'Challenge the players with a new setback, goal, or foe.', 
        'challenge-strength': 'Challenge a player, highlighting one of their strengths.', 
        'challenge-flaw': 'Challenge a player, exposing one of their weaknesses.'
    };

    var redrawTwistText = function(card, fireEvent=true) {
        if (card.hasClass('twist')) {
            var twist = card.find('.twister').find('option:selected').val();
            card.find('.alternate .content').text(TWISTS[twist]);
            var eventer = card.find('.twister .eventer');
            eventer.text(twist);

            if (fireEvent) {
                eventer.trigger('updated');
            }
        }
    }

    cardRefresher.register(function(card) {
        card.find('.twister').on('change', function(e) {
            // redrawTwistText(card);
        });

        // redrawTwistText(card, false);
    });

 
});
