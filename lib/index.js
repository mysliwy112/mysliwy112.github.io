//adds entry to directory tree:

//adds directory to directory tree: direcotory node / directory names in path / level in path
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
        dat.classList.add("clickable");

        var caret = document.createElement("span");
        caret.classList.add("caret");

        var text = document.createElement("span");
        text.innerHTML = path[p];
        // text.classList.add("clickable");

        var ex = document.createElement("ul");
        ex.classList.add("nested");
        // ex.classList.add("clickable");

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

//adds entry to directory tree: path to show in director tree / name of file / physical path to file - optional
function addEntry(filepath,filename,physicalpath){
    if(physicalpath==undefined)
        physicalpath=filepath+"/"+filename;

    var path=filepath.split("/").filter(a=>a!='');
    var file=filename+".ann";
    var child=createDir(filesys,path,0);
    var fileNode = document.createElement("li");
    fileNode.innerHTML = file;
    fileNode.dataset.path=physicalpath;
    fileNode.classList.add("clickable");
    fileNode.addEventListener("click", function(){
        initAnn(this.dataset.path);
    });
    child.appendChild(fileNode);
}


//Loads index.json entries into directory tree
function loadIndex(){

    fetch('index.json')
    .then(response => response.json())
    .then(data => {
        for(d of data){
            addEntry(d.path,d.name);
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    
}

//executed code starts here

var filesys = document.createElement("ul");
loadIndex();
document.getElementById("filesys").appendChild(filesys);

var params = new URLSearchParams(window.location.search);

if(params.get("file")!=undefined) initAnn(params.get("file"));
if(params.get("event")!=undefined) eve=params.get("event");

//function responsible for expanding node in directory tree
function expand() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.children[0].classList.toggle("caret-down");
}