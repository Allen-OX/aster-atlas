"""Loopback-only workspace state service. Public atlas assets remain public."""
import argparse, hashlib, hmac, http.cookies, json, math, mimetypes, os, secrets, sqlite3, time
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parent
# Generated from the public graph; loaded before a test or host changes the static root.
VIEW_SCOPES=json.loads((ROOT/'universe-scopes.json').read_text(encoding='utf-8'))
UNIVERSES={'conditions','genes','phenotypes','studies','community'}
ROLES={'none':0,'viewer':1,'editor':2,'owner':3}
MAX_BODY=65536
class AppServer(ThreadingHTTPServer):
    daemon_threads=True
    def __init__(self,address,state):
        self.state=Path(state);self.state.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.dbpath=self.state/'workspace.sqlite3';self.login_attempts={}
        with self.db() as db:
            db.executescript('''CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE,salt TEXT,password TEXT,is_owner INTEGER);
            CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,csrf TEXT,expires REAL);
            CREATE TABLE IF NOT EXISTS access(user_id TEXT,universe TEXT,role TEXT,PRIMARY KEY(user_id,universe));
            CREATE TABLE IF NOT EXISTS views(id TEXT PRIMARY KEY,user_id TEXT,universe TEXT,name TEXT,payload TEXT,created REAL);
            CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,universe TEXT,user_id TEXT,action TEXT,created REAL);''')
        os.chmod(self.dbpath,0o600)
        super().__init__(address,Handler)
    @contextmanager
    def db(self):
        db=sqlite3.connect(self.dbpath,timeout=10);db.row_factory=sqlite3.Row
        try:
            with db: yield db
        finally: db.close()

def digest(password,salt):
    return hashlib.scrypt(password.encode(),salt=bytes.fromhex(salt),n=16384,r=8,p=1).hex()
