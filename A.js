/**
 * Created by YuanXiang on 15-11-24.
 */
Module.define('A',["B","C"],function(require,exports){
   require("B");
   require("C");
   alert("a");
    exports.name = "a";
});