(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.vg || (g.vg = {})).embed = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null),
    vg = (typeof window !== "undefined" ? window['vg'] : typeof global !== "undefined" ? global['vg'] : null),
    vl = (typeof window !== "undefined" ? window['vl'] : typeof global !== "undefined" ? global['vl'] : null),
    parameter = require('./parameter'),
    post = require('./post');

var config = {
  // URL for loading specs into editor
  editor_url: 'http://vega.github.io/vega-editor/',

  // HTML to inject within view source head element
  source_header: '',

  // HTML to inject before view source closing body tag
  source_footer: ''
};

var MODES = {
  'vega':      'vega',
  'vega-lite': 'vega-lite'
};

var PREPROCESSOR = {
  'vega':      function(vgjson) { return vgjson; },
  'vega-lite': function(vljson) { return vl.compile(vljson).spec; }
};

function load(url, arg, el, callback) {
  vg.util.load({url: url}, function(err, data) {
    if (err || !data) {
      console.error(err || ('No data found at ' + url));
    } else {
      // marshal embedding spec and restart
      var opt = !arg ? JSON.parse(data) : vg.util.extend({source: data}, arg);
      embed(el, opt, callback);
    }
  });
}

// Embed a Vega visualization component in a web page.
// el: DOM element in which to place component (DOM node or CSS selector)
// opt: Embedding specification (parsed JSON or URL string)
// callback: invoked with the generated Vega View instance
function embed(el, opt, callback) {
  var cb = callback || function(){},
      params = [], source, spec, mode;

  try {
    if (vg.util.isString(opt)) {
      return load(opt, null, el, callback);
    } else if (opt.source) {
      source = opt.source;
      spec = JSON.parse(source);
    } else if (opt.spec) {
      spec = opt.spec;
      source = JSON.stringify(spec, null, 2);
    } else if (opt.url) {
      return load(opt.url, opt, el, callback);
    } else {
      spec = opt;
      source = JSON.stringify(spec, null, 2);
      opt = {spec: spec, actions: false};
    }
    mode = MODES[opt.mode] || MODES.vega;
    spec = PREPROCESSOR[mode](spec);

    // ensure container div has class 'vega-embed'
    var div = d3.select(el)
      .classed('vega-embed', true)
      .html(''); // clear container

    // handle parameters
    if (opt.parameters) {
      var elp = opt.parameter_el ? d3.select(opt.parameter_el) : div;
      var pdiv = elp.append('div')
        .attr('class', 'vega-params');
      params = opt.parameters.map(function(p) {
        return parameter.init(pdiv, p, spec);
      });
    }
  } catch (err) { cb(err); }

  vg.parse.spec(spec, function(error, chart) {
    if (error) { cb(error); return; }
    try {
      var renderer = opt.renderer || 'canvas',
          actions  = opt.actions || {};

      var view = chart({
        el: el,
        data: opt.data || undefined,
        renderer: renderer
      });

      if (opt.actions !== false) {
        // add child div to house action links
        var ctrl = div.append('div')
          .attr('class', 'vega-actions');

        // add 'Export' action
        if (actions.export !== false) {
          var ext = (renderer==='canvas' ? 'png' : 'svg');
          ctrl.append('a')
            .text('Export as ' + ext.toUpperCase())
            .attr('href', '#')
            .attr('target', '_blank')
            .attr('download', (spec.name || 'vega') + '.' + ext)
            .on('mousedown', function() {
              this.href = view.toImageURL(ext);
              d3.event.preventDefault();
            });
        }

        // add 'View Source' action
        if (actions.source !== false) {
          ctrl.append('a')
            .text('View Source')
            .attr('href', '#')
            .on('click', function() {
              viewSource(source);
              d3.event.preventDefault();
            });
        }

        // add 'Open in Vega Editor' action
        if (actions.editor !== false) {
          ctrl.append('a')
            .text('Open in Vega Editor')
            .attr('href', '#')
            .on('click', function() {
              post(window, embed.config.editor_url, {spec: source, mode: mode});
              d3.event.preventDefault();
            });
        }
      }

      // bind all parameter elements
      params.forEach(function(p) { parameter.bind(p, view); });

      // initialize and return visualization
      view.update();
      cb(null, {view: view, spec: spec});
    } catch (err) { cb(err); }
  });
}

