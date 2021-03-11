function createDir(node,path,p){
    var child;
    
    for(ch of node.children){
        if(ch.children.length>0 && ch.children[0].children[1].innerHTML==path[p]){
            child=ch;
        }
    }
    if(child==undefined){
        child = document.createElement("li");
        var dat = document.createElement("span");
        dat.addEventListener("click",expand);

        var caret = document.createElement("span");
        caret.classList.add("caret");

        var text = document.createElement("span");
        text.innerHTML = path[p];

        var ex = document.createElement("ul");
        ex.classList.add("nested");

        dat.appendChild(caret);
        dat.appendChild(text);
        child.appendChild(dat);
        child.appendChild(ex);
        node.appendChild(child);
    }
    
    if(path.length>p+1){
        return createDir(child.children[1],path,p+1);
    }else{
        return child.children[1];
    }
    
}

function addEntry(filepath,filename,rightpath){
    var path=filepath.split("/").filter(a=>a!='');
    var file=filename+".ann";
    var child=createDir(filesys,path,0);
    var fileNode = document.createElement("li");
    fileNode.innerHTML = file;
    if(rightpath==undefined)
        rightpath=filepath+"/"+filename;
    fileNode.dataset.path=rightpath;
    fileNode.addEventListener("click", function(){
        initAnn(this.dataset.path);
    });
    child.appendChild(fileNode);
}

function loadIndex(){

    fetch('index.json')
    .then(response => response.json())
    .then(data => {
        for(d of data){
            if(d.characters.length==0){
                addEntry("_Characters/_other",d.name,d.path+"/"+d.name);
            }else{
                for(character of d.characters){
                    addEntry("_Characters/"+character,d.name,d.path+"/"+d.name);
                }
            }
            addEntry(d.path,d.name);
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    
}

var filesys = document.createElement("ul");
loadIndex();
document.getElementById("filesys").appendChild(filesys);

var params = new URLSearchParams(window.location.search);

if(params.get("file")!=undefined) initAnn(params.get("file"));
if(params.get("event")!=undefined) eve=params.get("event");

function expand() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.children[0].classList.toggle("caret-down");
}