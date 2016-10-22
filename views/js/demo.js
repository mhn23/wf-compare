(function demo() {

  /* global jsondiffpatch */
  var instance = jsondiffpatch.create({
    objectHash: function(obj, index) {
      if (typeof obj._id !== 'undefined') {
        return obj._id;
      }
      if (typeof obj.id !== 'undefined') {
        return obj.id;
      }
      if (typeof obj.name !== 'undefined') {
        return obj.name;
      }
      return '$$index:' + index;
    }
  });

  var dom = {
    addClass: function(el, className) {
      if (el.classList) {
        el.classList.add(className);
      } else {
        el.className += ' ' + className;
      }
    },
    removeClass: function(el, className) {
      if (el.classList) {
        el.classList.remove(className);
      } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' +
          className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    },
    text: function(el, text) {
      if (typeof el.textContent !== 'undefined') {
        if (typeof text === 'undefined') {
          return el.textContent;
        }
        el.textContent = text;
      } else {
        if (typeof text === 'undefined') {
          return el.innerText;
        }
        el.innerText = text;
      }
    },
    on: function(el, eventName, handler) {
      if (el.addEventListener) {
        el.addEventListener(eventName, handler);
      } else {
        el.attachEvent('on' + eventName, handler);
      }
    },
    ready: function(fn) {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
      } else {
        document.attachEvent('onreadystatechange', function() {
          if (document.readyState === 'interactive') {
            fn();
          }
        });
      }
    },
    getJson: function(url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function() {
        if (this.readyState === 4) {
          var data;
          try {
            data = JSON.parse(this.responseText, jsondiffpatch.dateReviver);
          } catch (parseError) {
            callback('parse error: ' + parseError);
          }
          if (this.status >= 200 && this.status < 400) {
            callback(null, data);
          } else {
            callback(new Error('request failed'), data);
          }
        }
      };
      request.send();
      request = null;
    },
    runScriptTags: function(el) {
      var scripts = el.querySelectorAll('script');
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        /* jshint evil: true */
        eval(s.innerHTML);
      }
    }
  };

  var trim = function(str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  var JsonArea = function JsonArea(element) {
    this.element = element;
    this.container = element.parentNode;
    var self = this;
    var prettifyButton = this.container.querySelector('.prettyfy');
    if (prettifyButton) {
      dom.on(prettifyButton, 'click', function() {
        self.prettyfy();
      });
    }
  };

  JsonArea.prototype.error = function(err) {
    var errorElement = this.container.querySelector('.error-message');
    if (!err) {
      dom.removeClass(this.container, 'json-error');
      errorElement.innerHTML = '';
      return;
    }
    errorElement.innerHTML = err + '';
    dom.addClass(this.container, 'json-error');
  };

  JsonArea.prototype.getValue = function() {
    if (!this.editor) {
      return this.element.value;
    }
    return this.editor.getValue();
  };

  JsonArea.prototype.parse = function() {
    var txt = trim(this.getValue());
    try {
      this.error(false);
      if (/^\d+(.\d+)?(e[\+\-]?\d+)?$/i.test(txt) ||
        /^(true|false)$/.test(txt) ||
        /^["].*["]$/.test(txt) ||
        /^[\{\[](.|\n)*[\}\]]$/.test(txt)) {
        return JSON.parse(txt, jsondiffpatch.dateReviver);
      }
      return this.getValue();
    } catch (err) {
      this.error(err);
      throw err;
    }
  };

  JsonArea.prototype.setValue = function(value) {
    if (!this.editor) {
      this.element.value = value;
      return;
    }
    this.editor.setValue(value);
  };

  JsonArea.prototype.prettyfy = function() {
    var value = this.parse();
    var prettyJson = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    this.setValue(prettyJson);
  };

  /* global CodeMirror */
  JsonArea.prototype.makeEditor = function(readOnly) {
    if (typeof CodeMirror === 'undefined') {
      return;
    }
    this.editor = CodeMirror.fromTextArea(this.element, {
      mode: 'javascript',
      json: true,
      readOnly: readOnly
    });
    if (!readOnly) {
      this.editor.on('change', compare);
    }
  };

  var areas = {
    left: new JsonArea(document.getElementById('json-input-left')),
    right: new JsonArea(document.getElementById('json-input-right')),
    delta: new JsonArea(document.getElementById('json-delta'))
  };

  var compare = function() {
    var left, right, error;
    document.getElementById('results').style.display = 'none';
    try {
      left = areas.left.parse();
    } catch (err) {
      error = err;
    }
    try {
      right = areas.right.parse();
    } catch (err) {
      error = err;
    }
    areas.delta.error(false);
    if (error) {
      areas.delta.setValue('');
      return;
    }
    var selectedType = getSelectedDeltaType();
    var visualdiff = document.getElementById('visualdiff');
    var annotateddiff = document.getElementById('annotateddiff');
    var jsondifflength = document.getElementById('jsondifflength');
    try {
      var delta = instance.diff(left, right);

      if (typeof delta === 'undefined') {
        switch (selectedType) {
          case 'visual':
            visualdiff.innerHTML = 'no diff';
            break;
          case 'annotated':
            annotateddiff.innerHTML = 'no diff';
            break;
          case 'json':
            areas.delta.setValue('no diff');
            jsondifflength.innerHTML = '0';
            break;
        }
      } else {
        switch (selectedType) {
          case 'visual':
            visualdiff.innerHTML = jsondiffpatch.formatters.html.format(delta, left);
            if (!document.getElementById('showunchanged').checked) {
              jsondiffpatch.formatters.html.hideUnchanged();
            }
            dom.runScriptTags(visualdiff);
            break;
          case 'annotated':
            annotateddiff.innerHTML = jsondiffpatch.formatters.annotated.format(delta);
            break;
          case 'json':
            areas.delta.setValue(JSON.stringify(delta, null, 2));
            jsondifflength.innerHTML = (Math.round(JSON.stringify(delta).length / 102.4) / 10.0) + '';
            break;
        }
      }
    } catch (err) {
      jsondifflength.innerHTML = '0';
      visualdiff.innerHTML = '';
      annotateddiff.innerHTML = '';
      areas.delta.setValue('');
      areas.delta.error(err);
      if (typeof console !== 'undefined' && console.error) {
        console.error(err);
        console.error(err.stack);
      }
    }
    document.getElementById('results').style.display = '';
  };

  areas.left.makeEditor();
  areas.right.makeEditor();

  dom.on(areas.left.element, 'change', compare);
  dom.on(areas.right.element, 'change', compare);
  dom.on(areas.left.element, 'keyup', compare);
  dom.on(areas.right.element, 'keyup', compare);

  var getSelectedDeltaType = function() {
    if (document.getElementById('show-delta-type-visual').checked) {
      return 'visual';
    }
    if (document.getElementById('show-delta-type-annotated').checked) {
      return 'annotated';
    }
    if (document.getElementById('show-delta-type-json').checked) {
      return 'json';
    }
  };

  var showSelectedDeltaType = function() {
    var type = getSelectedDeltaType();
    document.getElementById('delta-panel-visual').style.display =
      type === 'visual' ? '' : 'none';
    document.getElementById('delta-panel-annotated').style.display =
      type === 'annotated' ? '' : 'none';
    document.getElementById('delta-panel-json').style.display =
      type === 'json' ? '' : 'none';
    compare();
  };

  dom.on(document.getElementById('show-delta-type-visual'), 'click', showSelectedDeltaType);
  dom.on(document.getElementById('show-delta-type-annotated'), 'click', showSelectedDeltaType);
  dom.on(document.getElementById('show-delta-type-json'), 'click', showSelectedDeltaType);

  dom.on(document.getElementById('swap'), 'click', function() {
    var leftValue = areas.left.getValue();
    areas.left.setValue(areas.right.getValue());
    areas.right.setValue(leftValue);
    compare();
  });

  dom.on(document.getElementById('clear'), 'click', function() {
    areas.left.setValue('');
    areas.right.setValue('');
    compare();
  });

  dom.on(document.getElementById('showunchanged'), 'change', function() {
    jsondiffpatch.formatters.html.showUnchanged(document.getElementById('showunchanged').checked, null, 800);
  });

  dom.ready(function(){
    setTimeout(compare);
  }, 1);

  var load = {};

  load.data = function(data) {
    data = data || {};
    dom.text(document.getElementById('description'), data.description || '');
    if (data.url && trim(data.url).substr(0, 10) !== 'javascript') {
      document.getElementById('external-link').setAttribute('href', data.url);
      document.getElementById('external-link').style.display = '';
    } else {
      document.getElementById('external-link').style.display = 'none';
    }
    var leftValue = data.left ? (data.left.content || data.left) : '';
    areas.left.setValue(leftValue);
    var rightValue = data.right ? (data.right.content || data.right) : '';
    areas.right.setValue(rightValue);

    dom.text(document.getElementById('json-panel-left').querySelector('h2'), (data.left && data.left.name) || 'left.json');
    dom.text(document.getElementById('json-panel-right').querySelector('h2'), (data.right && data.right.name) || 'right.json');

    document.getElementById('json-panel-left').querySelector('h2').setAttribute(
      'title', (data.left && data.left.fullname) || '');
    document.getElementById('json-panel-right').querySelector('h2').setAttribute(
      'title', (data.right && data.right.fullname) || '');

    if (data.error) {
      areas.left.setValue('ERROR LOADING: ' + data.error);
      areas.right.setValue('');
    }
  };

  load.gist = function(id) {
    dom.getJson('https://api.github.com/gists/' + id, function(error, data) {
      if (error) {
        var message = error + ((data && data.message) ? data.message : '');
        load.data({
          error: message
        });
        return;
      }
      var filenames = [];
      for (var filename in data.files) {
        var file = data.files[filename];
        if (file.language === 'JSON') {
          filenames.push(filename);
        }
      }
      filenames.sort();
      var files = [
        data.files[filenames[0]],
        data.files[filenames[1]]
      ];
      /*jshint camelcase: false */
      load.data({
        url: data.html_url,
        description: data.description,
        left: {
          name: files[0].filename,
          content: files[0].content
        },
        right: {
          name: files[1].filename,
          content: files[1].content
        }
      });
    });
  };

  load.leftright = function(description, leftValue, rightValue) {
    try {
      description = decodeURIComponent(description || '');
      leftValue = decodeURIComponent(leftValue);
      rightValue = decodeURIComponent(rightValue);
      var urlmatch = /https?:\/\/.*\/([^\/]+\.json)(?:[\?#].*)?/;
      var dataLoaded = {
        description: description,
        left: {},
        right: {}
      };
      var loadIfReady = function() {
        if (typeof dataLoaded.left.content !== 'undefined' &&
          typeof dataLoaded.right.content !== 'undefined') {
          load.data(dataLoaded);
        }
      };
      if (urlmatch.test(leftValue)) {
        dataLoaded.left.name = urlmatch.exec(leftValue)[1];
        dataLoaded.left.fullname = leftValue;
        dom.getJson(leftValue, function(error, data) {
          if (error) {
            dataLoaded.left.content = error + ((data && data.message) ? data.message : '');
          } else {
            dataLoaded.left.content = JSON.stringify(data, null, 2);
          }
          loadIfReady();
        });
      } else {
        dataLoaded.left.content = leftValue;
      }
      if (urlmatch.test(rightValue)) {
        dataLoaded.right.name = urlmatch.exec(rightValue)[1];
        dataLoaded.right.fullname = rightValue;
        dom.getJson(rightValue, function(error, data) {
          if (error) {
            dataLoaded.right.content = error + ((data && data.message) ? data.message : '');
          } else {
            dataLoaded.right.content = JSON.stringify(data, null, 2);
          }
          loadIfReady();
        });
      } else {
        dataLoaded.right.content = rightValue;
      }
      loadIfReady();
    } catch (err) {
      load({
        error: err
      });
    }
  };

  load.key = function(key) {
    var matchers = {
      gist: /^(?:https?:\/\/)?(?:gist\.github\.com\/)?(?:[\w0-9\-a-f]+\/)?([0-9a-f]+)$/i,
      leftright: /^(?:desc=(.*)?&)?left=(.*)&right=(.*)&?$/i,
    };
    for (var loader in matchers) {
      var match = matchers[loader].exec(key);
      if (match) {
        return load[loader].apply(load, match.slice(1));
      }
    }
    load.data({
      error: 'unsupported source: ' + key
    });
  };

  var urlQuery = /^[^?]*\?([^\#]+)/.exec(document.location.href);
  if (urlQuery) {
    load.key(urlQuery[1]);
  } else {
  }
})();