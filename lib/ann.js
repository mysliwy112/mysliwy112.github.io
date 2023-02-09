var playing=0;
var time=0;
//framerate
var frameTime=62;

//URLSearchParams
var params;

//active event
var eve;
//active frame
var frame=0;
//active ann
var pAnn;

class Ann{
    constructor(path){
        if(path!=undefined){
            this.load(path);
        }
    }
    //tries to load ann in this async hell
    load(path){
        this.name=path.slice(path.lastIndexOf('/')+1);
        setParam("file", path)
        path="filesys/"+path+"/";
        console.log(path+this.name+".json")
        fetch(path+this.name+".json")
        .then(response => response.json())
        .then(data => {
            this.images=data.images;
            this.events=data.events;
    
            const promiseArray = [];
            for(var im of Object.keys(this.images)){
                promiseArray.push(new Promise(resolve => {
                    this.images[im].data=new Image();
                    this.images[im].data.onload=resolve
                    this.images[im].data.src=path+im;
                }));
            }
            return promiseArray;
        })
        .then(promiseArray=>Promise.all(promiseArray))
        .then((a)=>{
            loadEventsList(this);

            // pAnn.events[eve].frames.length
            changeEvent(eve);
            changeFrame(0);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
    
}



//loads events to events list
function loadEventsList(ann){
    var eventsList=document.getElementById("events");
    while (eventsList.firstChild) {
        eventsList.removeChild(eventsList.firstChild);
    }
    for(var ev of Object.keys(ann.events)){
        var el=document.createElement("li");
        el.innerHTML=ev;
        el.addEventListener("click",function(){changeEvent(this.innerHTML)});
        el.classList.add("clickable");
        eventsList.appendChild(el);
    }
}




//main display canvas configuration
function initCanvas(){
    canvas=document.getElementById("screen");
    resizeCanvas(document.getElementById("canvasWidth").value,document.getElementById("canvasHeight").value);
}

function initAnn(path){
    pAnn=new Ann(path);
}

//sets URL parameters
function setParam(name, value){
    if(params==undefined)
        params=new URLSearchParams()
    params.set(name, value)
    let stateObj = { id: "100" }; 
    window.history.pushState(stateObj, name, "?"+params); 
}

//playing manager
function pl(timestamp){
    if (time == 0)
        time = timestamp;
    elaps = timestamp - time;
    if (playing!=0){
        if(elaps>frameTime){
            time=timestamp;
            if(changeFrame(frame+playing)){
                pause();
            }
        }
        requestAnimationFrame(pl);
    }else{
        time=0
    }
}


function play(){
    playing=1;
    requestAnimationFrame(pl);
}

function playB(){
    playing=-1;
    requestAnimationFrame(pl);

}

function pause(){
    playing=0;
}

//changes frame displayed on canvas
function changeFrame(fr,clear=true){
    if(clear){
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
	var end=0;
	if(pAnn.events[eve].frames.length>0){
        if(fr!=undefined){
            if(document.getElementById('loopCheck').checked==0){
                if(pAnn.events[eve].frames.length<=fr){
                    fr=pAnn.events[eve].frames.length-1;
                    end=1
                }else if(fr<0){
                    fr=0;
                    end=1;
                }
            }else if(pAnn.events[eve].frames.length<=fr){
                fr=0;
            }else if(fr<0){
                fr=pAnn.events[eve].frames.length-1;
            }
            frame=fr;
        }
        
        var frm=pAnn.events[eve].frames[frame];

		if("filename" in frm){
            var img=pAnn.images[frm.filename]
            drawFrame(canvas,img,frm);
		}
	}else{
		end=1;
	}
    return end;
}

function changeEvent(ev, chFrame=true){

    if(!(ev in pAnn.events)){
        ev=Object.keys(pAnn.events)[0]
    }

    setParam("event", ev);
    var eventsList=document.getElementById("events");
    for(child of eventsList.children){
        if(child.innerHTML==ev){
            child.classList.add("selected");
        }else{
            child.classList.remove("selected");
        }
        
    }

    eve=ev;
    f=document.getElementById("frames");
    document.getElementById("loopCheck").checked=(pAnn.events[eve].loop>0);
    var i=0;

    while (f.firstChild) {
        f.removeChild(f.firstChild);
    }

    for(i=0;i<pAnn.events[eve].frames.length;i++){
        if("filename" in pAnn.events[eve].frames[i]){
            f.appendChild(document.createElement("img"));
            f.lastElementChild.src=pAnn.images[pAnn.events[eve].frames[i].filename].data.src;
            f.lastElementChild.dataset.frame=i;
            f.lastElementChild.addEventListener("click",function(){;changeFrame(Number(this.dataset.frame))});
        }
    }
    if(chFrame){
        pause();
        changeFrame(0);
    }
}

function drawMultipleFrames(ann,frames=undefined,clear=true){
    if(clear){
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
    if(frames==undefined){
        frames= Array.from(Array(ann.events[eve].frames.length).keys())
    }
    for(frame of frames){
        if(ann.events[eve].frames.length>frame&&frame>=0){
            var frm=ann.events[eve].frames[frame];
            drawFrame(canvas,ann.images[frm.filename],frm);
        }
    }

}

function drawMultipleEvents(ann){
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    events=Object.keys(ann.events)
    for(ev of events){
        changeEvent(ev,false);
        drawMultipleFrames(ann,undefined,false);
    }
}




function drawFrame(drawer,img,frm=undefined,cX=0,cY=0){
    if(frm==undefined)
        frm={}
    var ctx = drawer.getContext('2d');
    if(img.position_x==undefined)
        img.position_x=0;
    if(img.position_y==undefined)
        img.position_y=0;
    if(frm.position_x==undefined)
        frm.position_x=0;
    if(frm.position_y==undefined)
        frm.position_y=0;
    var posX=img.position_x+frm.position_x+cX;
    var posY=img.position_y+frm.position_y+cY;
    if(document.getElementById('centerCheck').checked){
        posX=canvas.width/2+posX;
        posY=canvas.height/2+posY;
    }
    ctx.drawImage(img.data, posX, posY);
}


function resizeCanvas(width=null,height=null){
    if(width!=null){
        canvas.width=width;
    }
    if(height!=null){
        canvas.height=height;
    }
    changeFrame();
}


//incomplete saving functions

function saveGif(ann){
    var encoder = new GIFEncoder();
    encoder.setRepeat(!document.getElementById("loopCheck").checked);
    encoder.setDelay(frameTime);

    var drawer=document.createElement('canvas');
    drawer.width  = canvas.width;
    drawer.height = canvas.height;
    drawer.getContext('2d').fillStyle = "#fc02db";

    // encoder.setTransparent(0xfc02db);
    encoder.start();
    for(fr of ann.events[eve].frames){
        drawer.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        // drawer.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);
        drawFrame(drawer,ann.images[fr.filename],fr);
        encoder.addFrame(drawer.getContext('2d'));   
    }
    encoder.finish();
    encoder.download(ann.name+".gif");

}


function saveSequence(ann){
    drawer.width  = canvas.width;
    drawer.height = canvas.height;
    var i=0;
    for(fr of ann.events[eve].frames){
        drawFrame(drawer,ann.images[fr.filename],fr);
        var dataURL = drawer.toDataURL();
        zip.file(eve+"_"+i, dataURL.split('base64,')[1],{base64: true});
        i++;
    }

    zip.generateAsync({type:"blob"})
    // zip.generateAsync({type:"base64"})
    .then(function(content) {
        // see FileSaver.js
        saveAs(content, ann.name+"_"+eve+".zip");
        // window.location = "data:application/zip;base64," + content;
    });
    
}

function saveAnn(){}

function saveFiles(ann){
    var zip = new JSZip();

    var drawer=document.createElement('canvas');
    drawer.width  = canvas.width;
    drawer.height = canvas.height;
    
    var i=0;
    for(img of Object.keys(ann.images)){
        drawFrame(drawer,ann.images[img]);
        var dataURL = drawer.toDataURL();
        zip.file(img, dataURL.split('base64,')[1],{base64: true});
        i++;
    }
    zip.file(name+".json", JSON.stringify(ann, null, 2));
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, ann.name+".zip");
    });

}

//special functions used for specific anns and purpouses, can be launched only from console


function drawArrows(ann,num){
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    events=Object.keys(ann.events)
    for(ev of events){
        changeEvent(ev,false);
        changeFrame(num,false);
    }
}

function drawMap(ann,guide,addX,addY){
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    for(var i of Object.keys(guide.images)){
        console.log(guide.images[i].name.slice(0,2).toUpperCase());
        if (guide.images[i].name.slice(0,2).toUpperCase() in ann.events){
            drawFrame(canvas,ann.images[ann.events[guide.images[i].name.slice(0,2).toUpperCase()].frames[0].filename],undefined,guide.images[i].position_x*10+addX*10,guide.images[i].position_y*10+addY*10);
        }
    }
}