function viewSource(source) {
  var header = '<html><head>' + config.source_header + '</head>' + '<body><pre><code class="json">';
  var footer = '</code></pre>' + config.source_footer + '</body></html>';
  var win = window.open('');
  win.document.write(header + source + footer);
  win.document.title = 'Vega JSON Source';
}

// make config externally visible
embed.config = config;

module.exports = embed;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./parameter":2,"./post":3}],2:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null),
    $ = (typeof window !== "undefined" ? window['vg'] : typeof global !== "undefined" ? global['vg'] : null).util.mutator;

module.exports = {
  init: function(el, param, spec) {
    return (rewrite(param, spec), handle(el, param));
  },
  bind: function(param, view) {
    param.dom.forEach(function(el) { el.__vega__ = view; });
    view.onSignal(param.dom[0].name, function(k, v) { param.set(v); });
  }
};

// spec re-write

function rewrite(param, spec) {
  // add signal to top-level if not defined
  var sg = spec.signals || (spec.signals = []);
  for (var i=0; i<sg.length; ++i) {
    if (sg[i].name === param.signal) break;
  }
  if (i === sg.length) {
    sg.push({
      name: param.signal,
      init: param.value
    });
  }

  // replace values for re-write entries
  (param.rewrite || []).forEach(function(path) {
    $(path)(spec, {signal: param.signal});
  });
}

// HTML output handlers

function handle(el, param) {
  var p = el.append('div')
    .attr('class', 'vega-param');

  p.append('span')
    .attr('class', 'vega-param-name')
    .text(param.name || param.signal);

  var input = form;
  switch (param.type) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range; break;
  }

  return input(p, param);
}

function form(el, param) {
  var fm = el.append('input')
    .on('input', update);

  for (var key in param) {
    if (key === 'signal' || key === 'rewrite') continue;
    fm.attr(key, param[key]);
  }
  fm.attr('name', param.signal);

  var node = fm.node();
  return {
    dom: [node],
    set: function(value) { node.value = value; }
  };
}

function checkbox(el, param) {
  var cb = el.append('input')
    .on('change', function() { update.call(this, this.checked); })
    .attr('type', 'checkbox')
    .attr('name', param.signal)
    .attr('checked', param.value || null)
    .node();

  return {
    dom: [cb],
    set: function(value) { cb.checked = !!value || null; }
  };
}

function select(el, param) {
  var sl = el.append('select')
    .attr('name', param.signal)
    .on('change', function() {
      update.call(this, this.options[this.selectedIndex].__data__);
    });

  sl.selectAll('option')
    .data(param.options)
   .enter().append('option')
    .attr('value', vg.util.identity)
    .attr('selected', function(x) { return x === param.value || null; })
    .text(vg.util.identity);
  
  var node = sl.node();
  return {
    dom: [node],
    set: function(value) {
      var idx = param.options.indexOf(value);
      node.selectedIndex = idx;
    }
  };
}

function radio(el, param) {
  var rg = el.append('span')
    .attr('class', 'vega-param-radio');

  var nodes = param.options.map(function(option) {
    var id = 'vega-option-' + param.signal + '-' + option;

    var rb = rg.append('input')
      .datum(option)
      .on('change', update)
      .attr('id', id)
      .attr('type', 'radio')
      .attr('name', param.signal)
      .attr('value', option)
      .attr('checked', option === param.value || null);

    rg.append('label')
      .attr('for', id)
      .text(option);

    return rb.node();
  });

  return {
    dom: nodes,
    set: function(value) {
      for (var i=0; i<nodes.length; ++i) {
        if (nodes[i].value === value) {
          nodes[i].checked = true;
        }
      }
    }
  };
}

function range(el, param) {
  var val = param.value !== undefined ? param.value :
    ((+param.max) + (+param.min)) / 2;

  var rn = el.append('input')
    .on('input', function() {
      lbl.text(this.value);
      update.call(this, +this.value);
    })
    .attr('type', 'range')
    .attr('name', param.signal)
    .attr('value', val)
    .attr('min', param.min)
    .attr('max', param.max)
    .attr('step', param.step || vg.util.bins({
      min: param.min,
      max: param.max,
      maxbins: 100
    }).step);

  var lbl = el.append('label')
    .attr('class', 'vega-range')
    .text(val);

  var node = rn.node();
  return {
    dom: [node],
    set: function(value) {
      node.value = value;
      lbl.text(value);
    }
  };
}

