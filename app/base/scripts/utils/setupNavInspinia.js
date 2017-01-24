/**
 * INSPINIA - Responsive Admin Theme
 * 2.2
 *
 * Custom scripts
 */
/* global setTimeout */
'use strict';
 $(window).on('resize',function() {
      var heightWithoutNavbar = $("body").height() - (17+71);
       
       var navbarHeigh = 0;
        var navbarHeigh = $('nav.navbar-default').height();
        if(typeof navbarHeigh !== 'undefined')
        {
            if(navbarHeigh >heightWithoutNavbar){
                $('#page-wrapper').css("min-height", navbarHeigh + "px");
            }else{
                $('#page-wrapper').css("min-height", heightWithoutNavbar  + "px");
            }
        }
        else
        {
             $('#page-wrapper').css("min-height", heightWithoutNavbar  + "px");
        }
}).trigger('resize');

$(document).ready(function () {

    // Full height of sidebar
    function fix_height() {
        var heightWithoutNavbar = $("body").height() - (17+71);
       
       var navbarHeigh = 0;
        var navbarHeigh = $('nav.navbar-default').height();
        if(typeof navbarHeigh !== 'undefined')
        {
            if(navbarHeigh > heightWithoutNavbar){
                $('#page-wrapper').css("min-height", navbarHeigh + "px");
            }
            else{
                $('#page-wrapper').css("min-height", heightWithoutNavbar  + "px");
            }
        }
        else
        {
             $('#page-wrapper').css("min-height", heightWithoutNavbar  + "px");
        }

    }


    $(window).bind("load resize scroll", function() {
        if(!$("body").hasClass('body-small')) {
            fix_height();
        }
    });

    // Move right sidebar top after scroll
    $(window).scroll(function(){
        if ($(window).scrollTop() > 0 && !$('body').hasClass('fixed-nav') ) {
            $('#right-sidebar').addClass('sidebar-top');
        } else {
            $('#right-sidebar').removeClass('sidebar-top');
        }
    });


    setTimeout(function(){
        fix_height();
    });
});

// Minimalize menu when screen is less than 768px
$(function() {
    $(window).bind("load resize", function() {
        if ($(this).width() < 769) {
            $('body').addClass('body-small');
        } else {
            $('body').removeClass('body-small');
            $("#demoTemp .navbar-static-side").css('display','');
        }
    });
});
