import type { SceneModel } from '../../../src'

// Linux (0.7): REAL transcripts, captured from Debian 13 and Rocky Linux 10.2 VMs through an
// 80-column virtual terminal (linux-web-server's spike) — so the wraps below are where a terminal
// wrapped, not where an author broke a line. String.raw keeps `ps`'s `\_` tree marks.

const DEBIAN = String.raw`
  ana@web-01:~$ cat /etc/os-release | head -4
  PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
  NAME="Debian GNU/Linux"
  VERSION_ID="13"
  VERSION="13 (trixie)"
  ana@web-01:~$ uname -r
  6.12.113+deb13-cloud-amd64
  ana@web-01:~$ ls -l /etc/nginx
  ls: cannot access '/etc/nginx': No such file or directory
  ana@web-01:~$ ps -ef --forest | tail -4
  ana          861     853  2 09:01 ?        00:00:00      \_ sshd-session: ana@pt
  s/0
  ana          862     861 10 09:01 pts/0    00:00:00          \_ -bash
  ana          880     862 99 09:01 pts/0    00:00:00              \_ ps -ef --for
  est
  ana@web-01:~$ sudo certbot --nginx -d ana.example --server https://acme.gw:14000
  /dir -m ana@ana.example --agree-tos -n
  Saving debug log to /var/log/letsencrypt/letsencrypt.log
  Account registered.
  Requesting a certificate for ana.example

  Successfully received certificate.
  Certificate is saved at: /etc/letsencrypt/live/ana.example/fullchain.pem
  ana@web-01:~$
`

// Red Hat's prompt is bracketed. The semanage line wraps INSIDE a quoted string: the string keeps its
// colour across the wrap because the command is tokenized whole, then cut back into rows.
const ROCKY = String.raw`
  [ana@web-02 ~]$ ls -ldZ /srv/ana.example /srv/ana.example/index.html
  drwxr-xr-x. 2 root root unconfined_u:object_r:var_t:s0 24 Nov  2 09:07 /srv/ana.
  example
  -rw-r--r--. 1 root root unconfined_u:object_r:var_t:s0  6 Nov  2 09:07 /srv/ana.
  example/index.html
  [ana@web-02 ~]$ curl -s localhost | head -3
  <html>
  <head><title>403 Forbidden</title></head>
  <body>
  [ana@web-02 ~]$ sudo semanage fcontext -a -t httpd_sys_content_t "/srv/ana.examp
  le(/.*)?"; sudo restorecon -Rv /srv/ana.example
  Relabeled /srv/ana.example from unconfined_u:object_r:var_t:s0 to unconfined_u:o
  bject_r:httpd_sys_content_t:s0
  [ana@web-02 ~]$ curl -s localhost
  hello
  [ana@web-02 ~]$
`

// WRITTEN, not captured: the prompt shapes are real, the `id` lines are what Debian prints for these
// users. linux-web-server's recorder replaces this with a capture.
const ROOT = String.raw`
  ana@web-01:~$ sudo -i
  root@web-01:~# id
  uid=0(root) gid=0(root) groups=0(root)
  root@web-01:~# exit
  logout
  ana@web-01:~$ id
  uid=1000(ana) gid=1000(ana) groups=1000(ana),27(sudo),100(users)
  ana@web-01:~$
`

// top under TCG, captured by pyte (the first 18 rows). The ATTRIBUTES are not captured yet: row 6, the
// column header, is set inverse the way top draws it, and the bold run is only there to exercise `bold`.
const TOP = [
  'top - 09:01:47 up 1 min,  1 user,  load average: 1.81, 0.87, 0.33',
  'Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie',
  '%Cpu(s):  0.5 us,  0.2 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st',
  'MiB Mem :   1972.7 total,   1748.9 free,    237.1 used,    120.8 buff/cache',
  'MiB Swap:      0.0 total,      0.0 free,      0.0 used.   1735.6 avail Mem',
  '',
  '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
  '    900 ana       20   0    7904   5644   3456 R   3.8   0.3   0:00.38 top',
  '     10 root      20   0       0      0      0 I   1.0   0.0   0:00.06 kworker+',
  '      1 root      20   0   23472  14160  10700 S   0.0   0.7   0:14.53 systemd',
  '      2 root      20   0       0      0      0 S   0.0   0.0   0:00.11 kthreadd',
  '      3 root      20   0       0      0      0 S   0.0   0.0   0:00.00 pool_wo+',
  '      4 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker+',
  '      5 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker+',
  '      6 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker+',
  '      7 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker+',
  '      8 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker+',
  '      9 root      20   0       0      0      0 I   0.0   0.0   0:00.04 kworker+',
]

export const LINUX_FIXTURES: Record<string, SceneModel> = {
  'code-console': {
    title: 'console: a real Debian transcript — wrapped output, a wrapped command, an error line',
    nodes: [{ type: 'code', id: 'con', console: true, filename: 'ana@web-01: ~', code: DEBIAN, highlight: [16, 17] }],
  },
  'code-console-redhat': {
    title: "console: Red Hat's bracketed prompt; a wrap inside a quoted string",
    nodes: [{ type: 'code', id: 'con', console: true, filename: 'ana@web-02: ~', code: ROCKY }],
  },
  'code-console-root': {
    title: "console: root's prompt (#) is drawn as a warning",
    nodes: [{ type: 'code', id: 'con', console: true, filename: 'ana@web-01: ~', code: ROOT }],
  },
  'code-console-fold': {
    title: 'console + show: the certbot run folded to the command and its result',
    nodes: [{ type: 'code', id: 'con', console: true, filename: 'ana@web-01: ~', code: DEBIAN, show: [[16, 17], [21, 23]] }],
  },
  'code-tty-top': {
    title: 'tty: a full-screen program, cols × rows fixed, inverse video as top draws it',
    nodes: [{ type: 'tty', id: 'top', title: 'top — web-01', screen: TOP, inverse: [[6, 0, 80]], bold: [[0, 0, 3]] }],
  },
  'code-ini': {
    title: "lang 'ini': a systemd unit — [Section], Key=, value, comment",
    nodes: [{ type: 'code', id: 'unit', lang: 'ini', filename: '/etc/systemd/system/report.service', code: `
      # The nightly report: run by report.timer, never on its own.
      [Unit]
      Description=Nightly report of ana.example's visits
      After=network-online.target
      Wants=network-online.target

      [Service]
      Type=oneshot
      User=deploy
      ExecStart=/usr/local/bin/nightly-report /var/log/nginx/access.log
    ` }],
  },
  'code-nginx': {
    title: "lang 'nginx': a server block — directives are keywords only here",
    nodes: [{ type: 'code', id: 'site', lang: 'nginx', filename: '/etc/nginx/sites-available/ana.example', code: `
      server {
          listen 80;
          listen [::]:80;
          server_name ana.example;

          root /var/www/ana.example;
          index index.html;

          # A missing page is a 404, never a directory listing.
          location / {
              try_files $uri $uri/ =404;
          }
      }
    ` }],
  },
  'code-nft': {
    title: "lang 'nft': a default-deny ruleset",
    nodes: [{ type: 'code', id: 'fw', lang: 'nft', filename: '/etc/nftables.conf', code: `
      #!/usr/sbin/nft -f
      flush ruleset

      table inet filter {
          chain input {
              type filter hook input priority 0; policy drop;
              ct state established,related accept
              iif "lo" accept
              tcp dport { 22, 80, 443 } accept
              icmp type echo-request accept
          }
      }
    ` }],
  },
}
