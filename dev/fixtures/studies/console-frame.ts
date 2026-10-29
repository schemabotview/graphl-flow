import type { Code, Group, SceneModel, SceneNode, Tty } from '../../../src'

// Varies the FRAME for an OPERATED system (0.7, linux-web-server): no IDE — a real console on the
// left, the picture of what it just showed on the right. A full-screen program (`top`) takes the
// console's slot as a `tty` of the same size. Both columns are FIXED (`w`/`h`), so every frame lands
// on the same fit and a viewer always finds the console in the same place; `check` asserts it, like
// the IDE and notebook frames. No edges between the columns: `focus` rings a console line instead.
//
// The console holds 43 rows of 80 columns: 43 × 24px + 51 (bar, padding, borders) ≈ 1083, so H 1090;
// 80 × 9.0px + 30 padding + 2 borders = 752, so W 760; the picture takes the rest of a 16:9 frame.

export const CONSOLE = { w: 760, h: 1090, rows: 43 }
export const PICTURE_W = Math.round((CONSOLE.h * 16) / 9) - CONSOLE.w - 10

const consoleNode = (filename: string, code: string, rest: Partial<Code> = {}): Code => ({
  type: 'code', id: 'console', console: true, filename, code, w: CONSOLE.w, h: CONSOLE.h, fill: true, ...rest,
})

const picture = (children: SceneNode[]): Group => ({ type: 'group', id: 'picture', bare: true, w: PICTURE_W, h: CONSOLE.h, children })

const frame = (left: Code | Tty, right: SceneNode[], edges: SceneModel['edges'] = []): SceneModel => ({ dir: 'row', nodes: [left, picture(right)], edges })

const SESSION = String.raw`
  ana@laptop:~$ ssh web-01
  ana@web-01:~$ cat /etc/os-release | head -4
  PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
  NAME="Debian GNU/Linux"
  VERSION_ID="13"
  VERSION="13 (trixie)"
  ana@web-01:~$ uname -r
  6.12.113+deb13-cloud-amd64
  ana@web-01:~$
`

// ADAPTED from the spike's capture to the `mv` story (labels, 403 and relabel are the captured ones).
const SELINUX = String.raw`
  [ana@web-02 ~]$ ls -lZ /var/www/ana.example/index.html
  -rw-r--r--. 1 ana ana unconfined_u:object_r:user_home_t:s0 6 Nov  2 09:07 /var/ww
  w/ana.example/index.html
  [ana@web-02 ~]$ curl -s localhost | head -2
  <html>
  <head><title>403 Forbidden</title></head>
  [ana@web-02 ~]$ sudo restorecon -Rv /var/www/ana.example
  Relabeled /var/www/ana.example/index.html from unconfined_u:object_r:user_home_t
  :s0 to unconfined_u:object_r:httpd_sys_content_t:s0
  [ana@web-02 ~]$ curl -s localhost
  hello
  [ana@web-02 ~]$
`

const TOP: Tty = {
  type: 'tty', id: 'console', title: 'top — web-01', w: CONSOLE.w, h: CONSOLE.h, fill: true, inverse: [[6, 0, 80]], screen: [
    'top - 09:01:47 up 1 min,  1 user,  load average: 1.81, 0.87, 0.33',
    'Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie',
    '%Cpu(s):  0.5 us,  0.2 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st',
    'MiB Mem :   1972.7 total,   1748.9 free,    237.1 used,    120.8 buff/cache',
    'MiB Swap:      0.0 total,      0.0 free,      0.0 used.   1735.6 avail Mem',
    '',
    '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
    '    900 ana       20   0    7904   5644   3456 R   3.8   0.3   0:00.38 top',
    '      1 root      20   0   23472  14160  10700 S   0.0   0.7   0:14.53 systemd',
    '      2 root      20   0       0      0      0 S   0.0   0.0   0:00.11 kthreadd',
  ],
}

