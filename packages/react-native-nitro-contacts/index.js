'use strict';

// Re-export the built library. Ensures Expo can resolve this package
// (for config plugin discovery) even when using file: before lib/ is built.
module.exports = require('./lib/index');
