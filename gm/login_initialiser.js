$(document).ready(function(){
				chrome.extension.sendRequest({func: "auth"}, function(response) {
					var auth = response.auth;
				if(auth){
					document.getElementById("list").innerHTML = response.list;
					$('#formm').hide();
					$('#list').show();
				}else{
					$('#formm').show();
					$('#list').hide();	
				}
				});
				
		});