export const CONSOLE_FRAMES: Record<string, SceneModel> = {
  // The model beside the proof: what `uname` and `os-release` name, as layers.
  'con-frame': frame(consoleNode('ana@laptop: ~', SESSION), [
    { type: 'group', id: 'layers', title: 'One machine, two names', icon: 'linux', tone: 'ingest', children: [
      { type: 'item', id: 'distro', icon: 'debian', title: 'Debian 13 "trixie"', sub: 'the distribution: packages, defaults, the userland — os-release' },
      { type: 'item', id: 'kernel', icon: 'linux', title: 'Linux 6.12', sub: 'the kernel: processes, memory, files, network — uname -r', tone: 'infra' },
      { type: 'item', id: 'hw', icon: 'cpu', title: 'The machine', sub: 'a VM: 2 vCPU, 1.5 GiB', tone: 'neutral' },
    ] },
    { type: 'note', id: 'note', tone: 'ingest', text: 'Ubuntu and Rocky Linux run the same kernel family under a different userland.' },
  ], [{ from: 'distro', to: 'kernel', label: 'system calls' }, { from: 'kernel', to: 'hw' }]),

  // A family card's frame: the console on Rocky, the picture is SELinux's check, one path lit.
  'con-selinux': frame(consoleNode('ana@web-02: ~', SELINUX, { highlight: [2, 3] }), [
    { type: 'group', id: 'check', title: 'Two checks, both must pass', icon: 'shield', tone: 'consume', dir: 'row', children: [
      { type: 'item', id: 'dac', title: 'rwx', sub: 'other: r-- — allowed', icon: 'lock', tone: 'store', stack: true },
      { type: 'item', id: 'mac', title: 'SELinux', sub: 'httpd_t may not read user_home_t — denied', icon: 'redhat', stack: true },
    ] },
    { type: 'table', id: 'labels', title: 'The file’s label', tone: 'consume', fill: true, columns: ['moved with', 'label', 'nginx'], rows: [
      { id: 'mv', cells: ['mv from ~', 'user_home_t', '403'], tone: 'consume' },
      { id: 'rc', cells: ['restorecon', 'httpd_sys_content_t', '200'], tone: 'store' },
    ] },
  ], [{ from: 'dac', to: 'mac' }]),

  // A full-screen program takes the console's slot, at the console's size.
  'con-tty': frame(TOP, [
    { type: 'table', id: 'read', title: 'Reading top’s header', tone: 'ingest', fill: true, columns: ['line', 'says'], rows: [
      ['load average', 'runnable + waiting tasks, over 1 / 5 / 15 min'],
      ['%Cpu(s) id', 'idle: 99.3% of the time'],
      ['MiB Mem free', 'never used yet'],
      ['avail Mem', 'what a program could get: free + reclaimable'],
    ] },
    { type: 'note', id: 'note', tone: 'ingest', text: 'Load 1.81 on an idle CPU: the boot was still settling. Load is not CPU %.' },
  ]),

  // A file beside its picture: the server block, and the request it answers.
  'con-file': frame(consoleNode('ana@web-01: ~', SESSION), [
    { type: 'code', id: 'conf', lang: 'nginx', filename: '/etc/nginx/sites-available/ana.example', code: `
      server {
          listen 80;
          server_name ana.example;
          root /var/www/ana.example;
          index index.html;
      }
    `, highlight: [3, 4] },
    { type: 'group', id: 'req', title: 'GET / — Host: ana.example', icon: 'nginx', tone: 'serve', dir: 'row', children: [
      { type: 'item', id: 'match', title: 'server_name', sub: 'picks this block', stack: true },
      { type: 'item', id: 'root', title: 'root + index', sub: '/var/www/ana.example/index.html', icon: 'folder', stack: true },
      { type: 'item', id: 'file', title: '200', sub: 'the file’s bytes', icon: 'file', stack: true, tone: 'store' },
    ] },
  ], [{ from: 'match', to: 'root' }, { from: 'root', to: 'file' }]),
}
