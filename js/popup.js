$(function() {

  // Functions
  function refresh_user_panel(){
    var user_email = localStorage['user_email'];
    $('#user_email').html(user_email).prepend('<img src="'+localStorage['user_avatar']+'" class="user_avatar" alt="" />');
  }

  // remove all user tokens
  function logout(){
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_token');
    localStorage.clear();
  }

  // check current tab url status and show button by situation
  function show_work_panel(){
    chrome.tabs.query({'active': true}, function (tabs) {
      var page_url   = tabs[0].url;
      var exist_url  = $('#work_panel').data('exist-url');
      var user_token = localStorage['user_token'];

      $('#add_link, #keep_link, #unkeep_link').hide();
      $.ajax({
        url: exist_url,
        type: 'GET',
        dataType: 'json',
        data: {user_token: user_token, url: page_url},
        success: function(resp){
          if(resp.status != null && resp.status.code == 200){
            if(resp.link.state == 0) return $('#keep_link').show();              
            if(resp.link.state == 5) return $('#unkeep_link').show();            
          }
          $('#add_link').show();
        },
        error: function(xhr, status, err){
          $('#add_link').show();          
        }
      });
      $('#work_panel').fadeIn(300);
    });
  }

  function shake(form) {
    var l = 10;  
    for(var i = 0;i < 6; i++)
      $(form).animate({ 'margin-left': "+=" + ( l = -l ) + 'px' }, 50);  
  }

  // Start
  var user_token = localStorage['user_token'];
  if(user_token){
    refresh_user_panel();
    $('#signin_panel, #signup_panel').hide();
    show_work_panel();
    // $('#work_panel').fadeIn(300);
  }else{
    $('#work_panel').hide();
    $('#signin_panel').fadeIn(300);
  }

  // Events
  $('#toggle_to_signup').click(function(){
    $('#signin_panel').hide();
    $('#signup_panel').fadeIn(300);    
    return false;
  });
  $('#toggle_to_signin').click(function(){
    $('#signup_panel').hide();
    $('#signin_panel').fadeIn(300);    
    return false;
  });
  $('#logout').click(function(){
    logout();
    $('#work_panel').hide();
    $('#signin_panel').fadeIn(300);
    return false;
  });

  // Submit login form
  $('#signin_form').submit(function(){
    if($('#signin_email').val() == '') {
      shake('#signin_email');
      $('#signin_email').focus();
      return false;
    }
    if($('#signin_password').val() == ''){
      shake('#signin_password');
      $('#signin_password').focus();
      return false;
    }

    var form = $(this);
    var action = form.attr('action');
    var method = form.attr('method');
    $.ajax({
      url: action,
      type: method,
      dataType: 'json',
      data: form.serialize(),
      success: function(resp){
        if(resp.status != null && resp.status.code == 200){
          localStorage['user_email']  = resp.user.email;
          localStorage['user_token']  = resp.user.token;
          localStorage['user_avatar'] = resp.user.avatar;
          $('#signin_panel').hide();
          refresh_user_panel();
          show_work_panel();
        }else{
          $('#signin_password').val('');
          shake('#signin_form');
        }
      },
      error: function(xhr, status, err){
        shake('#signin_form');        
      }
    });
    return false;
  });

  // Submit Sign up form
  $('#signup_form').submit(function(){
    if($('#signip_email').val() == '') {
      shake('#signup_email');
      $('#signup_email').focus();
      return false;
    }
    if($('#signup_password').val() == ''){
      shake('#signup_password');
      $('#signup_password').focus();
      return false;
    }
    var form = $(this);
    var action = form.attr('action');
    var method = form.attr('method');
    $.ajax({
      url: action,
      type: method,
      dataType: 'json',
      data: form.serialize(),
      success: function(resp){
        if(resp.status != null && resp.status.code == 200){
          localStorage['user_email']  = resp.user.email;
          localStorage['user_token']  = resp.user.token;
          localStorage['user_avatar'] = resp.user.avatar;
          $('#signup_panel').hide();
          refresh_user_panel();
          show_work_panel();
        }else{
          $('#signup_password').val('');
          shake('#signup_form');
        }
      },
      error: function(xhr, status, err){
        shake('#signup_form');        
      }
    });
    return false;
  });
  // onClick Add link
  $('#add_link').click(function(){
    var user_token = localStorage['user_token'];
    if(!user_token) return false;
    var that = $(this);
    var url = that.attr('href');
    chrome.tabs.query({'active': true}, function (tabs) {
      var page_url = tabs[0].url;
      var page_title = tabs[0].title;
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: {user_token: user_token, url: page_url, title: page_title},
        success: function(resp){
          if(resp.status != null && resp.status.code == 200){
            $('#add_link').hide();
            $('#keep_link').fadeIn(300);
          }
        },
        error: function(xhr, status, err){}
      });        
    });    
    return false;
  });

  // onClick Keep or UnKeep link
  var keep_link = function(){
    chrome.tabs.query({'active': true}, function (tabs) {
      var page_url   = tabs[0].url;
      var keep_url  = $('#keep_link').attr('href');
      var user_token = localStorage['user_token'];

      $.ajax({
        url: keep_url,
        type: 'POST',
        dataType: 'json',
        data: {user_token: user_token, url: page_url},
        success: function(resp){
          $('#add_link, #keep_link, #unkeep_link').hide();
          if(resp.status != null && resp.status.code == 200){
            if(resp.link.state == 0) return $('#keep_link').fadeIn(300);              
            if(resp.link.state == 5) return $('#unkeep_link').fadeIn(300);            
          }
        },
        error: function(xhr, status, err){}
      });
    });   
  }
  $('#keep_link').click(keep_link);
  $('#unkeep_link').click(keep_link)

  // onClick Get Last 10 links
  $('#get_links').click(function(){
    var user_token = localStorage['user_token'];
    var that = $(this);
    var url = that.attr('href');
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      data: {user_token: user_token},
      success: function(resp){
        if(resp.status != null && resp.status.code == 200){
          var links = '';
          if(resp.links.length <= 0) return;

          for(var link in resp.links){
            link = resp.links[link];
            if(link.title == 'null' || link.title == null || link.title == 'undefined') link.title = link.url;
            
            links += '<li><a href="'+link.url+'" target="_blank">- '+link.title+'</a></li>';
          }
          $('#links_list').html('<ul class="links">'+links+'</ul><div class="more-link"><a href="http://en-uke.com" target="_blank">more on en-uke.com &rarr;</a></div>');
        }
      },
      error: function(xhr, status, err){}
    });        
    return false;
  });

});