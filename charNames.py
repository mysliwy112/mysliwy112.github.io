import json
eta=[]
dataPath="index.json"
with open(dataPath,"r") as database:
	meta=json.load(database)

for m in meta:
	m.pop("characters")

with open(dataPath,"w") as database:
	json.dump(meta,database,indent=2)