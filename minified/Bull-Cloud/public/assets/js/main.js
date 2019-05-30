/* https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm */

$ = (q, e) => {
  let i = typeof e === "number" ? e : undefined;
  let o = typeof e === "object" ? e : undefined;
  let r = o ? o.querySelectorAll(q) : document.querySelectorAll(q);
  if(i!==undefined){
      return r[i];
  }else if(r.length===1){
      return r[0];
  }else{
      return r;
  }
}

//YouMightNotNeedjQuery
HTMLElement.prototype.find = function(q){return $(q, this)};
HTMLElement.prototype.hasClass = function(q){return this.classList ? this.classList.contains(q) : new RegExp('(^| )' + q + '( |$)', 'gi').test(this.q); }
HTMLElement.prototype.addClass = function(q){return this.classList ? this.classList.add(q) : this.className += ' ' + q;}
HTMLElement.prototype.removeClass = function(q){return this.classList ? this.classList.remove(q) : this.className = this.className.replace(new RegExp('(^|\\b)' + q.split(' ').join('|') + '(\\b|$)', 'gi'), ' '); }
HTMLElement.prototype.toggleClass =  function(q){return this.hasClass(q) ? this.removeClass(q) : this.addClass(q); }
HTMLElement.prototype.attr = function(q,s){return s!==undefined ? s===null ? this.removeAttribute(q) : this.setAttribute(q, s) : this.getAttribute(q); }
HTMLElement.prototype.data = function(q,s){return this.attr("data-"+q,s); }
HTMLElement.prototype.html = function(q){return this.innerHTML=q; }
HTMLElement.prototype.forEach = function(q,s){return [this].forEach(q,s); }
HTMLElement.prototype.append = function(q){return this.appendChild(q); }

let tagTemplate = ['<div class="tag" name="','">',' <div class="remove"><svg role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"></path></svg></div></div>'];
let modalTagTemplate = ['<li class="active" name="','">','</li>']
let monthArr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
let changesMade = false;
let oldCategories = {};
let lastArr = [];
let map = null;

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyBk6kv0DRH7onRsRZTsWsS-UcTkWg2QKEQ",
    authDomain: "bull-41.firebaseapp.com",
    databaseURL: "https://bull-41.firebaseio.com",
    projectId: "bull-41",
    storageBucket: "bull-41.appspot.com",
    messagingSenderId: "652007032196",
    appId: "1:652007032196:web:8284033fe2c2b1b1"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

//https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
function post(url, data, callback=()=>{}) {
    if(firebase.auth().currentUser){
        firebase.auth().currentUser.getIdToken().then(token=>{
            data.token = token;
            var XHR = new XMLHttpRequest();
            XHR.addEventListener('load', function(event) {
                callback(XHR.response);
            });
            XHR.open('POST', url);
            XHR.setRequestHeader('Content-Type', 'application/json');
            XHR.send(JSON.stringify(data));
        })
    } else {
        var XHR = new XMLHttpRequest();
        XHR.addEventListener('load', function(event) {
            callback(XHR.response);
        });
        XHR.open('POST', url);
        XHR.setRequestHeader('Content-Type', 'application/json');
        XHR.send(JSON.stringify(data));
    }
}

function get(url, callback=()=>{}) {
    var XHR = new XMLHttpRequest();
    XHR.addEventListener('load', function(event) {
        callback(XHR.response);
    });
    XHR.open('GET', url);
    XHR.send();
}

logout = () => {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        console.log("signed out")
        window.location = "/"
    }).catch(function(error) {
        // An error happened.
        console.log("error while signing out")
    });
}

generateToken = () => {
    let name = $("#name").value;
    let pass = $("#pass").value;
    let err = $("#err");
    firebase.auth().signInWithEmailAndPassword(name, pass)
    .then(function(res) {
        window.location = "/admin"
    })
    .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode, errorMessage);
        err.innerText = "Giriş başarısız."
        // ...
    });
}

showModal = (id, extraClass) => {
    $(id).addClass("active");
    if(extraClass){
        $(id).addClass(extraClass);
    }
}

exitModal = (id, callback=()=>{}) => {
    let n = isNaN($("#categoriesModal .inner ul li").length) ? 1 : $("#categoriesModal .inner ul li").length
    $("#categoriesNumber").innerText = n;
    $(id).attr("class", "modal");
    callback();
}

