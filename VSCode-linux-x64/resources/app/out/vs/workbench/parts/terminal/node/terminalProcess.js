/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
(function(){var e=["vs/workbench/parts/terminal/node/terminalProcess","require","exports","os","path","node-pty"];define(e[0],function(n){for(var s=[],t=0,o=n.length;t<o;t++)s[t]=e[n[t]];return s}([1,2,3,4,5]),function(e,n,s,t,o){"use strict";function r(){P&&clearTimeout(P),P=setTimeout(function(){Y.kill(),process.exit(l)},250)}function c(){process.send({type:"title",content:Y.process}),f=Y.process}Object.defineProperty(n,"__esModule",{value:!0});var i;i="win32"===s.platform()?t.basename(process.env.PTYSHELL):"xterm-256color";var p=process.env.PTYSHELL,a=function(){if(process.env.PTYSHELLCMDLINE)return process.env.PTYSHELLCMDLINE;for(var e=[],n=0;process.env["PTYSHELLARG"+n];)e.push(process.env["PTYSHELLARG"+n]),n++;return e}(),u=process.env.PTYCWD,v=process.env.PTYCOLS,L=process.env.PTYROWS,f="";!function(e){setInterval(function(){try{process.kill(e,0)}catch(e){process.exit()}},5e3)}(process.env.PTYPID),function(){for(["AMD_ENTRYPOINT","ELECTRON_RUN_AS_NODE","PTYCWD","PTYPID","PTYSHELL","PTYCOLS","PTYROWS","PTYSHELLCMDLINE"].forEach(function(e){process.env[e]&&delete process.env[e]});process.env.PTYSHELLARG0;)delete process.env.PTYSHELLARG0}();var T={name:i,cwd:u};v&&L&&(T.cols=parseInt(v,10),T.rows=parseInt(L,10));var P,l,Y=o.fork(p,a,T);Y.on("data",function(e){process.send({type:"data",content:e}),P&&(clearTimeout(P),r())}),Y.on("exit",function(e){l=e,r()}),process.on("message",function(e){"input"===e.event?Y.write(e.data):"resize"===e.event?Y.resize(Math.max(e.cols,1),Math.max(e.rows,1)):"shutdown"===e.event&&r()}),process.send({type:"pid",content:Y.pid}),c(),setInterval(function(){f!==Y.process&&c()},200)})}).call(this);
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/core/vs/workbench/parts/terminal/node/terminalProcess.js.map