/**
 * Created by YuanXiang on 15-11-24.
 */
Module.define('A',["B","C"],function(require,exports){
   require("B");
   require("C");
    var a = "require('a')";
   alert("a");
    //单行注释
    /*
    da
    多行注释
     */
    exports.name = "a";

});