addCategory = () => {
    changesMade = true;
    $("#tags").innerHTML = "";
    $("#categoriesModal .inner ul li.active").forEach(el=>{
        $("#tags").innerHTML += tagTemplate.join(el.innerText.trim().replace(/\,|\"|\'|\`/g, ''));
    })
    $("#tags").innerHTML += '<div class="addTag">+</div>';
    addTagFunctionality();
}

addTagFunctionality = () => {
    $("#tags .tag .remove").forEach(removeButton=>{
        removeButton.addEventListener("click", function(){
            let tag = removeButton.parentNode;
            tag.parentNode.removeChild(tag);
        });
    })
    $("#tags .addTag").addEventListener("click", function(){
        $("#categoriesModal ul li").forEach(el=>{
            el.removeClass("active");
        })
        $("#tags .tag").forEach(el=>{
            $("#categoriesModal ul li[name='"+el.innerText.trim()+"']").forEach(li=>{
                li.addClass("active");
            })
        })
        showModal("#categoriesModal")
    });
}

addLiFunctionality = () => {
    $("#categoriesModal .inner ul li").forEach(el=>{
        el.addEventListener("click", function(){
            el.toggleClass("active");
        });
    })
}

/* https://github.com/xavame/xavame.github.io/blob/development/pages/_slug.vue */
scrollToTop = (element, totalTime, easingPower) => {
    const easeInOut = (t, power) => {
      if (t < 0.5) {
        return 0.5 * Math.pow(2 * t, power);
      } else {
        return 0.5 * (2 - Math.pow(2 * (1 - t), power));
      }
    };
    const timeInterval = 1;
    const scrollTop = Math.round(element.scrollTop);
    let timeLeft = totalTime;
    const scrollByPixel = setInterval(function() {
      const percentSpent = (totalTime - timeLeft) / totalTime;
      if (timeLeft >= 0) {
        const newScrollTop = scrollTop * (1 - easeInOut(percentSpent, easingPower));
        element.scrollTop = newScrollTop;
        timeLeft--;
      } else {
        clearInterval(scrollByPixel);
      }
    }, timeInterval);
  },

addItemFunctionality = () => {
    $(".item").forEach(el=>{
        el.addEventListener("click", function(){
            if(changesMade && !window.confirm("Yaptığınız değişiklikler kaybolabilir. Devam etmek istiyor musunuz?")) return false;
            $(".item").forEach(el=>{
                el.removeClass("active");
            });
            el.addClass("active");
            $(".secondLeftBar").removeClass("full");
            $("#title").innerText = el.find(".name").innerText;
            $("#content").innerText = el.find(".content .summary").innerHTML;
            $("#slug").innerText = el.find(".content .slug").innerText;
            map.setCenter(new google.maps.LatLng(el.find(".lat").innerText, el.find(".lng").innerText))
            /* https://www.unixtimestamp.com/index.php */
            $("#date input").value = new Date(Number(el.find(".content .date").innerHTML)).toISOString().slice(0, -5);
            let pTags = !!(el.find(".content .tags").innerHTML) ? (el.find(".content .tags").innerHTML).split(",").map(el=>{
                return tagTemplate.join(el.trim());
            }).join("") : "";
            $("#tags").innerHTML = pTags + '<div class="addTag">+</div>';
            changesMade = false;
            scrollToTop($(".innerMain"), 100, 3);
            addTagFunctionality();
            $(".main").removeClass("loading");
        });
    })
}

listFromArr = (arr, lastActive, callback) => {
    let lastid = $("#slug").innerText;
    let itemTemplate = ['<div class="item ',
    '" slug="',
    '"><div class="name">',
    '</div><div class="content"><span class="summary">',
    '</span><div class="date">',
    '</div><div class="humanDate">',
    '</div><div class="tags">',
    '</div><div class="slug">',
    '</div><div class="lat">',
    '</div><div class="lng">',
    '</div></div></div>'];
    let categories = {}
    $("#items").innerHTML = ""
    arr.map(el=>{
        //console.log(el);
        /* https://stackoverflow.com/questions/9229213/convert-iso-date-to-milliseconds-in-javascript */
        /* https://www.toptal.com/software/definitive-guide-to-datetime-manipulation */
        var myDate = new Date(el.KampanyaSuresi._seconds*1000);
        var offset = myDate.getTimezoneOffset() * 60 * 1000;
        var dateString = myDate.getTime() - offset;
        let currentDate = new Date(el.KampanyaSuresi._seconds*1000);
        var date = currentDate.getDate();
        var month = currentDate.getMonth();
        var year = currentDate.getFullYear();
        var humanDate = date + " " + monthArr[month] + " " + year;
        
        el.KampanyaKategori.map(cat=>{
            categories[cat] = 1;
        })

        $("#items").innerHTML += 
            itemTemplate[0] + (lastActive==="last" && lastid === el.FirmaID ? "active" : "") + 
            itemTemplate[1] + el.FirmaID +
            itemTemplate[2] + el.FirmaAdi +
            itemTemplate[3] + el.KampanyaIcerik +
            itemTemplate[4] + dateString +
            itemTemplate[5] + humanDate +
            itemTemplate[6] + el.KampanyaKategori.join(",") +
            itemTemplate[7] + el.FirmaID +
            itemTemplate[8] + el.FirmaLokasyon._latitude +
            itemTemplate[9] + el.FirmaLokasyon._longitude +
            itemTemplate[10]
        ;
    })

    oldCategories = {...oldCategories, ...categories};

    $("#categoriesModal .inner ul").innerHTML = Object.keys(oldCategories).map(cat=>modalTagTemplate.join(cat)).join("")

    let n = isNaN($("#categoriesModal .inner ul li").length) ? 1 : $("#categoriesModal .inner ul li").length
    $("#categoriesNumber").innerText = n;
    let k = isNaN($("#items .item").length) ? 1 : $("#items .item").length
    $("#postsNumber").innerText = k;

    addItemFunctionality();
    
    if(lastActive==="last"){
        lastActive = null;
    }
    
    if (lastActive && JSON.parse(lastActive) && JSON.parse(lastActive).returnObj && JSON.parse(lastActive).returnObj.id){
        $("#items .item[slug='"+JSON.parse(lastActive).returnObj.id+"']").click();
    }

    

    addLiFunctionality();
    callback();
}

loadItems = (lastActive, callback=()=>{}) => {    
    $("#items").innerHTML = '<div class="loader"><div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div></div>';
    get("/list", (response)=>{
        let arr = JSON.parse(response).returnObj;
        lastArr = arr;
        console.log("Fetched New Items List: ",arr);
        listFromArr(arr, lastActive, callback);
    })
    
}

loginOnload = function() {
    $("#name").addEventListener("keydown", function(){
        $("#err").innerText = "";
    })
    $("#pass").addEventListener("keydown", function(event){
        if (event.which == 13 || event.keyCode == 13) {
            generateToken();
            return false;
        }
        $("#err").innerText = "";
    })
};

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: {lat: 40.8221848, lng: 29.9214841},
        gestureHandling: 'cooperative',
        disableDefaultUI: true,
        scaleControl: true,
        zoomControl: true,
        //https://snazzymaps.com/style/151/ultra-light-with-labels
        styles: [
            {
                "featureType": "landscape",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#e9e9e9"
                    },
                    {
                        "lightness": 17
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f5f5f5"
                    },
                    {
                        "lightness": 20
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 17
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 29
                    },
                    {
                        "weight": 0.2
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 18
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 16
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f5f5f5"
                    },
                    {
                        "lightness": 21
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dedede"
                    },
                    {
                        "lightness": 21
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "on"
                    },
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 16
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "saturation": 36
                    },
                    {
                        "color": "#333333"
                    },
                    {
                        "lightness": 40
                    }
                ]
            },
            {
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f2f2f2"
                    },
                    {
                        "lightness": 19
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#fefefe"
                    },
                    {
                        "lightness": 20
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#fefefe"
                    },
                    {
                        "lightness": 17
                    },
                    {
                        "weight": 1.2
                    }
                ]
            }
        ]
    });
}