function update(value) {
  if (value === undefined) value = this.__data__ || d3.event.target.value;
  this.__vega__.signal(this.name, value).update({'duration': 1000});
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
// open editor url in a new window, and pass a message
module.exports = function(window, url, data) {
  var editor = window.open(url),
      wait = 10000,
      step = 250,
      count = ~~(wait/step);

  function listen(evt) {
    if (evt.source === editor) {
      count = 0;
      window.removeEventListener('message', listen, false);
    }
  }
  window.addEventListener('message', listen, false);

  // send message
  // periodically resend until ack received or timeout
  function send() {
    if (count <= 0) return;
    editor.postMessage(data, '*');
    setTimeout(send, step);
    count -= 1;
  }
  setTimeout(send, step);
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZW1iZWQuanMiLCJzcmMvcGFyYW1ldGVyLmpzIiwic3JjL3Bvc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydkMyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZDMnXSA6IG51bGwpLFxuICAgIHZnID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ3ZnJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWyd2ZyddIDogbnVsbCksXG4gICAgdmwgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1sndmwnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ3ZsJ10gOiBudWxsKSxcbiAgICBwYXJhbWV0ZXIgPSByZXF1aXJlKCcuL3BhcmFtZXRlcicpLFxuICAgIHBvc3QgPSByZXF1aXJlKCcuL3Bvc3QnKTtcblxudmFyIGNvbmZpZyA9IHtcbiAgLy8gVVJMIGZvciBsb2FkaW5nIHNwZWNzIGludG8gZWRpdG9yXG4gIGVkaXRvcl91cmw6ICdodHRwOi8vdmVnYS5naXRodWIuaW8vdmVnYS1lZGl0b3IvJyxcblxuICAvLyBIVE1MIHRvIGluamVjdCB3aXRoaW4gdmlldyBzb3VyY2UgaGVhZCBlbGVtZW50XG4gIHNvdXJjZV9oZWFkZXI6ICcnLFxuXG4gIC8vIEhUTUwgdG8gaW5qZWN0IGJlZm9yZSB2aWV3IHNvdXJjZSBjbG9zaW5nIGJvZHkgdGFnXG4gIHNvdXJjZV9mb290ZXI6ICcnXG59O1xuXG52YXIgTU9ERVMgPSB7XG4gICd2ZWdhJzogICAgICAndmVnYScsXG4gICd2ZWdhLWxpdGUnOiAndmVnYS1saXRlJ1xufTtcblxudmFyIFBSRVBST0NFU1NPUiA9IHtcbiAgJ3ZlZ2EnOiAgICAgIGZ1bmN0aW9uKHZnanNvbikgeyByZXR1cm4gdmdqc29uOyB9LFxuICAndmVnYS1saXRlJzogZnVuY3Rpb24odmxqc29uKSB7IHJldHVybiB2bC5jb21waWxlKHZsanNvbikuc3BlYzsgfVxufTtcblxuZnVuY3Rpb24gbG9hZCh1cmwsIGFyZywgZWwsIGNhbGxiYWNrKSB7XG4gIHZnLnV0aWwubG9hZCh7dXJsOiB1cmx9LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBpZiAoZXJyIHx8ICFkYXRhKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVyciB8fCAoJ05vIGRhdGEgZm91bmQgYXQgJyArIHVybCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtYXJzaGFsIGVtYmVkZGluZyBzcGVjIGFuZCByZXN0YXJ0XG4gICAgICB2YXIgb3B0ID0gIWFyZyA/IEpTT04ucGFyc2UoZGF0YSkgOiB2Zy51dGlsLmV4dGVuZCh7c291cmNlOiBkYXRhfSwgYXJnKTtcbiAgICAgIGVtYmVkKGVsLCBvcHQsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBFbWJlZCBhIFZlZ2EgdmlzdWFsaXphdGlvbiBjb21wb25lbnQgaW4gYSB3ZWIgcGFnZS5cbi8vIGVsOiBET00gZWxlbWVudCBpbiB3aGljaCB0byBwbGFjZSBjb21wb25lbnQgKERPTSBub2RlIG9yIENTUyBzZWxlY3Rvcilcbi8vIG9wdDogRW1iZWRkaW5nIHNwZWNpZmljYXRpb24gKHBhcnNlZCBKU09OIG9yIFVSTCBzdHJpbmcpXG4vLyBjYWxsYmFjazogaW52b2tlZCB3aXRoIHRoZSBnZW5lcmF0ZWQgVmVnYSBWaWV3IGluc3RhbmNlXG5mdW5jdGlvbiBlbWJlZChlbCwgb3B0LCBjYWxsYmFjaykge1xuICB2YXIgY2IgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpe30sXG4gICAgICBwYXJhbXMgPSBbXSwgc291cmNlLCBzcGVjLCBtb2RlO1xuXG4gIHRyeSB7XG4gICAgaWYgKHZnLnV0aWwuaXNTdHJpbmcob3B0KSkge1xuICAgICAgcmV0dXJuIGxvYWQob3B0LCBudWxsLCBlbCwgY2FsbGJhY2spO1xuICAgIH0gZWxzZSBpZiAob3B0LnNvdXJjZSkge1xuICAgICAgc291cmNlID0gb3B0LnNvdXJjZTtcbiAgICAgIHNwZWMgPSBKU09OLnBhcnNlKHNvdXJjZSk7XG4gICAgfSBlbHNlIGlmIChvcHQuc3BlYykge1xuICAgICAgc3BlYyA9IG9wdC5zcGVjO1xuICAgICAgc291cmNlID0gSlNPTi5zdHJpbmdpZnkoc3BlYywgbnVsbCwgMik7XG4gICAgfSBlbHNlIGlmIChvcHQudXJsKSB7XG4gICAgICByZXR1cm4gbG9hZChvcHQudXJsLCBvcHQsIGVsLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwZWMgPSBvcHQ7XG4gICAgICBzb3VyY2UgPSBKU09OLnN0cmluZ2lmeShzcGVjLCBudWxsLCAyKTtcbiAgICAgIG9wdCA9IHtzcGVjOiBzcGVjLCBhY3Rpb25zOiBmYWxzZX07XG4gICAgfVxuICAgIG1vZGUgPSBNT0RFU1tvcHQubW9kZV0gfHwgTU9ERVMudmVnYTtcbiAgICBzcGVjID0gUFJFUFJPQ0VTU09SW21vZGVdKHNwZWMpO1xuXG4gICAgLy8gZW5zdXJlIGNvbnRhaW5lciBkaXYgaGFzIGNsYXNzICd2ZWdhLWVtYmVkJ1xuICAgIHZhciBkaXYgPSBkMy5zZWxlY3QoZWwpXG4gICAgICAuY2xhc3NlZCgndmVnYS1lbWJlZCcsIHRydWUpXG4gICAgICAuaHRtbCgnJyk7IC8vIGNsZWFyIGNvbnRhaW5lclxuXG4gICAgLy8gaGFuZGxlIHBhcmFtZXRlcnNcbiAgICBpZiAob3B0LnBhcmFtZXRlcnMpIHtcbiAgICAgIHZhciBlbHAgPSBvcHQucGFyYW1ldGVyX2VsID8gZDMuc2VsZWN0KG9wdC5wYXJhbWV0ZXJfZWwpIDogZGl2O1xuICAgICAgdmFyIHBkaXYgPSBlbHAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAndmVnYS1wYXJhbXMnKTtcbiAgICAgIHBhcmFtcyA9IG9wdC5wYXJhbWV0ZXJzLm1hcChmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiBwYXJhbWV0ZXIuaW5pdChwZGl2LCBwLCBzcGVjKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7IGNiKGVycik7IH1cblxuICB2Zy5wYXJzZS5zcGVjKHNwZWMsIGZ1bmN0aW9uKGVycm9yLCBjaGFydCkge1xuICAgIGlmIChlcnJvcikgeyBjYihlcnJvcik7IHJldHVybjsgfVxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVuZGVyZXIgPSBvcHQucmVuZGVyZXIgfHwgJ2NhbnZhcycsXG4gICAgICAgICAgYWN0aW9ucyAgPSBvcHQuYWN0aW9ucyB8fCB7fTtcblxuICAgICAgdmFyIHZpZXcgPSBjaGFydCh7XG4gICAgICAgIGVsOiBlbCxcbiAgICAgICAgZGF0YTogb3B0LmRhdGEgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZW5kZXJlcjogcmVuZGVyZXJcbiAgICAgIH0pO1xuXG4gICAgICBpZiAob3B0LmFjdGlvbnMgIT09IGZhbHNlKSB7XG4gICAgICAgIC8vIGFkZCBjaGlsZCBkaXYgdG8gaG91c2UgYWN0aW9uIGxpbmtzXG4gICAgICAgIHZhciBjdHJsID0gZGl2LmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAndmVnYS1hY3Rpb25zJyk7XG5cbiAgICAgICAgLy8gYWRkICdFeHBvcnQnIGFjdGlvblxuICAgICAgICBpZiAoYWN0aW9ucy5leHBvcnQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGV4dCA9IChyZW5kZXJlcj09PSdjYW52YXMnID8gJ3BuZycgOiAnc3ZnJyk7XG4gICAgICAgICAgY3RybC5hcHBlbmQoJ2EnKVxuICAgICAgICAgICAgLnRleHQoJ0V4cG9ydCBhcyAnICsgZXh0LnRvVXBwZXJDYXNlKCkpXG4gICAgICAgICAgICAuYXR0cignaHJlZicsICcjJylcbiAgICAgICAgICAgIC5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJylcbiAgICAgICAgICAgIC5hdHRyKCdkb3dubG9hZCcsIChzcGVjLm5hbWUgfHwgJ3ZlZ2EnKSArICcuJyArIGV4dClcbiAgICAgICAgICAgIC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRoaXMuaHJlZiA9IHZpZXcudG9JbWFnZVVSTChleHQpO1xuICAgICAgICAgICAgICBkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgJ1ZpZXcgU291cmNlJyBhY3Rpb25cbiAgICAgICAgaWYgKGFjdGlvbnMuc291cmNlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGN0cmwuYXBwZW5kKCdhJylcbiAgICAgICAgICAgIC50ZXh0KCdWaWV3IFNvdXJjZScpXG4gICAgICAgICAgICAuYXR0cignaHJlZicsICcjJylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmlld1NvdXJjZShzb3VyY2UpO1xuICAgICAgICAgICAgICBkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgJ09wZW4gaW4gVmVnYSBFZGl0b3InIGFjdGlvblxuICAgICAgICBpZiAoYWN0aW9ucy5lZGl0b3IgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY3RybC5hcHBlbmQoJ2EnKVxuICAgICAgICAgICAgLnRleHQoJ09wZW4gaW4gVmVnYSBFZGl0b3InKVxuICAgICAgICAgICAgLmF0dHIoJ2hyZWYnLCAnIycpXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHBvc3Qod2luZG93LCBlbWJlZC5jb25maWcuZWRpdG9yX3VybCwge3NwZWM6IHNvdXJjZSwgbW9kZTogbW9kZX0pO1xuICAgICAgICAgICAgICBkMy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gYmluZCBhbGwgcGFyYW1ldGVyIGVsZW1lbnRzXG4gICAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbihwKSB7IHBhcmFtZXRlci5iaW5kKHAsIHZpZXcpOyB9KTtcblxuICAgICAgLy8gaW5pdGlhbGl6ZSBhbmQgcmV0dXJuIHZpc3VhbGl6YXRpb25cbiAgICAgIHZpZXcudXBkYXRlKCk7XG4gICAgICBjYihudWxsLCB7dmlldzogdmlldywgc3BlYzogc3BlY30pO1xuICAgIH0gY2F0Y2ggKGVycikgeyBjYihlcnIpOyB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2aWV3U291cmNlKHNvdXJjZSkge1xuICB2YXIgaGVhZGVyID0gJzxodG1sPjxoZWFkPicgKyBjb25maWcuc291cmNlX2hlYWRlciArICc8L2hlYWQ+JyArICc8Ym9keT48cHJlPjxjb2RlIGNsYXNzPVwianNvblwiPic7XG4gIHZhciBmb290ZXIgPSAnPC9jb2RlPjwvcHJlPicgKyBjb25maWcuc291cmNlX2Zvb3RlciArICc8L2JvZHk+PC9odG1sPic7XG4gIHZhciB3aW4gPSB3aW5kb3cub3BlbignJyk7XG4gIHdpbi5kb2N1bWVudC53cml0ZShoZWFkZXIgKyBzb3VyY2UgKyBmb290ZXIpO1xuICB3aW4uZG9jdW1lbnQudGl0bGUgPSAnVmVnYSBKU09OIFNvdXJjZSc7XG59XG5cbi8vIG1ha2UgY29uZmlnIGV4dGVybmFsbHkgdmlzaWJsZVxuZW1iZWQuY29uZmlnID0gY29uZmlnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtYmVkO1xuIiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2QzJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydkMyddIDogbnVsbCksXG4gICAgJCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wyd2ZyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsndmcnXSA6IG51bGwpLnV0aWwubXV0YXRvcjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluaXQ6IGZ1bmN0aW9uKGVsLCBwYXJhbSwgc3BlYykge1xuICAgIHJldHVybiAocmV3cml0ZShwYXJhbSwgc3BlYyksIGhhbmRsZShlbCwgcGFyYW0pKTtcbiAgfSxcbiAgYmluZDogZnVuY3Rpb24ocGFyYW0sIHZpZXcpIHtcbiAgICBwYXJhbS5kb20uZm9yRWFjaChmdW5jdGlvbihlbCkgeyBlbC5fX3ZlZ2FfXyA9IHZpZXc7IH0pO1xuICAgIHZpZXcub25TaWduYWwocGFyYW0uZG9tWzBdLm5hbWUsIGZ1bmN0aW9uKGssIHYpIHsgcGFyYW0uc2V0KHYpOyB9KTtcbiAgfVxufTtcblxuLy8gc3BlYyByZS13cml0ZVxuXG5mdW5jdGlvbiByZXdyaXRlKHBhcmFtLCBzcGVjKSB7XG4gIC8vIGFkZCBzaWduYWwgdG8gdG9wLWxldmVsIGlmIG5vdCBkZWZpbmVkXG4gIHZhciBzZyA9IHNwZWMuc2lnbmFscyB8fCAoc3BlYy5zaWduYWxzID0gW10pO1xuICBmb3IgKHZhciBpPTA7IGk8c2cubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoc2dbaV0ubmFtZSA9PT0gcGFyYW0uc2lnbmFsKSBicmVhaztcbiAgfVxuICBpZiAoaSA9PT0gc2cubGVuZ3RoKSB7XG4gICAgc2cucHVzaCh7XG4gICAgICBuYW1lOiBwYXJhbS5zaWduYWwsXG4gICAgICBpbml0OiBwYXJhbS52YWx1ZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gcmVwbGFjZSB2YWx1ZXMgZm9yIHJlLXdyaXRlIGVudHJpZXNcbiAgKHBhcmFtLnJld3JpdGUgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuICAgICQocGF0aCkoc3BlYywge3NpZ25hbDogcGFyYW0uc2lnbmFsfSk7XG4gIH0pO1xufVxuXG4vLyBIVE1MIG91dHB1dCBoYW5kbGVyc1xuXG5mdW5jdGlvbiBoYW5kbGUoZWwsIHBhcmFtKSB7XG4gIHZhciBwID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdjbGFzcycsICd2ZWdhLXBhcmFtJyk7XG5cbiAgcC5hcHBlbmQoJ3NwYW4nKVxuICAgIC5hdHRyKCdjbGFzcycsICd2ZWdhLXBhcmFtLW5hbWUnKVxuICAgIC50ZXh0KHBhcmFtLm5hbWUgfHwgcGFyYW0uc2lnbmFsKTtcblxuICB2YXIgaW5wdXQgPSBmb3JtO1xuICBzd2l0Y2ggKHBhcmFtLnR5cGUpIHtcbiAgICBjYXNlICdjaGVja2JveCc6IGlucHV0ID0gY2hlY2tib3g7IGJyZWFrO1xuICAgIGNhc2UgJ3NlbGVjdCc6ICAgaW5wdXQgPSBzZWxlY3Q7IGJyZWFrO1xuICAgIGNhc2UgJ3JhZGlvJzogICAgaW5wdXQgPSByYWRpbzsgYnJlYWs7XG4gICAgY2FzZSAncmFuZ2UnOiAgICBpbnB1dCA9IHJhbmdlOyBicmVhaztcbiAgfVxuXG4gIHJldHVybiBpbnB1dChwLCBwYXJhbSk7XG59XG5cbmZ1bmN0aW9uIGZvcm0oZWwsIHBhcmFtKSB7XG4gIHZhciBmbSA9IGVsLmFwcGVuZCgnaW5wdXQnKVxuICAgIC5vbignaW5wdXQnLCB1cGRhdGUpO1xuXG4gIGZvciAodmFyIGtleSBpbiBwYXJhbSkge1xuICAgIGlmIChrZXkgPT09ICdzaWduYWwnIHx8IGtleSA9PT0gJ3Jld3JpdGUnKSBjb250aW51ZTtcbiAgICBmbS5hdHRyKGtleSwgcGFyYW1ba2V5XSk7XG4gIH1cbiAgZm0uYXR0cignbmFtZScsIHBhcmFtLnNpZ25hbCk7XG5cbiAgdmFyIG5vZGUgPSBmbS5ub2RlKCk7XG4gIHJldHVybiB7XG4gICAgZG9tOiBbbm9kZV0sXG4gICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkgeyBub2RlLnZhbHVlID0gdmFsdWU7IH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tib3goZWwsIHBhcmFtKSB7XG4gIHZhciBjYiA9IGVsLmFwcGVuZCgnaW5wdXQnKVxuICAgIC5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7IHVwZGF0ZS5jYWxsKHRoaXMsIHRoaXMuY2hlY2tlZCk7IH0pXG4gICAgLmF0dHIoJ3R5cGUnLCAnY2hlY2tib3gnKVxuICAgIC5hdHRyKCduYW1lJywgcGFyYW0uc2lnbmFsKVxuICAgIC5hdHRyKCdjaGVja2VkJywgcGFyYW0udmFsdWUgfHwgbnVsbClcbiAgICAubm9kZSgpO1xuXG4gIHJldHVybiB7XG4gICAgZG9tOiBbY2JdLFxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHsgY2IuY2hlY2tlZCA9ICEhdmFsdWUgfHwgbnVsbDsgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBzZWxlY3QoZWwsIHBhcmFtKSB7XG4gIHZhciBzbCA9IGVsLmFwcGVuZCgnc2VsZWN0JylcbiAgICAuYXR0cignbmFtZScsIHBhcmFtLnNpZ25hbClcbiAgICAub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgdXBkYXRlLmNhbGwodGhpcywgdGhpcy5vcHRpb25zW3RoaXMuc2VsZWN0ZWRJbmRleF0uX19kYXRhX18pO1xuICAgIH0pO1xuXG4gIHNsLnNlbGVjdEFsbCgnb3B0aW9uJylcbiAgICAuZGF0YShwYXJhbS5vcHRpb25zKVxuICAgLmVudGVyKCkuYXBwZW5kKCdvcHRpb24nKVxuICAgIC5hdHRyKCd2YWx1ZScsIHZnLnV0aWwuaWRlbnRpdHkpXG4gICAgLmF0dHIoJ3NlbGVjdGVkJywgZnVuY3Rpb24oeCkgeyByZXR1cm4geCA9PT0gcGFyYW0udmFsdWUgfHwgbnVsbDsgfSlcbiAgICAudGV4dCh2Zy51dGlsLmlkZW50aXR5KTtcbiAgXG4gIHZhciBub2RlID0gc2wubm9kZSgpO1xuICByZXR1cm4ge1xuICAgIGRvbTogW25vZGVdLFxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciBpZHggPSBwYXJhbS5vcHRpb25zLmluZGV4T2YodmFsdWUpO1xuICAgICAgbm9kZS5zZWxlY3RlZEluZGV4ID0gaWR4O1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFkaW8oZWwsIHBhcmFtKSB7XG4gIHZhciByZyA9IGVsLmFwcGVuZCgnc3BhbicpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3ZlZ2EtcGFyYW0tcmFkaW8nKTtcblxuICB2YXIgbm9kZXMgPSBwYXJhbS5vcHRpb25zLm1hcChmdW5jdGlvbihvcHRpb24pIHtcbiAgICB2YXIgaWQgPSAndmVnYS1vcHRpb24tJyArIHBhcmFtLnNpZ25hbCArICctJyArIG9wdGlvbjtcblxuICAgIHZhciByYiA9IHJnLmFwcGVuZCgnaW5wdXQnKVxuICAgICAgLmRhdHVtKG9wdGlvbilcbiAgICAgIC5vbignY2hhbmdlJywgdXBkYXRlKVxuICAgICAgLmF0dHIoJ2lkJywgaWQpXG4gICAgICAuYXR0cigndHlwZScsICdyYWRpbycpXG4gICAgICAuYXR0cignbmFtZScsIHBhcmFtLnNpZ25hbClcbiAgICAgIC5hdHRyKCd2YWx1ZScsIG9wdGlvbilcbiAgICAgIC5hdHRyKCdjaGVja2VkJywgb3B0aW9uID09PSBwYXJhbS52YWx1ZSB8fCBudWxsKTtcblxuICAgIHJnLmFwcGVuZCgnbGFiZWwnKVxuICAgICAgLmF0dHIoJ2ZvcicsIGlkKVxuICAgICAgLnRleHQob3B0aW9uKTtcblxuICAgIHJldHVybiByYi5ub2RlKCk7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgZG9tOiBub2RlcyxcbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG5vZGVzW2ldLnZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgIG5vZGVzW2ldLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiByYW5nZShlbCwgcGFyYW0pIHtcbiAgdmFyIHZhbCA9IHBhcmFtLnZhbHVlICE9PSB1bmRlZmluZWQgPyBwYXJhbS52YWx1ZSA6XG4gICAgKCgrcGFyYW0ubWF4KSArICgrcGFyYW0ubWluKSkgLyAyO1xuXG4gIHZhciBybiA9IGVsLmFwcGVuZCgnaW5wdXQnKVxuICAgIC5vbignaW5wdXQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGxibC50ZXh0KHRoaXMudmFsdWUpO1xuICAgICAgdXBkYXRlLmNhbGwodGhpcywgK3RoaXMudmFsdWUpO1xuICAgIH0pXG4gICAgLmF0dHIoJ3R5cGUnLCAncmFuZ2UnKVxuICAgIC5hdHRyKCduYW1lJywgcGFyYW0uc2lnbmFsKVxuICAgIC5hdHRyKCd2YWx1ZScsIHZhbClcbiAgICAuYXR0cignbWluJywgcGFyYW0ubWluKVxuICAgIC5hdHRyKCdtYXgnLCBwYXJhbS5tYXgpXG4gICAgLmF0dHIoJ3N0ZXAnLCBwYXJhbS5zdGVwIHx8IHZnLnV0aWwuYmlucyh7XG4gICAgICBtaW46IHBhcmFtLm1pbixcbiAgICAgIG1heDogcGFyYW0ubWF4LFxuICAgICAgbWF4YmluczogMTAwXG4gICAgfSkuc3RlcCk7XG5cbiAgdmFyIGxibCA9IGVsLmFwcGVuZCgnbGFiZWwnKVxuICAgIC5hdHRyKCdjbGFzcycsICd2ZWdhLXJhbmdlJylcbiAgICAudGV4dCh2YWwpO1xuXG4gIHZhciBub2RlID0gcm4ubm9kZSgpO1xuICByZXR1cm4ge1xuICAgIGRvbTogW25vZGVdLFxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIG5vZGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIGxibC50ZXh0KHZhbHVlKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgdmFsdWUgPSB0aGlzLl9fZGF0YV9fIHx8IGQzLmV2ZW50LnRhcmdldC52YWx1ZTtcbiAgdGhpcy5fX3ZlZ2FfXy5zaWduYWwodGhpcy5uYW1lLCB2YWx1ZSkudXBkYXRlKCk7XG59XG4iLCIvLyBvcGVuIGVkaXRvciB1cmwgaW4gYSBuZXcgd2luZG93LCBhbmQgcGFzcyBhIG1lc3NhZ2Vcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24od2luZG93LCB1cmwsIGRhdGEpIHtcbiAgdmFyIGVkaXRvciA9IHdpbmRvdy5vcGVuKHVybCksXG4gICAgICB3YWl0ID0gMTAwMDAsXG4gICAgICBzdGVwID0gMjUwLFxuICAgICAgY291bnQgPSB+fih3YWl0L3N0ZXApO1xuXG4gIGZ1bmN0aW9uIGxpc3RlbihldnQpIHtcbiAgICBpZiAoZXZ0LnNvdXJjZSA9PT0gZWRpdG9yKSB7XG4gICAgICBjb3VudCA9IDA7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbiwgZmFsc2UpO1xuICAgIH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbiwgZmFsc2UpO1xuXG4gIC8vIHNlbmQgbWVzc2FnZVxuICAvLyBwZXJpb2RpY2FsbHkgcmVzZW5kIHVudGlsIGFjayByZWNlaXZlZCBvciB0aW1lb3V0XG4gIGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgaWYgKGNvdW50IDw9IDApIHJldHVybjtcbiAgICBlZGl0b3IucG9zdE1lc3NhZ2UoZGF0YSwgJyonKTtcbiAgICBzZXRUaW1lb3V0KHNlbmQsIHN0ZXApO1xuICAgIGNvdW50IC09IDE7XG4gIH1cbiAgc2V0VGltZW91dChzZW5kLCBzdGVwKTtcbn07XG4iXX0=
