
        let mic = document.getElementById("sendBtn");
        let background = document.querySelector("body");
        let colorChanger = document.getElementById("colorChanger");
        let micSvg = document.getElementById("micSvg");
        let sendIcon = document.getElementById("sendIcon");
        let body = document.getElementById("body");
        let input = document.getElementById("input");

        var socket = io();    
        
        function hideMic(){sendIcon.style.display = "inline-block"; micSvg.style.display = "none" }
        
        
        
        // Add an event listener to the input
input.addEventListener('input', function() {
  // Check if the input value is not empty
  if (input.value.trim() !== '') {
    // Enable the button
     hideMic()
  } else {
    // Disable the button
    sendIcon.style.display = "none";
    micSvg.style.display = "inline-block"
  }
});

        //SENDING THE MESSAGE...
        function sendMsg(){

            //Your message processing code
        var messageToSend = input.value;
        socket.emit('chat message', messageToSend);

        var hr = new Date().getHours();
        var min = new Date().getMinutes();
            if (min< 10) {min = "0"+ min};
        var time = hr+":"+min;
      
       let textBox = document.createElement('div');  
           textBox.setAttribute("class","outMsg");
           textBox.setAttribute("id","sent");
       let nameStamp = document.createElement('div');
           nameStamp.setAttribute("class","nameStamp");
           nameStamp.innerText = "You";
       let messageText = document.createElement('p');
           messageText.setAttribute("class","text-message");    
           messageText.innerText = messageToSend;
       let timeStamp = document.createElement('div');
           timeStamp.setAttribute("class", "timeStamp");
           timeStamp.innerText = time;
             

           input.value = null;
           sendIcon.style.display = "none";
           micSvg.style.display = "inline-block";


           body.appendChild(textBox); 
           textBox.appendChild(nameStamp);
           textBox.appendChild(messageText);
           textBox.appendChild(timeStamp);       

            body.scrollTo(0, document.body.scrollHeight);


            //LOGIC FOR PROCESSING INCOMING MESSAGES...........
            /*
            socket.on('chat message', function(msg){
              //alert(".....")

              var newMessageHour = new Date().getHours();
        var newMessageMinute = new Date().getMinutes();
            if (newMessageMinute< 10) {newMessageMinute = "0"+ newMessageMinute};
        var newMessageTime = newMessageHour+":"+newMessageMinute;
      
       let newMessageBubble = document.createElement('div');  
           newMessageBubble.setAttribute("class","inMsg");
           newMessageBubble.setAttribute("id","sent");
       let newMessageNameStamp = document.createElement('div');
           newMessageNameStamp.setAttribute("class","nameStamp");
           newMessageNameStamp.innerText = "Sender";
       let newMessageText = document.createElement('p');
           newMessageText.setAttribute("class","text-message");        
           newMessageText.innerText = msg;
       let newMessageTimeStamp = document.createElement('div');
           newMessageTimeStamp.setAttribute("class", "timeStamp");
           newMessageTimeStamp.innerText = newMessageTime;

           body.appendChild(newMessageBubble); 
           newMessageBubble.appendChild(newMessageNameStamp);
           newMessageBubble.appendChild(newMessageText);
           newMessageBubble.appendChild(newMessageTimeStamp); 

              //$('#messages').append($('<li>').text(msg));
              window.scrollTo(0, document.body.scrollHeight);
          });
             */
          //<<<LOGIC FOR PROCESSING IICOMING MESSAGES
     
            
            
        }

        socket.on('chat message', function(msg){
          //alert(".....")

          var newMessageHour = new Date().getHours();
    var newMessageMinute = new Date().getMinutes();
        if (newMessageMinute< 10) {newMessageMinute = "0"+ newMessageMinute};
    var newMessageTime = newMessageHour+":"+newMessageMinute;
  
   let newMessageBubble = document.createElement('div');  
       newMessageBubble.setAttribute("class","inMsg");
       newMessageBubble.setAttribute("id","sent");
   let newMessageNameStamp = document.createElement('div');
       newMessageNameStamp.setAttribute("class","nameStamp");
       newMessageNameStamp.innerText = "Sender";
   let newMessageText = document.createElement('p');
       newMessageText.setAttribute("class","text-message");        
       newMessageText.innerText = msg;
   let newMessageTimeStamp = document.createElement('div');
       newMessageTimeStamp.setAttribute("class", "timeStamp");
       newMessageTimeStamp.innerText = newMessageTime;

       body.appendChild(newMessageBubble); 
       newMessageBubble.appendChild(newMessageNameStamp);
       newMessageBubble.appendChild(newMessageText);
       newMessageBubble.appendChild(newMessageTimeStamp); 

          //$('#messages').append($('<li>').text(msg));
          window.scrollTo(0, document.body.scrollHeight);
      });





       //start of grabbing css variable 
        const root = document.documentElement;
        const mainColor = getComputedStyle(root).getPropertyValue('--main-color');

        //End of Grabbing the css variable
        let colorIdentity = 0;
        function changeTheme(){
            logo.style.transition = "2s";
            colorChanger.style.transition = "2s";
            mic.style.transition = "2s";

            if(colorIdentity == 0){ 
                
                
          
               //Change to Grey Theme
               root.style.setProperty('--main-color', 'black'); 
               root.style.setProperty('--background-color', 'rgb(50,50,50, .01)');
            
                
              colorIdentity =1;  
                


            }
            else if(colorIdentity===1){
                                           //Change to RED Theme
               root.style.setProperty('--main-color', 'red');
               root.style.setProperty('--background-color', 'rgb(225, 222,222)');
            
            
            colorIdentity = 2;        
           
           }
           else if(colorIdentity===2){
                                       //Change to PINK Theme
               root.style.setProperty('--main-color', '#FF007F');
               root.style.setProperty('--background-color', 'rgb(225,215,220)');
                
            
            colorIdentity = 3;        
           
           }
           else if(colorIdentity===3){
                                        //Change to GREEN Theme
               root.style.setProperty('--main-color', 'green');
               root.style.setProperty('--background-color', 'rgb(200,230,200)');
               
            
            colorIdentity = 4;        
           
           }
           else if(colorIdentity===4){
                                         //Change to BRIGHT-GREEN Theme
               root.style.setProperty('--main-color', 'rgb(40,200,40)');
               root.style.setProperty('--background-color', 'rgb(200,230,200)');
              
            
            colorIdentity = 5;        
           
           }
           else if(colorIdentity===5){
                                           //Change to BLUE Theme
               root.style.setProperty('--main-color', 'blue');
               root.style.setProperty('--background-color', '#dbe9f4');
            
            
            colorIdentity = 6;        
           
           }
           else if(colorIdentity===6){
                                           //Change to ROYAL-BLUE Theme
               root.style.setProperty('--main-color', '#114');
               root.style.setProperty('--background-color', '#dbe9f4');
            
            
            colorIdentity = 7;        
           }
           else if(colorIdentity===7){
                                           //Change to ORANGE Theme
               root.style.setProperty('--main-color', '#FF5F1F');
               root.style.setProperty('--background-color', '#FFF0E6');
            
            
            colorIdentity = 8;
           }
           
           
           else{
                                       //Change to DEFAULT Theme              
             root.style.setProperty('--main-color', '#00bfff');
               root.style.setProperty('--background-color', '#dbe9f4');
            
            
            colorIdentity = 0;    
           }
        }
        