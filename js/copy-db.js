jQuery(document).ready(function ($) {
    $('.collapsible').on('click', e => {
        $(e.target)[0].classList.toggle('active');
        let content = $(e.target).next()[0];
        content.style.maxHeight = content.style.maxHeight ? null : `${content.scrollHeight}px`;
    });
});
