"""HTTP authorization negatives against disposable loopback servers only."""
import concurrent.futures
import http.client
import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest

SPEC = importlib.util.spec_from_file_location('aster_universe_server', Path(__file__).with_name('universe-server.py'))
server_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(server_module)


class WorkspaceServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='aster-auth-test-')
        self.base = Path(self.temp.name)
        self.root = self.base / 'public'
        self.root.mkdir()
        (self.root / 'index.html').write_text('<!doctype html><title>Disposable fixture</title>')
        (self.root / 'usability.html').write_text('<!doctype html><title>Local usability fixture</title>')
        (self.root / '.private.json').write_text('{"private":true}')
        outside = self.base / 'outside.json'
        outside.write_text('{"outside":true}')
        (self.root / 'escape.json').symlink_to(outside)
        self.previous_root = server_module.ROOT
        server_module.ROOT = self.root.resolve()
        self.server = server_module.AppServer(('127.0.0.1', 0), self.root / 'saved-state')
        (self.server.state / 'private.json').write_text('{"workspace":"private"}')
        self.port = self.server.server_port
        self.origin = f'http://127.0.0.1:{self.port}'
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={'poll_interval': .01}, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        server_module.ROOT = self.previous_root
        self.temp.cleanup()

    def request(self, method, path, payload=None, session=None, headers=None, raw=None, csrf=True):
        body = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
        supplied = {'Host': f'127.0.0.1:{self.port}'}
        if method in ('POST', 'DELETE'):
            supplied.update({'Origin': self.origin, 'Content-Type': 'application/json'})
        if session:
            supplied['Cookie'] = session['cookie']
            if csrf:
                supplied['X-CSRF-Token'] = session['csrf']
        supplied.update(headers or {})
        connection = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        try:
            connection.request(method, path, body=body, headers=supplied)
            response = connection.getresponse()
            content = response.read()
            data = json.loads(content) if response.getheader('Content-Type', '').startswith('application/json') else content
            return response.status, data, dict(response.getheaders())
        finally:
            connection.close()

    def bootstrap(self, username='fixture-owner'):
        status, data, headers = self.request('POST', '/api/bootstrap', {'username': username, 'password': 'synthetic-password-2026'})
        self.assertEqual(status, 200)
        cookie = headers['Set-Cookie']
        self.assertIn('HttpOnly', cookie)
        self.assertIn('SameSite=Strict', cookie)
        return {'cookie': cookie.split(';')[0], 'csrf': data['csrf']}

    def account(self, owner, username, role=None, universe='conditions'):
        status, data, _ = self.request('POST', '/api/users', {'username': username, 'password': 'synthetic-password-2026'}, owner)
        self.assertEqual(status, 201)
        uid = data['id']
        if role:
            self.assertEqual(self.request('POST', '/api/access', {'userId': uid, 'universe': universe, 'role': role}, owner)[0], 200)
        status, data, headers = self.request('POST', '/api/login', {'username': username, 'password': 'synthetic-password-2026'})
        self.assertEqual(status, 200)
        return {'cookie': headers['Set-Cookie'].split(';')[0], 'csrf': data['csrf'], 'id': uid}

    def view(self, universe='conditions', **fields):
        return {'name': 'Disposable view', 'view': {'version': 1, 'universeId': universe, **fields}}

    def test_bootstrap_once_and_atomic_concurrent_ownership(self):
        self.assertTrue(self.request('GET', '/api/session')[1]['bootstrapRequired'])
        def attempt(index):
            return self.request('POST', '/api/bootstrap', {'username': f'concurrent-{index}', 'password': 'synthetic-password-2026'})[0]
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(attempt, [1, 2])), [200, 409])
        with self.server.db() as database:
            self.assertEqual(database.execute('SELECT count(*) FROM users WHERE is_owner=1').fetchone()[0], 1)
        self.assertEqual(attempt(3), 409)

    def test_anonymous_and_no_access_protected_routes(self):
        self.assertEqual(self.request('GET', '/')[0], 200)
        self.assertEqual(self.request('GET', '/api/universes/conditions/views')[0], 401)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view())[0], 401)
        owner = self.bootstrap()
        member = self.account(owner, 'no-access')
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=member)[0], 403)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view(), member)[0], 403)

    def test_viewer_read_editor_write_and_universe_isolation(self):
        owner = self.bootstrap()
        viewer = self.account(owner, 'fixture-viewer', 'viewer')
        editor = self.account(owner, 'fixture-editor', 'editor')
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=viewer)[0], 200)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view(), viewer)[0], 403)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view(), editor)[0], 201)
        self.assertEqual(self.request('GET', '/api/universes/genes/views', session=editor)[0], 403)
        self.assertEqual(self.request('POST', '/api/universes/genes/views', self.view('genes'), editor)[0], 403)
        self.assertEqual(self.request('POST', '/api/access', {'userId': editor['id'], 'universe': 'conditions', 'role': 'owner'}, editor)[0], 403)
        self.assertEqual(self.request('GET', '/api/users', session=editor)[0], 403)
        self.assertEqual(self.request('POST', '/api/access', {'userId': editor['id'], 'universe': 'conditions', 'role': 'owner'}, owner)[0], 400)
        self.assertEqual(self.request('GET', '/api/session', session=editor)[1]['permissions']['conditions'], 'editor')

    def test_saved_views_are_personal_and_delete_requires_ownership(self):
        owner = self.bootstrap()
        editor = self.account(owner, 'private-editor', 'editor')
        status, created, _ = self.request('POST', '/api/universes/conditions/views', self.view(), editor)
        self.assertEqual(status, 201)
        path = '/api/universes/conditions/views/' + created['id']
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=owner)[1]['views'], [])
        self.assertEqual(self.request('DELETE', path, {}, owner)[0], 404)
        self.assertEqual(len(self.request('GET', '/api/universes/conditions/views', session=editor)[1]['views']), 1)
        self.assertEqual(self.request('DELETE', path, {}, editor)[0], 200)
        self.assertEqual(self.request('DELETE', path, {}, editor)[0], 404)

    def test_csrf_origin_and_host_rejections(self):
        owner = self.bootstrap()
        path = '/api/universes/conditions/views'
        self.assertEqual(self.request('POST', path, self.view(), owner, csrf=False)[0], 403)
        self.assertEqual(self.request('POST', path, self.view(), owner, headers={'X-CSRF-Token': 'invalid'})[0], 403)
        for origin in ['https://example.invalid', 'null', '']:
            with self.subTest(origin=origin):
                self.assertEqual(self.request('POST', path, self.view(), owner, headers={'Origin': origin})[0], 403)
        self.assertEqual(self.request('GET', '/api/session', headers={'Host': 'example.invalid'})[0], 403)
        self.assertEqual(self.request('GET', '/', headers={'Host': 'example.invalid'})[0], 403)
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=owner)[1]['views'], [])

    def test_static_protected_paths_and_outside_symlink(self):
        self.assertEqual(self.request('GET', '/usability.html')[0], 200)
        for path in ['/.private.json', '/%2eprivate.json', '/saved-state/private.json', '/saved-state/workspace.sqlite3', '/escape.json', '/universe-server.py', '/%2e%2e/outside.json']:
            with self.subTest(path=path):
                self.assertEqual(self.request('GET', path)[0], 404)
        self.assertEqual(self.request('HEAD', '/saved-state/private.json')[0], 405)

    def test_revocation_expiry_and_logout_invalidate_access(self):
        owner = self.bootstrap()
        editor = self.account(owner, 'revoked-editor', 'editor')
        self.assertEqual(self.request('POST', '/api/access', {'userId': editor['id'], 'universe': 'conditions', 'role': 'none'}, owner)[0], 200)
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=editor)[0], 403)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view(), editor)[0], 403)
        self.assertEqual(self.request('POST', '/api/logout', {}, owner)[0], 200)
        self.assertEqual(self.request('GET', '/api/users', session=owner)[0], 401)
        with self.server.db() as database:
            database.execute('UPDATE sessions SET expires=0')
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=editor)[0], 401)

    def test_malformed_nonfinite_nonobject_and_oversized_bodies(self):
        owner = self.bootstrap()
        path = '/api/universes/conditions/views'
        for raw in [b'{', b'[]', b'{"x":NaN}', b'{"x":Infinity}', b'{}' + b' ' * 65536]:
            with self.subTest(length=len(raw), prefix=raw[:15]):
                self.assertEqual(self.request('POST', path, session=owner, raw=raw)[0], 400)
        self.assertEqual(self.request('POST', path, self.view(), owner, headers={'Content-Type': 'text/plain'})[0], 400)
        self.assertEqual(self.request('GET', path, session=owner)[1]['views'], [])

    def test_deep_json_is_rejected_without_disconnect(self):
        owner = self.bootstrap()
        raw = b'{"value":' + b'[' * 1100 + b'0' + b']' * 1100 + b'}'
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', session=owner, raw=raw)[0], 400)

    def test_saved_view_validation_is_server_authoritative(self):
        owner = self.bootstrap()
        invalid = [
            self.view(selectedNodeId='fabricated-entity'),
            self.view(positions={'frda': [101, 0, 0]}),
            self.view(positions={'fabricated-entity': [0, 0, 0]}),
            self.view(animationRate=99),
            self.view(flowDirection=0),
            self.view(filters={'source': 'fabricated-source'}),
            self.view(unknownField=True),
        ]
        for payload in invalid:
            with self.subTest(fields=list(payload['view'])):
                self.assertEqual(self.request('POST', '/api/universes/conditions/views', payload, owner)[0], 400)
        self.assertEqual(self.request('POST', '/api/universes/conditions/views', self.view('genes'), owner)[0], 400)
        self.assertEqual(self.request('GET', '/api/universes/conditions/views', session=owner)[1]['views'], [])


if __name__ == '__main__':
    unittest.main()
