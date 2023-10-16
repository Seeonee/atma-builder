jQuery(document).ready(function ($) {


    const Y = 1237; // This is the standard card's .main.position top+height, minus its spacer's width.
                    // It represents the y-axis intersection of the diagonal spacer with the right side 
                    // of a regular-width content box.
    const PAD = 200; // Stretch it a bit further just in case.
    const MARGIN_TOP = 35; // Margin separating various goals, from .card.journey.front .goal.position

    var recomputeJourneyGoalSpacer = function() {
        let card = $('.card');
        let g3 = card.find('.goal-3');
        let spacer = g3.find('.spacer');

        let shrink = window.localStorage.getItem('shrink') == 'true';
        let factor = shrink ? 0.5 : 1;

        // Hide the spacer so we can get an accurate read on the height.
        spacer.addClass('editing');

        // We have to wait long enough for a redraw.
        setTimeout(function() {
            // We have to scale the Y/top values, but not the heights.
            let [g3y, g3h] = [g3.position().top / factor, g3.height()];
            let mainy = g3.parent().position().top / factor;

            // The main, goal 1, and goal 2 paragraphs above us have margins; 
            // adding this math cleaned up the mismatch.
            g3y += 3 * MARGIN_TOP * factor;
            
            let spacerh = g3h + PAD;
            let spacerw = mainy + g3y + g3h - Y + PAD;

            let style = spacer.get(0).style;
            style.setProperty('--h', `${spacerh}px`);
            style.setProperty('--w', `${spacerw}px`);

            spacer.removeClass('editing');
        }, 1);
    }

    // Option 2.
    var recomputeJourneyGoalBars = function() {
        let shrink = window.localStorage.getItem('shrink') == 'true';
        let factor = shrink ? 0.5 : 1;

        $('.card .goal').each((i, e) => {
            let goal = $(e);
            if (goal.hasClass('goal-3')) {
                // Option 2d.
                // let bar = goal.find('.bar');
                // let h = goal.find('.content').height() - MARGIN_TOP;

                // let style = bar.get(0).style;
                // style.setProperty('--h', `${h}px`);
                // End option 2d.
                return;
            }
            let bar = goal.find('.bar');
            let y1 = goal.position().top;
            let y2 = goal.next().position().top;
            let h = (y2 - y1) / factor;

            let style = bar.get(0).style;
            style.setProperty('--h', `${h}px`);
        });
        $('.card .goal .bar').removeClass('editing');
    }
    // End option 2.


    cardRefresher.register(function(card) {
        if (card.hasClass('journey') && card.hasClass('front')) {
            // On unfocus, recompute the 3rd goal's spacer.
            card.find('.main .content[contenteditable]').focusout(function (e) {
                recomputeJourneyGoalSpacer();
            });
            recomputeJourneyGoalSpacer();

            // Hide and show/resize the goalpost bars.
            // Option 2.
            // card.find('.main .content[contenteditable]').focus(function (e) {
            //     $('.card .goal .bar').addClass('editing');
            // });
            // card.find('.main .content[contenteditable]').focusout(function (e) {
            //     recomputeJourneyGoalBars();
            // });
            // setTimeout(recomputeJourneyGoalBars, 1);
            // End option 2.
        }
    });

 
});
