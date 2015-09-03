$(document).ready(function(){

  // Load Navigation
  $("Navigation").load("templates/header.html");

  // Full Height
  $('.fullscreen').css({'min-height':$(window).height() - $(".website-nav").height()});
  $('.fullscreen').each(function(){
    if($(this).height() > $(window).height()){
      $(this).css({"padding":"40px 0px"});
    }
  });

  // ScrollSpy
  $('.scrollspy').scrollSpy();

});
