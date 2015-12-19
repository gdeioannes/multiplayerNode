$('#messages').scrollTop(100000000000000000000000000000000000000000);    
    $('#toggle-btn').click(function(){
        console.log("text")
        $('#chat-container').toggle();
    });  

    
    if($('#u-name').val()==""){
        $('#u-name').val("User"+Math.round(Math.random()*1000));
    }

socket.on('send data', function(rData){
      console.log(rData);
      console.log(rData.name);
    $('#messages').append($('<li><label>'+rData.name+': </label>'+rData.message+'</li>'));
      $('#messages').scrollTop(100000000000000000000000000000000000000000);
  });