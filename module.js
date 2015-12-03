/*
 * 简单JS模块加载器
 * 作者 : markbone
 */
Module.config = {} //模块配置
Module.cache = { //模块缓存
}
var STATUS = Module.STATUS = {
    // 1 - The `module.uri` is being fetched
    FETCHING: 1,
    // 2 - The meta data has been saved to cachedMods
    SAVED: 2,
    // 3 - The `module.dependencies` are being loaded
    LOADING: 3,
    // 4 - The module are ready to execute
    LOADED: 4,
    // 5 - The module is being executed
    EXECUTING: 5,
    // 6 - The `module.exports` is available
    EXECUTED: 6
}

function Module(id) {
    this.id = id; //模块ID
    this.deps = []; //模块依赖
    this.factory = null; //模块方法
    this.exports = {}; //模块返回接口
    this.status = STATUS.FETCHING; //模块当前状态,初始化时模块已下载
    // Who depends on me
    this._waitings = {}
    // The number of unloaded dependencies
    this._remain = 0
}
Module.regr_ready = /(loaded|complete|undefined)/i;
Module.define = function (id, deps, fn) {
    var module = Module.get(id);
    if (typeof deps == "string") {
        deps = Array.call([], deps);
    } else if (!deps instanceof Array) {
        deps = [];
    }
    module.factory = fn;
    module.deps = deps;
    module.status = STATUS.SAVED;
}
Module.use = function (id, callback) { //模块加载入口方法
    var mod = Module.get(id);
    mod.load();
}

/**
 * 获取模块真实路径
 * @param id
 */
Module.realpath = function(id){
    return Module.config.baseURI + id;
}

/**
 * 加载模块
 */
Module.prototype.load = function () {
    var mod = this;
    mod.status = STATUS.LOADING;
    function onRequest(){
        var len = mod._remain = mod.deps.length;
        for(var i = 0;i<len;i++){
            var m = Module.get(mod.deps[i]);
            m._waitings[mod.id] = 1;
        }
        if(mod._remain==0){
            mod.onload();
        }
        //加载依赖模块
        for(var i = 0;i<len;i++){
            var m = Module.get(mod.deps[i]);
            m.load();
        }
    }
    Module.loadJs(this.id, onRequest);
}

/**
 * 加载完成
 */
Module.prototype.onload = function(){
    var mod = this;
    mod.status = STATUS.LOADED;
    mod.exec();
    //通知依赖当前模块的模块
    for(var wait in mod._waitings){
        if(mod._waitings.hasOwnProperty(wait)){
            Module.cache[wait]._remain--;
            if(Module.cache[wait]._remain==0){
                Module.cache[wait].onload();
            }
        }
    }
}
//加载依赖的模块
Module.require = function (id) {
    for (var module in Module.cache) {
        if (Module.cache.hasOwnProperty(module) && id === Module.cache[module].id) {
            return Module.cache[module].exports;
        }
    }
}

Module.get = function(id){
    id = Module.realpath(id);
    return Module.cache[id]?Module.cache[id]:(Module.cache[id]=new Module(id));
}

/**
 *执行模块factory函数
 **/
Module.prototype.exec = function () {
    var mod = this;
    mod.status = STATUS.EXECUTING;
    mod.factory();
    mod.status = STATUS.EXECUTED;
}

Module.copy = function (target, copy) {
    for (var c in copy) {
        if (copy.hasOwnProperty(c)) { //不拷贝原型链上的属性
            target[c] = copy[c];
        }
    }
}
Module.size = function (obj) {
    var len = 0;
    for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
            len++;
        }
    }
    return len;
}
Module.loadJs = function (id, callback) {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.defer = true;
    script.src = Module.config.baseURI + id + ".js";
    if (script.readyState) {
        script.onreadystatechange = function () {
            if (Module.regr_ready.test(this.readyState)) {
                callback && callback();
            }
        }
    } else {
        script.onload = function () {
            callback && callback();
        }
    }
    document.getElementsByTagName("head")[0].appendChild(script);
}