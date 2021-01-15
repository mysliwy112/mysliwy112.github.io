var ann;
var eve;
var frame=0;
var playing=0;
var time=0;
var frameTime=62;
var params;
var name="ann"

function init(){
    canvas=document.getElementById("screen");
}


function setParam(name, value){
    if(params==undefined)
        params=new URLSearchParams()
    params.set(name, value)
    let stateObj = { id: "100" }; 
    window.history.pushState(stateObj, name, "?"+params); 
}

function load(path,ev,fr){
    name=path.slice(path.lastIndexOf('/')+1);
    setParam("file", path)
    path="filesys/"+path+"/";
    console.log(path+name+".json")
    fetch(path+name+".json")
    .then(response => response.json())
    .then(data => {
        ann=data;

        const promiseArray = [];
        for(var im of Object.keys(ann.images)){
            promiseArray.push(new Promise(resolve => {
                ann.images[im].data=new Image();
                ann.images[im].data.onload=resolve
                ann.images[im].data.src=path+im;
            }));
        }
        
        var eventsList=document.getElementById("events");
        while (eventsList.firstChild) {
            eventsList.removeChild(eventsList.firstChild);
        }
        for(var ev of Object.keys(ann.events)){
            var el=document.createElement("li");
            el.innerHTML=ev;
            el.addEventListener("click",function(){changeEvent(this.innerHTML)});
            eventsList.appendChild(el);
        }

        return promiseArray;


    })
    .then(promiseArray=>Promise.all(promiseArray))
    .then(data =>{
        changeEvent(eve);
        changeFrame(0);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function play(){
    playing=1;
    requestAnimationFrame(pl);

}

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

function playB(){
    playing=-1;
    requestAnimationFrame(pl);

}

function pause(){
    playing=0;
}

function changeFrame(fr){
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	var end=0;
	if(ann.events[eve].frames.length>0){
        if(fr!=undefined){
            if(document.getElementById('loopCheck').checked==0){
                if(ann.events[eve].frames.length<=fr){
                    fr=ann.events[eve].frames.length-1;
                    end=1
                }else if(fr<0){
                    fr=0;
                    end=1;
                }
            }else if(ann.events[eve].frames.length<=fr){
                fr=0;
            }else if(fr<0){
                fr=ann.events[eve].frames.length-1;
            }
            frame=fr;
        }
        
        var frm=ann.events[eve].frames[frame];

		if("filename" in frm){
            var img=ann.images[frm.filename]
            drawFrame(canvas,img,frm);
		}
	}else{
		end=1;
	}
    return end;
}

function changeEvent(ev){
    if(!(ev in ann.events)){
        ev=Object.keys(ann.events)[0]
    }
    setParam("event", ev);
    eve=ev;
    f=document.getElementById("frames");
    document.getElementById("loopCheck").checked=(ann.events[eve].loop>0);
    var i=0;

    while (f.firstChild) {
        f.removeChild(f.firstChild);
    }

    for(i=0;i<ann.events[eve].frames.length;i++){
        if("filename" in ann.events[eve].frames[i]){
            f.appendChild(document.createElement("img"));
            f.lastElementChild.src=ann.images[ann.events[eve].frames[i].filename].data.src;
            f.lastElementChild.dataset.frame=i;
            f.lastElementChild.addEventListener("click",function(){;changeFrame(Number(this.dataset.frame))});
        }
    }
    pause();
    changeFrame(0);
}

function drawMultipleFrames(frames){
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if(frames==undefined){
        frames= Array.from(Array(ann.events[eve].frames.length).keys())
        console.log(frames);
    }
    for(frame of frames){
        if(ann.events[eve].frames.length>frame&&frame>=0){
            var frm=ann.events[eve].frames[frame];
            drawFrame(canvas,ann.images[frm.filename],frm);
        }
    }

}

function drawFrame(drawer,img,frm){
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
    var posX=img.position_x+frm.position_x;
    var posY=img.position_y+frm.position_y;
    if(document.getElementById('centerCheck').checked){
        posX=canvas.width/2+posX;
        posY=canvas.height/2+posY;
    }
    ctx.drawImage(img.data, posX, posY);
}







function saveGif(){
    var encoder = new GIFEncoder();
    encoder.setRepeat(!document.getElementById("loopCheck").checked);
    encoder.setDelay(frameTime);

    var drawer=document.createElement('canvas');
    drawer.width  = 300;
    drawer.height = 600;
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
    encoder.download(name+".gif");

}


function saveSequence(){
    var zip = new JSZip();
    var drawer=document.createElement('canvas');
    drawer.width  = 300;
    drawer.height = 600;
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
        saveAs(content, name+"_"+eve+".zip");
        // window.location = "data:application/zip;base64," + content;
    });
    
}

function saveAnn(){}

function saveFiles(){
    var zip = new JSZip();

    var drawer=document.createElement('canvas');
    drawer.width  = 300;
    drawer.height = 600;
    
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
        saveAs(content, name+".zip");
    });

}
