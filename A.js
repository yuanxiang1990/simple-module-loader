/**
 * Created by YuanXiang on 15-11-24.
 */
Module.define('A',["B","C"],function(require,exports){
    var b = require("B");
    b.aaa();
   // exports.name = "a";
});