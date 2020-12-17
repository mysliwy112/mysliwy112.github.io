import subprocess as sub
import os
import json
import shutil
import sys

anndrzemPath=r"E:\AidemMedia\ANN-decoder\bin\Release\Anndrzem.exe"
inputPaths=[
	[r"E:\AidemMedia\ORIG\Reksio i Skarb Piratów ORIG","RiSP",{"Dane":"","Intro":"","MainMenu":""}],
	[r"E:\AidemMedia\ORIG\Reksio i Ufo","RiU",{"DANE":"","ReksioUfo":"","PRZYGODA":""}],
	[r"E:\AidemMedia\ORIG\Reksio i Czarodzieje O","RiC",{"common":"#common","dane":"","game":"","Przygoda":"","intro":"#intro"}],
	[r"E:\AidemMedia\ORIG\Reksio i Wehikuł Czasu ORIG","RiWC",{"common":"#common","Dane":"","Game":"","Przygoda":""}],
	["D:\\","RiKN",{"common":"#common","dane":"","game":"","przygoda":""}]
]
outputPath=r"E:\AidemMedia\ANNbrowser\filesys"

characters={"reksio":"reksio","kret":"kretes"}

dataPath=r"E:\AidemMedia\ANNbrowser\index.json"
meta=[]
with open(dataPath,"r") as database:
	try:
		pass
		#json.load(database)
	except json.decoder.JSONDecodeError:
		meta=[]
try:		
	for inP in inputPaths:

		for (dirpath, dirnames, filenames) in os.walk(inP[0]):
			out=dirpath.replace(inP[0]+"\\"*(not inP[0][-1]=="\\"),'')
			for i in inP[2]:
				out=out.replace(i,inP[2][i])
				out=out.replace('\\\\','\\')
			if len(out)>1 and out[0]=='\\':
				out=out[1:]
			for file in filenames:
				if ".ann" in file:
					sub.run([anndrzemPath,os.path.join(dirpath,file),"-d="+os.path.join(outputPath,inP[1],out,''),"-j","--full"])
					shutil.copyfile(os.path.join(dirpath,file),os.path.join(outputPath,inP[1],out,file.replace(".ann",''),file))
					info={}
					info["path"]=os.path.join(inP[1],out)
					info["characters"]=[characters[char]  for char in characters if char in file]
					info["name"]=file.replace(".ann",'')
					meta.append(info)
except:
	print(sys.exc_info())
with open(dataPath,"w") as database:
	json.dump(meta,database,indent=2)