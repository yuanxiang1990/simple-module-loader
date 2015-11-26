/*
 * 简单JS模块加载器
 * 作者 : markbone
 */
function Module(id) {
    this.id = id;
}
Module.prototype.exports = {};
Module.config = {}
Module.cache = { //模块缓存
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
    Module.cache[id] = module;
    for (var i = 0; i < module.deps.length; i++) {
        var m = new Module(module.deps[i]);
        Module.cache[module.deps[i]] = m;
    };
}
Module.use = function(id) { //模块加载入口方法
    Module.load(id);
}
Module.load = function(id) {
    Module.loadJs(id, function() {
        Module.cache[id].isLoaded = true;
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
//按依赖执行factory
Module.fire = function() {
    var modules = {};
    Module.copy(modules, Module.cache)
    while (Module.size(modules) > 0) {
        for (var c in modules) {
            if (modules.hasOwnProperty(c)) {
                if (modules[c].deps.length == 0) {
                    modules[c].factory();
                    delete modules[c];
                } else {
                    var canFire = true;
                    for (var i = 0; i < modules[c].deps.length; i++) {
                        if (modules[modules[c].deps[i]]) {
                            canFire = false;
                            break;
                        }
                    }
                    if (canFire) {
                        modules[c].factory();
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
Module.check = function() {
    for (var cache in Module.cache) {
        if (Module.cache.hasOwnProperty(cache)) {
            if (!Module.cache[cache].isLoaded) {
                return false;
            }
        }
    }
    return true;
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