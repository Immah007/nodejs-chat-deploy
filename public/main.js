let mic = document.getElementById("sendBtn");
        let background = document.querySelector("body");
        let colorChanger = document.getElementById("colorChanger");
        let micSvg = document.getElementById("micSvg");
        let sendIcon = document.getElementById("sendIcon");
        let body = document.getElementById("body");
        let input = document.getElementById("input");
        let taggedMessage = '';
        let taggedMessageDiv = document.getElementById("input-message-tag-text");
        var socket = io(); 

        
        //alert('You can now chat safely and securely with anyone in the world! You simply need to enter the chat ID and start. Anyone in the world can access you via the chat ID.')
        var chatRoom = prompt('Enter the chat ID to start up');
            if(chatRoom == '' || chatRoom == null){
               // alert('chatroom is not set');
                chatRoom = 'default';
            };
            

            //JOIN THE SPECIFIC CHAT ROOM>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            socket.emit('joinRoom', chatRoom);


        let messageTagIsActive = false;
        let quotedSender = '';
        let quotedMessage = '';
        
        function hideMic(){sendIcon.style.display = "inline-block"; micSvg.style.display = "none" }
        
        
        
        // Add an event listener to the input
input.addEventListener('input', function() {

    let username = 'USERNAME TYPING';
    socket.emit('typing', {chatRoom , username});
  // Check if the input value is not empty
  if (input.value.trim() !== ' ') {
    // Enable the button
     hideMic()
  }
   else {
    // Disable the button
    sendIcon.style.display = "none";
    micSvg.style.display = "inline-block"
  }

 

    


});
   
