function createDir(node,path,p){
    var child;
    
    for(ch of node.children){
        if(ch.children.length>0 && ch.children[1].innerHTML==path[p]){
            child=ch;
        }
    }
    if(child==undefined){
        child = document.createElement("li");
        var caret = document.createElement("span");
        caret.classList.add("caret");
        caret.addEventListener("click",expand);
        var text = document.createElement("span");
        text.innerHTML = path[p];
        var ex = document.createElement("ul");
        ex.classList.add("nested");
        child.appendChild(caret);
        child.appendChild(text);
        child.appendChild(ex);
        node.appendChild(child);
    }
    if(path.length>p+1){
        return createDir(child.children[2],path,p+1);
    }else{
        return child.children[2];
    }
    
}

function addEntry(file){
    var path=file.path.split("/").filter(a=>a!='');
    var filename=file.name+".ann";
    var child=createDir(filesys,path,0);
    var fileNode = document.createElement("li");
    fileNode.innerHTML = filename;
    fileNode.dataset.path=file.path;
    fileNode.dataset.name=file.name;
    fileNode.addEventListener("click", function(){
        load(this.dataset.path,this.dataset.name);
    });
    child.appendChild(fileNode);
}

function loadIndex(){

    fetch('index.json')
    .then(response => response.json())
    .then(data => {
        for(d of data){
            addEntry(d);
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    
}

var filesys = document.createElement("ul");
loadIndex();
document.getElementById("filesys").appendChild(filesys);

function expand() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
}