adminOnload = function() {

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            $("#newPost").addEventListener("click", function(){
                if(changesMade && !window.confirm("Yaptığınız değişiklikler kaybolabilir. Devam etmek istiyor musunuz?")) return false;
                $(".item").forEach(el=>{
                    el.removeClass("active");
                })
                var myDate = new Date();
                var offset = myDate.getTimezoneOffset() * 60 * 1000;
                var dateString = myDate.getTime() - offset;
                $("#date input").value = new Date(dateString).toISOString().slice(0, -5);
                $("#title").innerText = "";
                map.setCenter(new google.maps.LatLng(40.8221848, 29.9214841))
                $("#content").innerText = "";
                $("#slug").innerText = "";
                $("#tags").innerHTML = '<div class="addTag">+</div>';
                $(".secondLeftBar").removeClass("full");
                $("#title").focus();
                changesMade = false;
                addTagFunctionality();
                $(".main").removeClass("loading");
                scrollToTop($(".innerMain"), 100, 3);
            })
        
            $("#addCircle").addEventListener("click", function(){
                $("#newPost").click();
            });

            $("#content").addEventListener("keyup", function(){
                changesMade = true;
            });
        
            $("#createCategory").addEventListener("click", function(){
                let name = $("#categoriesModal #categoryName").value;
                if($("#categoriesModal .inner ul li[name='"+name+"']").length===0){
                    let catName = name.trim().replace(/\,|\"|\'|\`/g, '');
                    $("#categoriesModal .inner ul").innerHTML = modalTagTemplate.join(catName) + $("#categoriesModal .inner ul").innerHTML;
                    oldCategories[catName] = 1;
                    addLiFunctionality();
                }else{
                    $("#categoriesModal .inner ul li[name='"+name+"']").addClass("active");
                }
                $("#categoriesModal #categoryName").value = "";
                $("#categoriesModal #categoryName").focus();
            });
        
            $("#search").addEventListener("keyup", function(){
                $("#searchButton").click();
            });

            $("#categoriesModal #categoryName").addEventListener("keydown", function(event){
                if (event.which == 13 || event.keyCode == 13) {
                    $("#createCategory").click();
                    return false;
                }
            })
              
            $("#searchButton").addEventListener("click", function(event){
                listFromArr(lastArr.filter((a)=>{
                    return a.FirmaAdi.toLowerCase().indexOf($("#search").value.toLowerCase()) > -1;
                }), "last", ()=>{
                    console.log("searched from last array");
                })
            })
            
            $("#save").addEventListener("click", function(){
                this.addClass("loading");
                let category = [];
                $("#tags .tag").forEach(el=>{
                    category.push(el.attr("name"));
                })
                
                post("/addItem/", {
                    name: $("#title").innerText,
                    id: $("#slug").innerText ? $("#slug").innerText : (+new Date()).toString(),
                    location: [map.center.lat(),map.center.lng()],
                    content: $("#content").innerText,
                    time: new Date($("#date input").value).getTime(),
                    category
                }, (res)=>{
                    changesMade = false;
                    loadItems(res, ()=>{
                        $("#save").removeClass("loading");
                    });
                })
            });
    
            $("#postFullDate").addEventListener("change", function(el){
                changesMade = true;
            });
        
            $("#removePost").addEventListener("click", function(){
                let id = $(".item.active").length!==0 ? $(".item.active").attr("slug") : null;
                if(id){
                    this.addClass("loading");
                    $(".main").addClass("loading")
                    post("/removeItem/", {
                        id
                    }, (res)=>{
                        setTimeout(function(){
                            loadItems(null, ()=>{
                                $(".secondLeftBar").addClass("full");
                                $("#removePost").removeClass("loading");
                            });
                        },1000)
                    })
                }
            });
        
            $("#filter").addEventListener("click", function(){
                if(changesMade && !window.confirm("Yaptığınız değişiklikler kaybolabilir. Devam etmek istiyor musunuz?")) return false;
                changesMade = false;
                this.toggleClass("active");
                let v = this.hasClass("active");
                this.find("span").innerText = v ? "En yeni" : "En eski";
                //this may be the best trick
                $("#items").toggleClass("reverse");
            });
        
            loadItems();
        } else {
            // No user is signed in.
            console.log("Nope. Redirecting back.");
            window.location = "/";
        }
    });
};