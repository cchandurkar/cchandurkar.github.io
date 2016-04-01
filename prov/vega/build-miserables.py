import json

def run(fname, outfname):
    with open(fname, 'r') as f:
        d = json.load(f)

    nodes = {n["index"]: n for n in d["nodes"]}
    for n in nodes.values():
        n["count"] = 0
    for e in d["links"]:
        s = e["source"]
        t = e["target"]
        nodes[s]["count"] += 1
        nodes[t]["count"] += 1

    for i, n in enumerate(sorted(nodes.values(), key=lambda x: x["name"])):
        n["alpha"] = i

    for i, n in enumerate(sorted(nodes.values(), key=lambda x: x["count"])):
        n["frequency"] = i

    for i, n in enumerate(sorted(nodes.values(), key=lambda x: x["group"])):
        n["cluster"] = i
        
    with open(outfname, 'w') as f:
        json.dump(d, f)

if __name__ == '__main__':
    run("data/miserables.json", "data/miserables-orders.json")
        
            
    
