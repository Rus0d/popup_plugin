$(function() {

    var menuList = $('.header__nav li'),
        menuancor = $('.scrollTo'),
        hamburger = $('.template__header_hamburger'),
        icons = $('.icons');


    hamburger.click(function () {
        $(this).toggleClass('open');
        $('.template__header').toggleClass('color__toggler');
    });

    menuancor.each(function(i, elem) {
        menuList.eq(i).click(function() {
            $('html, body').animate({scrollTop: ($(elem).offset().top - $('.template__header').height() - $('.template__pre-header').height())}, 1000);
            hamburger.trigger('click');
        });
    });

    if (!Modernizr.svg) {
        icons.each(function(i, elem) {
            var tempUrl = $(elem).css('background-image');
            $(elem).css('background-image', tempUrl.replace(".svg",".png"));
        });
    }

});


