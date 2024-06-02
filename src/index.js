function loadScript(ev, src) {
  ev.preventDefault();

  // Hide select-version, show loader
  document.getElementById('select-version').style.display = 'none';
  document.getElementById('loading').style.display = 'block';

  // Load the requested script
  var s = document.createElement('script');
  s.setAttribute('src', src);
  document.head.appendChild(s);

  // Attemp to unlock Audio :(
  var audioCtx = new AudioContext();
  audioCtx.resume();
  return false;
};

var requestFullscreen = (ev) => {
  ev.preventDefault();
  document.getElementById('game').requestFullscreen();
};

document.getElementById('select-version').style.display = 'block';
document.getElementById('fullscreen').addEventListener('click', (ev) => requestFullscreen(ev, 'wipeout.js'))
document.getElementById('load-full-version').addEventListener('click', (ev) => loadScript(ev, 'wipeout.js'));
document.getElementById('load-minimal-version').addEventListener('click', (ev) => loadScript(ev, 'wipeout-minimal.js'));

var statusElement = document.getElementById('status');
var progressElement = document.getElementById('progress');
var spinnerElement = document.getElementById('spinner');

let onGameLoad = function() {
  document.getElementById('loading').style.display = 'none';
  window.scrollTo(0, 0);

  // Setup touch buttons if this is a touch device
  if ('ontouchstart' in window) {
    document.getElementById('head').style.display = 'none';
    document.body.classList.add('touch');
    let touchButtons = document.getElementsByClassName('button');
    for (let i = 0; i < touchButtons.length; i++) {
      let button = touchButtons[i];
      button.addEventListener('touchstart', (ev) => {
        Module._set_button(parseInt(ev.currentTarget.dataset.button), 1);
        ev.currentTarget.classList.add('active');
      });
      button.addEventListener('touchend', (ev) => {
        Module._set_button(parseInt(ev.currentTarget.dataset.button), 0);
        ev.currentTarget.classList.remove('active');
      });
    }
  }
};

globalThis.Module = {
  preRun: [],
  postRun: [],
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.log(text);
  },
  canvas: document.getElementById('canvas'),
  setStatus: (text) => {
    if (!Module.setStatus.last) {
      Module.setStatus.last = { time: Date.now(), text: '' };
    }
    if (text === Module.setStatus.last.text) {
      return;
    }
    var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
    var now = Date.now();
    if (m && now - Module.setStatus.last.time < 30) {
      return; // if this is a progress update, skip it if too soon
    }
    Module.setStatus.last.time = now;
    Module.setStatus.last.text = text;
    if (m) {
      text = m[1];
      progressElement.value = parseInt(m[2])*100;
      progressElement.max = parseInt(m[4])*100;
      progressElement.hidden = false;
      spinnerElement.hidden = false;
    } else {
      progressElement.value = null;
      progressElement.max = null;
      progressElement.hidden = true;
      if (!text) {
        spinnerElement.hidden = true;
        onGameLoad();
      }
    }
    statusElement.innerHTML = text;
  },
  totalDependencies: 0,
  monitorRunDependencies: (left) => {
    Module.totalDependencies = Math.max(Module.totalDependencies, left);
    Module.setStatus(left ? 'preparing... (' + (Module.totalDependencies-left) + '/' + Module.totalDependencies + ')' : 'all downloads complete.');
  }
};
Module.setStatus('downloading...');
window.onerror = () => {
  Module.setStatus('Exception thrown, see JavaScript console');
  document.getElementById('loading').style.display = 'block';
  spinnerElement.style.display = 'none';
  Module.setStatus = (text) => {
    if (text) {
      console.error('[post-exception status] ' + text);
    }
  };
};