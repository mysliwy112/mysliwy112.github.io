var ann;
var eve="";
var frame=0;
var playing=0;
var backward=0;
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

    if(elaps>frameTime){
        time=timestamp;
        if(changeFrame(frame+playing)){
            pause();
        }
    }

    if (playing!=0){
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
    var end=0;
    if(ann.events[eve].loop==0){
        if(ann.events[eve].frames.length<=fr){
            fr=ann.events[eve].frames.length-1;
            end=1
        }else if(fr<0){
            fr=0;
            end=1;
        }
    }else if(ann.events[eve].loop<fr){
        fr=fr-ann.events[eve].loop-1;
    }else if(fr<0){
        fr=ann.events[eve].loop+1+fr;
    }
    frame=fr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var frm=ann.events[eve].frames[frame];
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
    if(posX<0){
        posX=canvas.width/2+posX;
    }
    if(posY<0){
        posY=canvas.height/2+posY;
    }
    ctx.drawImage(img.data, posX, posY);
    return end;
}

function changeEvent(ev){
    eve=ev;
    f=document.getElementById("frames");
    var i=0;
    // for(;i<f.children&&i<ann.events[eve].frames.length;i++){
    //     f.children[i]=ann.images[ann.events[eve].frames[i].filename].data;
    // }
    // if(i<f.children[i]){
    while (f.firstChild) {
        f.removeChild(f.firstChild);
    }
        // for(i=0;i<f.children;i++)
        //     f.removeChild(f.children[i])
    // }else if(i<ann.events[eve].frames.length){
        for(i=0;i<ann.events[eve].frames.length;i++){
            f.appendChild(ann.images[ann.events[eve].frames[i].filename].data)
            f.lastElementChild.dataset.frame=i;
            f.lastElementChild.addEventListener("click",function(){changeFrame(this.dataset.frame)});
        }
    // }

    changeFrame(0);
}

function saveGif(){}
function saveSequence(){}
function saveAnn(){}
function saveFiles(){}

