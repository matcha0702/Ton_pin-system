import os,re,time,json,urllib.request,urllib.parse,glob,hashlib,webbrowser
CONFIG=os.path.join(os.path.dirname(os.path.abspath(__file__)),'cloud-config.json')
MAPS={0:'Warehouse',1:'Sewers',2:'Construct',3:'Neon Towers (Purple)',4:'Innyume',5:'Secret',6:'Backrooms',7:'The Fishbowl',8:'Forest',9:'Experimentation',10:'Playplace',11:'Sanctum',12:'Sea Base',13:'Astral',14:'Pizzeria',15:'Isolation',16:'Hell',17:'Schoolhouse',18:'Ancient',19:'Throne',20:'Neon Towers (Green)',21:'Car Park',22:'Blackspace',23:'Museum',24:'Inner Tower',25:'Pools',26:'TBH',27:'Development',28:'Hotel',29:'Elevator',30:'Hole',31:'Iteration_0',32:'Scrapyard',33:'Robland',34:'Baseplate',35:'Challenge Cube',36:'Have',37:'Gardens',38:'Dust',39:'Dots',40:'Engine',41:'Orange',42:'The Wall',43:'Nexus',44:'Space Colony',45:'Altar',46:'Desktop',47:'SlashCo HQ',48:'Harvest',49:'Heaven',50:'Hightower',51:'Lounge',52:'Mall',53:'Skyscraper',54:'Nightlife',55:'Snowfield',56:'Gaol',57:'Mineshaft',58:'Chess',59:'Cheese Maze',60:'Wafflehouse',61:'Tunnels',62:'Subway',63:'Supply Route',64:'Vents',65:'Escape Route',66:'Garten',67:'Black Forest',68:'This Map Does Not Exist',69:'Luna Hills',70:'Park',71:'Hub',72:'Spaceless'}
round_pat=re.compile(r'This round is taking place at (.*?) \((\d+)\) and the round type is (.+?)\s*$')
join_pat=re.compile(r'\[Behaviour\] Joining (wrld_[^\s]+)')
def load_url():
    try:
        with open(CONFIG,'r',encoding='utf-8') as f:u=json.load(f).get('serverUrl','').strip().rstrip('/')
    except Exception:u=''
    if not u:
        print('\nRenderで発行された固定URLを貼り付けてください。例: https://ton-pin-map.onrender.com')
        u=input('URL: ').strip().rstrip('/')
        if not (u.startswith('https://') or u.startswith('http://')):u='https://'+u
        with open(CONFIG,'w',encoding='utf-8') as f:json.dump({'serverUrl':u},f,ensure_ascii=False,indent=2)
    return u
SERVER=load_url(); room=None; last_round=None
def room_key(location):return hashlib.sha256(('ton-pin-v1|'+location).encode()).hexdigest()[:40]
def post_round(mid,logged_name,round_type):
    if not room:return
    data=json.dumps({'mapId':mid,'mapName':MAPS.get(mid,logged_name),'roundType':round_type}).encode()
    url=f'{SERVER}/api/room/{room}/round';req=urllib.request.Request(url,data=data,headers={'Content-Type':'application/json'})
    urllib.request.urlopen(req,timeout=8).read()
def open_room():
    if room:webbrowser.open(f'{SERVER}/?room={urllib.parse.quote(room)}')
def latest_log():
    base=os.path.expandvars(r'%USERPROFILE%\AppData\LocalLow\VRChat\VRChat');fs=glob.glob(os.path.join(base,'output_log_*.txt'));return max(fs,key=os.path.getmtime) if fs else None
def scan_tail_for_context(path):
    global room,last_round
    try:
        with open(path,'r',encoding='utf-8',errors='ignore') as x:
            x.seek(0,2);size=x.tell();x.seek(max(0,size-1024*1024));lines=x.readlines()
        for line in lines:
            m=join_pat.search(line)
            if m:room=room_key(m.group(1))
            m=round_pat.search(line)
            if m:last_round=(int(m.group(2)),m.group(1),m.group(3))
    except Exception:pass
print('ToN Pin Tool Cloud watcher')
print('Server:',SERVER)
current=None;f=None
while True:
    try:
        p=latest_log()
        if p and p!=current:
            if f:f.close()
            current=p;room=None;last_round=None;scan_tail_for_context(p);f=open(p,'r',encoding='utf-8',errors='ignore');f.seek(0,2);print('Log:',p)
            if room:
                print('Instance room:',room[:10]+'…');open_room()
                if last_round:post_round(*last_round)
        if f:
            line=f.readline()
            if line:
                j=join_pat.search(line)
                if j:
                    new=room_key(j.group(1))
                    if new!=room:
                        room=new;last_round=None;print('Instance room:',room[:10]+'…');open_room()
                m=round_pat.search(line)
                if m:
                    last_round=(int(m.group(2)),m.group(1),m.group(3));print('Round:',last_round[0],MAPS.get(last_round[0],last_round[1]),last_round[2]);post_round(*last_round)
            else:time.sleep(.15)
        else:time.sleep(1)
    except Exception as e:print('watcher:',e);time.sleep(2)
