/*
 * 简单JS模块加载器
 * 作者 : markbone
 */
Module.config = {} //模块配置
Module.cache = { //模块缓存
}
function isType(type) {
    return function(obj) {
        return Object.prototype.toString.call(obj) === "[object " + type + "]"
    }
}
var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")
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

function Module(id,deps) {
    this.id = id; //模块ID
    this.deps = deps||[]; //模块依赖
    this.factory = null; //模块方法
    this.exports = {}; //模块返回接口
    this.status = 0; //模块当前状态
    // Who depends on me
    this._waitings = {};
    // The number of unloaded dependencies
    this._remain = 0;
}
Module.regr_ready = /(loaded|complete|undefined)/i;
Module.define = function (id, deps, fn) {
    deps = isArray(deps)?deps:[deps];
    var module = Module.get(id,deps);
    module.factory = fn;
    module.deps = deps;
    if(module.status<STATUS.SAVED) {
        module.status = STATUS.SAVED;
    }
}
Module.use = function (ids, callback) { //模块加载入口方法
    ids = isArray(ids)?ids:[ids];
    var mod = Module.get(location.href,ids);
    mod.callback = function(){
        var exports = [];
        for(var i = 0;i<ids.length;i++){
            exports[i] = Module.get(ids[i]).exec();
        }
        console.log(exports);
        callback&&callback.apply(window,exports);
    }
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
    var len = mod._remain = mod.deps.length;
    for(var i = 0;i<len;i++){
        var m = Module.get(mod.deps[i]);
        m._waitings[mod.id] = 1;
    }
    if(mod._remain==0){
        mod.onload();
        return;
    }
    //加载依赖模块
    for(var i = 0;i<len;i++){
        var m = Module.get(mod.deps[i]);
        if(m.status<STATUS.FETCHING) {
            m.fetch();
        }
    }
}

/**
 * 取模块
 */
Module.prototype.fetch = function(){
    var mod = this;
    mod.status = STATUS.FETCHING;
    function onRequest(){
        mod.load();
    }
    Module.loadJs(this.id, onRequest);
}

/**
 * 加载完成
 */
Module.prototype.onload = function(){
    var mod = this;
    mod.status = STATUS.LOADED;
    if(mod.callback){
        mod.callback();
    }
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

Module.get = function(id,deps){
    id = Module.realpath(id);
    return Module.cache[id]?Module.cache[id]:Module.cache[id]=new Module(id,deps);
}

/**
 *执行模块factory函数
 **/
Module.prototype.exec = function () {
    var mod = this;
    if(mod.status>=STATUS.EXECUTING){
        return;
    }
    function require(id) {
        return Module.get(id).exec();
    }
    mod.status = STATUS.EXECUTING;
    mod.factory(require,mod.exports={});
    mod.status = STATUS.EXECUTED;
    return mod.exports;
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