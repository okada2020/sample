//スクロール途中からヘッダーを出現させるための設定を関数でまとめる
function FixedAnime() {
  var elemTop = $('#picup').offset().top;//#area-3の位置まできたら
  var scroll = $(window).scrollTop();
  if(scroll <= 20){//上から20pxスクロールされたら
    $('#header_menu').addClass('DownMove');//DownMoveというクラス名を除き
  } else if (scroll >= elemTop){
      $('#header_menu_menu').removeClass('UpMove');//#header_menuについているUpMoveというクラス名を除く
      $('#header_menu').addClass('DownMove');//#header_menuについているDownMoveというクラス名を付与

    }else{
      if($('#header_menu').hasClass('DownMove')){//すでに#header_menuにDownMoveというクラス名がついていたら
        $('#header_menu').removeClass('DownMove');//DownMoveというクラス名を除き
        $('#header_menu').addClass('UpMove');//UpnMoveというクラス名を付与
      }
    }
}

//ナビゲーションをクリックした際のスムーススクロール
$('#header_menu a').click(function () {
  var elmHash = $(this).attr('href'); //hrefの内容を取得
  var pos = Math.round($(elmHash).offset().top-70); //headerの高さを引く
  $('body,html').animate({scrollTop: pos}, 500);//取得した位置にスクロール※数値が大きいほどゆっくりスクロール
  return false;//リンクの無効化
});


// 画面をスクロールをしたら動かしたい場合の記述
$(window).scroll(function () {
  FixedAnime();/* スクロール途中からヘッダーを出現させる関数を呼ぶ*/
});

// ページが読み込まれたらすぐに動かしたい場合の記述
$(window).on('load', function () {
  FixedAnime();/* スクロール途中からヘッダーを出現させる関数を呼ぶ*/
});// JavaScript Document