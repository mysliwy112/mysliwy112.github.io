var ann;
var eve="";
var frame=0;
var playing=0;
var time=0;
var frameTime=62;

function setCanvas(){
    canvas=document.getElementById("screen");
    ctx=canvas.getContext("2d");
}

function load(path,name){
    path="filesys/"+path+"/"+name+"/";
    console.log(path+name+".json")
    fetch(path+name+".json")
    .then(response => response.json())
    .then(data => {
        ann=data;

        for(var im of Object.keys(ann.images)){
            ann.images[im].data=new Image();
            ann.images[im].data.src=path+im;
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


    })
    .then(data =>{
        changeEvent(Object.keys(ann.events)[0]);
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
	ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        console.log(fr);
		if("filename" in frm){
			var img=ann.images[frm.filename]
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
	}else{
		end=1;
	}
    return end;
}

function changeEvent(ev){
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

function saveGif(){}
function saveSequence(){}
function saveAnn(){}
function saveFiles(){}

