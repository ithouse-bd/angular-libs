'use strict';
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');

var cliPath = path.join(__dirname, 'node_modules', '@angular', 'cli');
var binDir = path.join(cliPath, 'bin');
var cliFile = path.join(binDir, 'ng.js');

try {
  if (fs.existsSync(cliFile)) {
    shell.chmod('+x', cliFile);
  }
} catch (err) {
  // silently skip
}