def valid_view(value):
    """Validate the same bounded, graph-scoped schema as validateSavedView in JS."""
    if type(value) is not dict:return False
    limits=VIEW_SCOPES['limits']
    try:
        if len(json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf-8'))>limits['maxBytes']:return False
    except (TypeError,ValueError,OverflowError,RecursionError,UnicodeError):return False
    permitted={'version','universeId','name','selectedNodeId','selectedEdgeId','filters','positions','visibleIds','routeEdgeIds','camera','paused','flowPaused','flowDirection','dragMode','layers','layerIds','exploded','animationRate','edgeFlows','objectExplosions','isolatedNodeId'}
    if not set(value)<=permitted:return False
    def number(x,low,high):
        return type(x) in (int,float) and low<=x<=high and math.isfinite(x)
    def text_within(x,cap):
        # JS string.length counts UTF-16 code units, including astral characters twice.
        return type(x) is str and len(x.encode('utf-16-le',errors='surrogatepass'))//2<=cap
    def member(x,allowed):return type(x) is str and x in allowed
    def vector(x):
        return type(x) is list and len(x)==3 and all(number(n,-limits['maxCoordinate'],limits['maxCoordinate']) for n in x)
    def id_list(x,allowed,cap):
        return type(x) is list and len(x)<=cap and all(member(i,allowed) for i in x) and len(set(x))==len(x)
    if not number(value.get('version'),1,1):return False
    universe=value.get('universeId')
    if not member(universe,VIEW_SCOPES['universes']):return False
    scope=VIEW_SCOPES['universes'][universe]
    if 'name' in value and not text_within(value['name'],limits['maxNameLength']):return False
    for key,ids in [('selectedNodeId',scope['nodeIds']),('selectedEdgeId',scope['edgeIds']),('isolatedNodeId',scope['nodeIds'])]:
        if key in value and value[key] is not None and not member(value[key],ids):return False
    if 'positions' in value:
        positions=value['positions']
        if type(positions) is not dict or len(positions)>limits['maxNodes']:return False
        if any(not member(i,scope['nodeIds']) or not vector(p) for i,p in positions.items()):return False
    if 'objectExplosions' in value:
        expansions=value['objectExplosions']
        if type(expansions) is not dict or len(expansions)>limits['maxNodes']:return False
        if any(not member(i,scope['nodeIds']) or not number(amount,0,1) for i,amount in expansions.items()):return False
    if 'edgeFlows' in value:
        flows=value['edgeFlows']
        if type(flows) is not dict or len(flows)>limits['maxEdges']:return False
        for edge_id,flow in flows.items():
            if not member(edge_id,scope['edgeIds']) or type(flow) is not dict or set(flow)!={'paused','direction'}:return False
            if type(flow['paused']) is not bool or not (number(flow['direction'],-1,1) and flow['direction'] in (-1,1)):return False
    if 'camera' in value:
        camera=value['camera']
        if type(camera) is not dict or set(camera)!={'position','target'} or not vector(camera['position']) or not vector(camera['target']):return False
    for key,ids,cap in [('visibleIds',scope['nodeIds'],limits['maxNodes']),('routeEdgeIds',scope['edgeIds'],limits['maxEdges']),('layerIds',VIEW_SCOPES['layerIds'],len(VIEW_SCOPES['layerIds']))]:
        if key in value and not id_list(value[key],ids,cap):return False
    for key in ['paused','flowPaused','dragMode','exploded']:
        if key in value and type(value[key]) is not bool:return False
    if 'flowDirection' in value and not (number(value['flowDirection'],-1,1) and value['flowDirection'] in (-1,1)):return False
    if 'layers' in value and not (number(value['layers'],1,4) and int(value['layers'])==value['layers']):return False
    if 'animationRate' in value and not number(value['animationRate'],.25,2):return False
    if 'filters' in value:
        filters=value['filters']
        if type(filters) is not dict or not set(filters)<={'query','type','source','strength'}:return False
        if 'query' in filters and not text_within(filters['query'],limits['maxQueryLength']):return False
        for key,ids in [('type',scope['types']),('source',scope['sourceIds']),('strength',scope['strengths'])]:
            if key in filters and not member(filters[key],['all',*ids]):return False
    return True

class Handler(SimpleHTTPRequestHandler):
    server_version='AsterLocal/1'
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,fmt,*args):pass
    def end_headers(self):
        if not urlsplit(self.path).path.startswith('/api/'):
            self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','same-origin');self.send_header('X-Frame-Options','DENY');super().end_headers()
    def safe_host(self):
        host=self.headers.get('Host','');return host in {f'localhost:{self.server.server_port}',f'127.0.0.1:{self.server.server_port}'}
    def reply(self,status,data,cookie=None):
        raw=json.dumps(data,allow_nan=False).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(raw)))
        if cookie:self.send_header('Set-Cookie',cookie)
        self.end_headers();self.wfile.write(raw)
    def session(self,db):
        cookies=http.cookies.SimpleCookie()
        try:cookies.load(self.headers.get('Cookie',''))
        except http.cookies.CookieError:return None
        token=cookies.get('aster_session');token=token.value if token else ''
        return db.execute('SELECT s.*,u.username,u.is_owner FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=? AND expires>?',(hashlib.sha256(token.encode()).hexdigest(),time.time())).fetchone()
    def role(self,db,session,universe):
        if not session:return 'none'
        if session['is_owner']:return 'owner'
        row=db.execute('SELECT role FROM access WHERE user_id=? AND universe=?',(session['user_id'],universe)).fetchone()
        return row['role'] if row else 'none'
    def body(self):
        try:length=int(self.headers.get('Content-Length','0'))
        except ValueError:raise ValueError('Invalid body size')
        if length<1 or length>MAX_BODY:raise ValueError('Request must be 1–65536 bytes')
        if self.headers.get_content_type()!='application/json':raise ValueError('JSON required')
        value=json.loads(self.rfile.read(length),parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Finite JSON required')))
        if not isinstance(value,dict):raise ValueError('JSON object required')
        return value
    def new_session(self,db,user):
        token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(24)
        db.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
        db.execute('INSERT INTO sessions VALUES(?,?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),user['id'],csrf,time.time()+43200))
        return {'username':user['username'],'csrf':csrf,'isOwner':bool(user['is_owner'])},f'aster_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200'
    def do_GET(self):
        if not self.safe_host():return self.reply(403,{'error':'Loopback host required'})
        path=urlsplit(self.path).path
        if path.startswith('/api/'):
            with self.server.db() as db:
                session=self.session(db)
                if path=='/api/session':return self.reply(200,{'bootstrapRequired':db.execute('SELECT count(*) FROM users').fetchone()[0]==0,'user':None if not session else {'username':session['username'],'isOwner':bool(session['is_owner']),'csrf':session['csrf']},'permissions':{u:self.role(db,session,u) for u in sorted(UNIVERSES)}})
                if not session:return self.reply(401,{'error':'Sign in to access saved workspace state'})
                if path=='/api/users':
                    if not session['is_owner']:return self.reply(403,{'error':'Owner required'})
                    rows=db.execute('SELECT id,username,is_owner FROM users ORDER BY username').fetchall()
                    return self.reply(200,{'users':[{'id':r['id'],'username':r['username'],'owner':bool(r['is_owner']),'permissions':{a['universe']:a['role'] for a in db.execute('SELECT universe,role FROM access WHERE user_id=?',(r['id'],))}} for r in rows]})
                parts=path.strip('/').split('/')
                if len(parts)==4 and parts[:2]==['api','universes'] and parts[2] in UNIVERSES:
                    universe=parts[2]
                    if ROLES[self.role(db,session,universe)]<1:return self.reply(403,{'error':'Access to this workspace is not granted'})
                    if parts[3]=='views':return self.reply(200,{'views':[{'id':r['id'],'name':r['name'],'created':r['created'],'view':json.loads(r['payload'])} for r in db.execute('SELECT * FROM views WHERE universe=? AND user_id=? ORDER BY created DESC',(universe,session['user_id']))]})
                    if parts[3]=='events':return self.reply(200,{'events':[dict(r) for r in db.execute('SELECT action,created FROM events WHERE universe=? AND user_id=? ORDER BY created DESC LIMIT 50',(universe,session['user_id']))]})
                return self.reply(404,{'error':'Unknown API endpoint'})
        decoded=unquote(path)
        file=(ROOT/decoded.lstrip('/')).resolve()
        allowed_suffix={'.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.geojson','.json','.woff2'}
        if decoded=='/':file=ROOT/'index.html'
        if ROOT not in file.parents or any(p.startswith('.') for p in file.relative_to(ROOT).parts) or file.suffix.lower() not in allowed_suffix or not file.is_file():return self.reply(404,{'error':'Not found'})
        # State cannot be served even when a custom directory lives inside this tree.
        if self.server.state.resolve() in [file,*file.parents]:return self.reply(404,{'error':'Not found'})
        return super().do_GET()
    def do_HEAD(self):
        # Avoid bypassing the static allowlist through SimpleHTTPRequestHandler.
        self.send_response(405);self.end_headers()
    def do_POST(self):self.mutate('POST')
    def do_DELETE(self):self.mutate('DELETE')
    def mutate(self,method):
        if not self.safe_host() or self.headers.get('Origin')!=f'http://{self.headers.get("Host")}':return self.reply(403,{'error':'Same-origin loopback request required'})
        try:
            body=self.body();path=urlsplit(self.path).path
            with self.server.db() as db:
                if path in ['/api/bootstrap','/api/login'] and method=='POST':
                    username=body.get('username','');password=body.get('password','')
                    if not isinstance(username,str) or not isinstance(password,str) or not 3<=len(username)<=64 or not 12<=len(password)<=256: return self.reply(400,{'error':'Use a 3–64 character username and a password of 12–256 characters'})
                    attempts=[t for t in self.server.login_attempts.get(self.client_address[0],[]) if t>time.time()-60]
                    if len(attempts)>=8:return self.reply(429,{'error':'Too many attempts; wait one minute'})
                    attempts.append(time.time());self.server.login_attempts[self.client_address[0]]=attempts
                    if path=='/api/bootstrap':
                        db.execute('BEGIN IMMEDIATE')
                        if db.execute('SELECT count(*) FROM users').fetchone()[0]:return self.reply(409,{'error':'Owner already configured'})
                        salt=secrets.token_hex(16);uid=secrets.token_hex(12);db.execute('INSERT INTO users VALUES(?,?,?,?,1)',(uid,username,salt,digest(password,salt)))
                    user=db.execute('SELECT * FROM users WHERE username=?',(username,)).fetchone()
                    if not user or not hmac.compare_digest(user['password'],digest(password,user['salt'])):return self.reply(401,{'error':'Invalid sign-in'})
                    result,cookie=self.new_session(db,user);db.commit();return self.reply(200,result,cookie)
                session=self.session(db)
                if not session:return self.reply(401,{'error':'Sign in required'})
                if not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),session['csrf']):return self.reply(403,{'error':'Invalid request token'})
                if path=='/api/logout':db.execute('DELETE FROM sessions WHERE token=?',(session['token'],));db.commit();return self.reply(200,{'ok':True},'aster_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
                if path=='/api/users' and method=='POST':
                    if not session['is_owner']:return self.reply(403,{'error':'Owner required'})
                    username,password=body.get('username',''),body.get('password','')
                    if not isinstance(username,str) or not isinstance(password,str) or not 3<=len(username)<=64 or not 12<=len(password)<=256:return self.reply(400,{'error':'Username 3–64 characters; password 12–256 characters'})
                    salt=secrets.token_hex(16);uid=secrets.token_hex(12)
                    db.execute('INSERT INTO users VALUES(?,?,?,?,0)',(uid,username,salt,digest(password,salt)));db.commit();return self.reply(201,{'id':uid})
                if path=='/api/access' and method=='POST':
                    if not session['is_owner']:return self.reply(403,{'error':'Owner required'})
                    uid,universe,role=body.get('userId'),body.get('universe'),body.get('role')
                    if universe not in UNIVERSES or role not in {'none','viewer','editor'} or not db.execute('SELECT 1 FROM users WHERE id=?',(uid,)).fetchone():return self.reply(400,{'error':'Invalid user, universe, or role'})
                    db.execute('INSERT OR REPLACE INTO access VALUES(?,?,?)',(uid,universe,role));db.commit();return self.reply(200,{'ok':True})
                parts=path.strip('/').split('/')
                if len(parts) in (4,5) and parts[:2]==['api','universes'] and parts[2] in UNIVERSES and parts[3]=='views':
                    universe=parts[2]
                    if ROLES[self.role(db,session,universe)]<2:return self.reply(403,{'error':'Editor access required'})
                    if method=='POST' and len(parts)==4:
                        name,view=body.get('name'),body.get('view')
                        if not isinstance(name,str) or not 1<=len(name.strip())<=80 or not valid_view(view) or view.get('universeId')!=universe:return self.reply(400,{'error':'Invalid saved view'})
                        if db.execute('SELECT count(*) FROM views WHERE user_id=? AND universe=?',(session['user_id'],universe)).fetchone()[0]>=100:return self.reply(409,{'error':'Limit of 100 saved views per universe reached'})
                        vid=secrets.token_hex(12);now=time.time();db.execute('INSERT INTO views VALUES(?,?,?,?,?,?)',(vid,session['user_id'],universe,name.strip(),json.dumps(view,allow_nan=False),now));db.execute('INSERT INTO events(universe,user_id,action,created) VALUES(?,?,?,?)',(universe,session['user_id'],'Saved view: '+name.strip(),now));db.commit();return self.reply(201,{'id':vid})
                    if method=='DELETE' and len(parts)==5:
                        result=db.execute('DELETE FROM views WHERE id=? AND universe=? AND user_id=?',(parts[4],universe,session['user_id']))
                        if not result.rowcount:return self.reply(404,{'error':'View not found'})
                        db.execute('INSERT INTO events(universe,user_id,action,created) VALUES(?,?,?,?)',(universe,session['user_id'],'Deleted a saved view',time.time()));db.commit();return self.reply(200,{'ok':True})
                return self.reply(404,{'error':'Unknown endpoint'})
        except (ValueError,TypeError,json.JSONDecodeError,RecursionError):return self.reply(400,{'error':'Invalid JSON or request values'})
        except sqlite3.IntegrityError:return self.reply(409,{'error':'That username already exists'})

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4173);parser.add_argument('--state',default=str(Path.home()/'Library'/'Application Support'/'Aster Atlas'/'workspace'));args=parser.parse_args()
    print(f'Aster Atlas workspace at http://localhost:{args.port}',flush=True)
    AppServer(('127.0.0.1',args.port),args.state).serve_forever()