socket.on('typing', (username) => {
   // alert("User is typing...");
    setTimeout(
        function(){
            
            document.getElementById("online").style.display = "none";
            document.getElementById("typing").style.display = "block";
        setTimeout(
            function(){
            document.getElementById("online").style.display = "block";
            document.getElementById("typing").style.display = "none";
            }, 3000)
    
        }, 1000) 
    //socket.emit('typing', username + "typing notification...")

});

        //SENDING THE MESSAGE...
        function sendMsg(){
           //alert(typeof(input.value));
            //Your message processing code
            if(input.value == null){
                 alert('message can be sent');
            };
        var messageToSend = input.value;
        socket.emit('chat message', {chatRoom, messageToSend});
        hideInputMsgTag();

        var hr = new Date().getHours();
        var min = new Date().getMinutes();
            if (min< 10) {min = "0"+ min};
        var time = hr+":"+min;


       let chatBubbleContainer = document.createElement('div');  
           chatBubbleContainer.setAttribute("class","messageBubbleContainer");
           
      
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

            
           body.appendChild(chatBubbleContainer); 
           if(messageTagIsActive == true){
            //alert('');
            let bubbleTag = document.createElement('div');
                bubbleTag.setAttribute('id','message-tag');
                
            let bubbleTagLabel = document.createElement('div');
                bubbleTagLabel.setAttribute('id','message-tag-label');
                bubbleTag.style.color = 'grey';
                bubbleTagLabel.innerText = 'Sender';
            let bubbleTagMessage = document.createElement('div'); 
                bubbleTagMessage.setAttribute('id','message-tag-text');
                bubbleTagMessage.style.color = 'black';
                bubbleTagMessage.innerText = quotedMessage;       
                //bubbleTag.innerText = quotedMessage;
                bubbleTag.appendChild(bubbleTagLabel);
                bubbleTag.appendChild(bubbleTagMessage);
                chatBubbleContainer.appendChild(bubbleTag);
           }
           chatBubbleContainer.appendChild(textBox);
           textBox.appendChild(nameStamp);
           
           textBox.appendChild(messageText);
           textBox.appendChild(timeStamp);       
           makeDraggable(textBox);
           body.scrollTop = body.scrollHeight;

           messageTagIsActive = false;


        //LOGIC FOR PROCESSING INCOMING MESSAGES...........
    
        //<<<LOGIC FOR PROCESSING IICOMING MESSAGES
        
            
        }

        ///MESSAGE TAGGING FUNCTIONALITY LPGOC......
        
          function makeDraggable(element) {
            
            let startX, initialLeft;

            element.addEventListener('touchstart', function(event) {
                // Start dragging
                const touch = event.touches[0];
                startX = touch.clientX;
                initialLeft = parseInt(element.style.left, 10) || 0;
                element.style.cursor = 'grabbing'; // Change cursor
                //event.preventDefault();
            });

            element.addEventListener('touchmove', function(event) {
                // During dragging
                const touch = event.touches[0];
                const dx = touch.clientX - startX;
                const newLeft = Math.max(initialLeft + dx, 0); // Prevent moving to the left

                element.style.left = `${newLeft}px`;
                //event.preventDefault();
            });

            element.addEventListener('touchend', function() {
                // End dragging
                showInputMsgTag();
                element.style.cursor = 'grab'; // Reset cursor
                element.style.left = `${initialLeft}px`;
                element.style.transition = '0.4s';
                obtainedText = element.querySelector('p');
                quotedMessage = obtainedText.innerText;
                   setTimeout(function(){element.style.transition = 'none'},400); 
                    // Return to original position
                
                // Trigger the console message with the text of the dragged div
                consoleMessage(quotedMessage);

                // Add a button to the second container
               //******* addButtonToSecondContainer(element);
            });
        }

          function consoleMessage(text) {
            taggedMessage = text;
            taggedMessageDiv.innerText = taggedMessage;
            console.log(`Div has returned to its original position. Text: "${text}"`);

          }
          function showInputMsgTag(){
            document.getElementById('msg-tag').style.display = 'flex';
            document.getElementById('input-tagged-message').style.minHeight = '150%';
            document.getElementById('input-tagged-message').style.padding = '4px';
            input.placeholder = "Reply to quoted...";
            messageTagIsActive = true;

          }
          function hideInputMsgTag(){
            document.getElementById('msg-tag').style.display = 'none';
            document.getElementById('input-tagged-message').style.minHeight = '0';
            document.getElementById('input-tagged-message').style.padding = '0';
            input.placeholder = "Type a message...";
          }
          function cancelMessageTag(){
            messageTagIsActive = false;
            hideInputMsgTag();
          }
             
         ////END OF TAGGING FUNCTIONALITY.




        socket.on('chat message', function(msg){
       // alert(".....")

          var newMessageHour = new Date().getHours();
    var newMessageMinute = new Date().getMinutes();
        if (newMessageMinute< 10) {newMessageMinute = "0"+ newMessageMinute};
    var newMessageTime = newMessageHour+":"+newMessageMinute;


   let chatBubbleContainer = document.createElement('div');  
       chatBubbleContainer.setAttribute("class","messageBubbleContainer");
   let newMessageBubble = document.createElement('div');  
       newMessageBubble.setAttribute("class","inMsg");
       newMessageBubble.setAttribute("id","sent");
   let newMessageNameStamp = document.createElement('div');
       newMessageNameStamp.setAttribute("class","nameStamp");
       newMessageNameStamp.innerText = "Sender";
   let newMessageText = document.createElement('p');
       newMessageText.setAttribute("class","text-message");        
       newMessageText.innerText = msg.messageToSend;
   let newMessageTimeStamp = document.createElement('div');
       newMessageTimeStamp.setAttribute("class", "timeStamp");
       newMessageTimeStamp.innerText = newMessageTime;

       body.appendChild(chatBubbleContainer); 
       chatBubbleContainer.appendChild(newMessageBubble);
       newMessageBubble.appendChild(newMessageNameStamp);
       newMessageBubble.appendChild(newMessageText);
       newMessageBubble.appendChild(newMessageTimeStamp); 
        makeDraggable(newMessageBubble);

          //$('#messages').append($('<li>').text(msg));
          body.scrollTop = body.scrollHeight;
      });

   function showMenu(){
           alert("Menu package list is updating...");
   }
   function useEmoji(){
           alert("Emoji package is updating...");
   }
   function sendFile(){
           alert("Files cannot be uploaded at the moment.");
   }
   function takePhoto(){
           alert("Please allow Camera access to take photos.");
   }
   





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
