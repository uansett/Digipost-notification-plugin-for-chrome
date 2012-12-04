function login(f, p)
		{
			//var auth = new Boolean();
			/*
			* Sender melding til bakgrunnsprosessen og ber om å kjøre login, skrive resultat til popup-vinduet.
			*/
			chrome.extension.sendRequest({func: "login", fnr: f,pass: p}, function(response) {
				//auth = response.auth;
			  	document.getElementById("error").innerHTML = response.res;
			});
			window.location.reload();
			/*$(document).ready(function(){
			if(!window.auth){
				document.getElementById("error").innerHTML = "loggaInn";
				$('#formm').hide();
				$('#info').show();
			}else{
				$('#formm').show();
				$('#info').hide();	
			}
		});*/
		}
		