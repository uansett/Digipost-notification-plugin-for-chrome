
	/*
	* L�kker gjennom og sjekker mot apiet for ny post i postkassen. Ved ny mail vises en desktop notification.
	* Teller antall brev i postkassen og p� kj�kkenbenken og skriver summen utenp� applikasjonsikonet.
	* Cross-domain ajax calls er gjort mulig ved � spesifisere permissions i manifest-filen til chrome extensionen.
	*/
		chrome.extension.onRequest.addListener(
	  	function(request, sender, sendResponse) {
		/*
		* "Login" kalles fra login.html - popup-vinduet.
		*/
	    if (request.func == "login")
		{		
			login(request.fnr, request.pass);
	      	sendResponse({res: window.msg,auth: window.authed});
		}
	    else if(request.func == "auth")
	      	sendResponse({auth: window.authed, list: window.list});
	  	});
		/*
		* lastmsg: holder p� brevID for det nyeste brevet, for � ikke vise alle brevene i postkassen ved hver iterasjon. 
		* Nye brev vises derfor kun en gang. Alle brev i postkassen vises ved oppstart av appen.
		* narr holder p� notifikasjonsobjektene for � legge til en timeout p� disse.
		* window.authed forteller om brukeren er innlogget eller ikke. L�kken hopper ut dersom brukeren ikke er logget inn.
		*/
		var lastmsg = 0;
		var narr = new Array();
		window.authed = false;
		window.list = "";
		function run()
		{
				$.ajax({
			    	type: "GET",
			    	url: "https://www.digipost.no/post/api/private",
					async: false,
			    	success: function(result) {
						//@@TODO var result = JSON.parse(JSON.stringify(res).replace(/\"/g, "\'"));
						if(result.kode == "IKKE_AUTENTISERT")
						{
							/*
							* IKKE AUTORISERT - gj�r app-ikonet gr�tt
							*/
							chrome.browserAction.setIcon({path: "icon_noauth.png"});
							window.authed = false;
						}
						else
						{
							/*
							* AUTORISERT - gj�r arbeid.
							* viser notifikasjoner for brev i postkassen, teller antall brev i postkasse og p� kj�kkenbenk. postkasse 
							*/
							//chrome.browserAction.setPopup({popup: "inbox.html"});
							window.authed=true;
							var postkasse = JSON.parse(getPost(result.postkasseUri));
							var kjoekkenbenk = JSON.parse(getPost(result.kjokkenbenkUri));
							/*
							var popups = chrome.extension.getViews({type: "popup"});
							var popup;
							if (popups.length != 0) {
							  	wdoc = popups[0];
								popup = wdoc.document;
								
							}
							*/
							window.list = "";
							var inboxUrl = "https://www.digipost.no/post/privat/index.html#/";
							
							for(var i = postkasse.length-1; i >= 0; i--)
							{
								if(postkasse[i].brevId > lastmsg)
								{
									var avsender = postkasse[i].avsender;
									var emne = postkasse[i].emne;
									var brevId = postkasse[i].brevId;
									
									list += '<div class="brev" onClick=\'chrome.tabs.create({url: "'+inboxUrl+'postkassen/'+brevId+'"})\'><div class="avsender">'+avsender+'</div><br/><div class="emne">'+emne+'</div></div>';
									
									/*
									* Skriv notifikasjoner for all ny post. Evt. ved oppstart all post som ligger i postkassen.
									*/
									var notification = window.webkitNotifications.createNotification('icon_auth.png', avsender, emne);
									$(notification).bind('click', function(){
										chrome.tabs.create({url:
											"https://www.digipost.no/post/privat/index.html#/"});
									});
									narr[i] = notification;
									narr[i].show();
									setTimeout("narr["+i+"].cancel()", 10000);
									lastmsg = brevId;
								}
							}
							for(var i = kjoekkenbenk.length-1; i >= 0; i--)
							{
								if(kjoekkenbenk[i].brevId > lastmsg)
								{
									var avsender = kjoekkenbenk[i].avsender;
									var emne = kjoekkenbenk[i].emne;
									var brevId = kjoekkenbenk[i].brevId;
									
									list += '<div class="brev" onClick=\'chrome.tabs.create({url: "'+inboxUrl+'kjokkenbenken/'+brevId+'"})\'><div class="avsender">'+avsender+'</div><br/><div class="emne">'+emne+'</div></div>';
									
									/*
									* Skriv notifikasjoner for all ny post. Evt. ved oppstart all post som ligger i postkassen.
									*/
									var notification = window.webkitNotifications.createNotification('icon_auth.png', avsender, emne);
									$(notification).bind('click', function(){
										chrome.tabs.create({url:
											"https://www.digipost.no/post/privat/index.html#/"});
									});
									narr[i] = notification;
									narr[i].show();
									setTimeout("narr["+i+"].cancel()", 10000);
									lastmsg = brevId;
								}
							}
							/*
							* Tell antall brev i b�de postkassen og p� kj�kkenbenken. Disse trenger oppmerksomhet og blir telt opp.
							* postkasse.length og kjoekkenbenk.length er arrayer med brev-objekter.
							*/
							var count = 0;
							count += postkasse.length;
							count += kjoekkenbenk.length;
							chrome.browserAction.setBadgeText({text: String(count)});
						}
			    	},
			    	error: function(res) {
						/*
						* Fikk ikke hentet inbox. Skifter ikon til gr�tt
						*/
						chrome.browserAction.setIcon({path: "icon_noauth.png"});
			    	}
				});
				/*
				* Kj�rer en sjekk p� inboxen hvert 4. minutt
				*/
			setTimeout("run()", 30000);
		}
	    function getPost(uri)
		{
			/*
			* Henter et innboksobjekt og brev fra spesifisert uri.
			*/
			var xmlhttp;
			res = "";
			xmlhttp=new XMLHttpRequest();
			xmlhttp.onreadystatechange=function()
			{
			  	if (xmlhttp.readyState==4 && xmlhttp.status==200)
			    {
			    	res = xmlhttp.responseText;
			    }
			}
			xmlhttp.open("GET",uri,false);
			xmlhttp.send();
			return res;
		}
		
		/*
		* Logger inn en bruker, fra f�dselsnummer f og passord p. f og p sendes fra popup.
		* Lagrer cookie lokalt slik at man kan hente brev og innbokser senere.
		*/
		function login(f, p)
		{
			$.ajax({
			    type: "POST",
			    url: "https://www.digipost.no/post/passordautentisering",
				async: false,
			    data: {
			        foedselsnummer: f,
			        passord: p
			    },

			    success: function(res) { 
			        window.msg = "Du er logget inn.";
					chrome.browserAction.setIcon({path: "icon_auth.png"});
					window.authed = true;
					run();
			    },
			    error: function(res) { 
			        window.msg = "Autentiseringsfeil: pr�v p� nytt.";
			    }
			});
		}