/*
 * 简单JS模块加载器
 * 作者 : markbone
 */
Module.config = {}//模块配置
Module.cache = { //模块缓存
}
var STATUS = { 
　　FETCHING: 1, // The module file is fetching now. 模块正在下载中 
　　FETCHED: 2, // The module file has been fetched. 模块已下载 
　　SAVED: 3, // The module info has been saved. 模块信息已保存 
　　READY: 4, // All dependencies and self are ready to compile. 模块的依赖项都已下载，等待编译 
    EXECUTING: 5, // The module is in compiling now. 模块正在执行
    EXECUTED: 6 // The module is compiled and module.exports is available. 模块已执行 
}
function Module(id) {
    this.id = id;//模块ID
    this.deps = [];//模块依赖
    this.factory = null;//模块方法
    this.exports = {};//模块返回接口
    this.status = STATUS.FETCHED;//模块当前状态,初始化时模块已下载
}
Module.regr_ready = /(loaded|complete|undefined)/i;
Module.define = function(id, deps, fn) {
    var module = Module["cache"][id] || new Module(id);
    if (typeof deps == "string") {
        deps = Array.call([], deps);
    } else if (!deps instanceof Array) {
        deps = [];
    }
    module.factory = fn;
    module.deps = deps;
    if(deps.length==0){//没有依赖，直接将模板置为ready状态
        module.status = STATUS.READY;
    }
    else{
        module.status = STATUS.SAVED;//模块信息已保存
    }
    Module.cache[id] = module;
    for (var i = 0; i < module.deps.length; i++) {
        var m = new Module(module.deps[i]);
        m.status = STATUS.FETCHING;//置模块状态为未下载状态
        Module.cache[module.deps[i]] = m;
    };
}
Module.use = function(id,callback) { //模块加载入口方法
    Module.load(id);
}
Module.load = function(id) {
    Module.loadJs(id, function() {
        if (Module.cache[id].deps.length > 0) {
            for (var i = 0; i < Module.cache[id].deps.length; i++) {
                Module.load(Module.cache[id].deps[i]);
            }
        }
        if (Module.check()) { //全部模块load完成
            Module.fire();
        }
    });
}
//加载依赖的模块
Module.require = function(id){
    for(var module in Module.cache){
        if(Module.cache.hasOwnProperty(module)&&id === Module.cache[module].id){
            return Module.cache[module].exports;
        }
    }
}
Module.check = function(){
    for(var module in Module.cache){
        if(Module.cache.hasOwnProperty(module)&&Module.cache[module].status < STATUS.SAVED){
            return false;
        }
    }
    return true;
}
//按依赖执行factory
Module.fire = function() {
    var modules = {};
    Module.copy(modules, Module.cache)
    while (Module.size(modules) > 0) {
        for (var c in modules) {
            if (modules.hasOwnProperty(c)) {
                if (modules[c].status === STATUS.READY) {
                    modules[c].factory(Module.require,modules[c].exports);
                    Module.cache[c].status = STATUS.EXECUTED;
                    delete modules[c];
                }
                else if(modules[c].status === STATUS.EXECUTED){//已执行过的不再执行
                    delete modules[c];   
                } 
                else {
                    var canFire = true;
                    for (var i = 0; i < modules[c].deps.length; i++) {
                        if (Module.cache[modules[c].deps[i]].status<STATUS.EXECUTED) {//依赖模块未保存，不能执行
                            canFire = false;
                            break;
                        }
                    }
                    if (canFire) {
                        modules[c].factory(Module.require,modules[c].exports);
                        Module.cache[c].status = STATUS.EXECUTED;
                        delete modules[c];
                    }
                }
            }
        }
    }
}
Module.copy = function(target, copy) {
    for (var c in copy) {
        if (copy.hasOwnProperty(c)) { //不拷贝原型链上的属性
            target[c] = copy[c];
        }
    }
}
Module.size = function(obj) {
    var len = 0;
    for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
            len++;
        }
    }
    return len;
}
Module.loadJs = function(id, callback) {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.defer = true;
    script.src = Module.config.baseURI + id + ".js";
    
    if (script.readyState) {
        script.onreadystatechange = function(){
            if(Module.regr_ready.test(this.readyState)){
                callback && callback();
            }
        }
    } else {
        script.onload = function() {
            callback && callback();
        }
    }
    document.getElementsByTagName("head")[0].appendChild(script);
}