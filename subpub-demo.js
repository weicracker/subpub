/*
 * @Author: jiwei
 * @Date: 2017-12-23 16:37:34
 * @Last Modified by: jiwei
 * @Last Modified time: 2017-03-27 16:47:43
 */
//
// ─── MICROAPP READ FILE ─────────────────────────────────────────────────────────
//

((win) => {
    var Config, globaVal, sysURL;
    try {
        Config = nodeRequire('./aspModule/out/config').configData;
        globaVal = nodeRequire("./aspModule/out/globalvar").globalVar;
        sysURL = globaVal.sysURL;
    } catch (err) {
        console.log("当前环境：独立启动")
    }
    const remote = nodeRequire('electron').remote;
    const app = remote.app;
    // 服务器使用，注释以上方法
    const fs = nodeRequire('fs');
    const originalFs = nodeRequire('original-fs');
    const path = nodeRequire('path');
    const http = nodeRequire('http');
    const util = nodeRequire('util');
    const events = nodeRequire('events');
    const request = nodeRequire('request');
    const url = nodeRequire('url');
    const uuidV1 = nodeRequire('uuid/v1');
    var microappDlArray = [];
    const global = win;
    class microAppDataListener extends events {}
    microAppDataListener = new microAppDataListener();
    const asp = () => {
        let asp = new asp_local();
        return asp;
    };
    class asp_local {
        fileFlag(filePath) {
            //是否存在需要的文件？
            try {
                fs.accessSync(filePath, fs.F_OK);
            } catch (e) {
                return false;
            }
            return true;
        }
        copy(src, dst) {
            originalFs.writeFileSync(dst, originalFs.readFileSync(src));
        }
        createApp(microAppID) {
            //本地创建微应用
            var _this = this;
            var isMicroAppDlFlag = true;
            let microAppFile = path.join(app.getPath("downloads"), 'ASPMicroApp', microAppID + ".mpx");
            let microAsarFile = path.join(app.getPath("downloads"), 'ASPMicroApp', microAppID + ".asar");
            let appjosnPath = path.join(microAsarFile, 'app.json');
            return new Promise(function (resolve, reject) {
                if (_this.fileFlag(microAppFile)) {
                    _this.copy(microAppFile, microAsarFile);
                    let manifestConfig = _this.getManifestConfig(microAppID, appjosnPath, microAsarFile);
                    resolve(manifestConfig);
                } else {
                    if (isMicroAppDlFlag) {
                        _this.downloadApp(microAppID, function (data) {
                            if (data !== "fail") {
                                let microAsarFileafter = path.join(app.getPath("downloads"), 'ASPMicroApp', data + ".asar");
                                let microAppFileafter = path.join(app.getPath("downloads"), 'ASPMicroApp', data + ".mpx");
                                let appjosnPath = path.join(microAsarFileafter, 'app.json');
                                _this.copy(microAppFileafter, microAsarFileafter);
                                let manifestConfig = _this.getManifestConfig(data, appjosnPath, microAsarFileafter);
                                resolve(manifestConfig);
                            }else{
                                reject("微应用下载失败");
                            }
                        })
                    }
                }
            })
        }
        getManifestConfig(microAppID, filePath, microAppFile) {
            //读取微应用相关文件，并返回给调取者
            let fileContent = fs.readFileSync(filePath, 'utf8');
            let aspMicroURL = filePath.replace('app.json', '');
            let obj = JSON.parse(fileContent);
            let microappFilePath = path.join(aspMicroURL, "app.bundle.js");
            if (obj) {
                let html = path.join(app.getAppPath(), 'aspModule/framwork/index.html?microapp=' + microappFilePath);
                let preload = path.join(app.getAppPath(), 'sdk/app.js');
                let manifestConfig = {
                    basePath: aspMicroURL,
                    view: "",
                    obj,
                    html,
                    preload
                }
                return manifestConfig;
            }
        }
        downloadApp(microAppID, cb, version) {
            //如果本地微应用不存在，则去服务器下载
            microAppDataListener.once(microAppID, function (data) {
                cb(data);
            })
            if (microappDlArray.indexOf(microAppID) == -1) {
                Array.prototype.push.call(microappDlArray, microAppID);
                var dlMicroappURL = sysURL + "/asp/appCenter/1.0/apps/" + microAppID + "/versions";
                var token = saView.getJWT().token;
                request({
                    url: dlMicroappURL,
                    headers: {
                        XASPSESSION: token
                    }
                }, function (e, r, b) {
                    var body = JSON.parse(b);
                    if (body.code == 600) {
                        try {
                            var fileId = body.data[0].fileId;
                            var dlFilePath = sysURL + "/asp/file/1.0/download/" + fileId;
                            saView.download({
                                url: dlFilePath,
                                microApp: true
                            }).then(function (item) {
                                var savePath = item.getSavePath();
                                item.once('done', (event, state) => {
                                    if (state === 'completed') {
                                        var appID = path.basename(savePath).replace(".mpx", "");
                                        microAppDataListener.emit(appID, appID);
                                    }
                                })
                            }, function (rej) {
                                microAppDataListener.emit(microAppID, "fail");
                                console.log("服务器不存在该微应用" + microAppID);
                            })
                        } catch (e) {
                            microAppDataListener.emit(microAppID, "fail");
                            console.log("服务器不存在该微应用" + microAppID);
                        }
                    }
                })
            }
        }
    }
    global.asp_local = asp();
})(window)
// asp_local.downloadApp("14f26042-b795-4dcc-b89a-34c017ddda7c");
// asp_local.createApp('calculator', 111).then(function (data) {
//     console.log(data)
// })
var key;
var rejectActions = {};
var resolveActions = {};
var parasmData = null;
var fs = nodeRequire("fs");
var readyDirPlace = "E:\\stations\\ibp\\dist\\portal\\microapp"; //microapp路径暂时写死
//
// ─── APP ────────────────────────────────────────────────────────────────────────
//
var App = function (viewObject) {
    try {
        if (key.search("search") > -1) {
            if (viewObject.onSearch) {
                var searchData = viewObject.onSearch(parasmData);
                resolveActions[key](searchData);
            } else {
                resolveActions[key](false);
            }
        } else {
            if (viewObject.onViewObject) {
                var onViewObjectData = viewObject.onViewObject(parasmData);
                resolveActions[key](onViewObjectData);
            } else {
                resolveActions[key](false);
            }
        }
    } catch (err) {
        rejectActions[key](false);
    }
}
//
// ─── GETSEARCHAPP ───────────────────────────────────────────────────────────────
//
function getSearchApp(type, parasm) {
    parasmData = parasm;
    var result = [];
    var dirContent = fs.readdirSync(readyDirPlace);
    console.log(dirContent)
    for (var i = 0; i < dirContent.length; i++) {
        if (type === "search") {
            key = "search" + nodeRequire('uuid/v1')();
        } else {
            key = nodeRequire('uuid/v1')();
        }
        if (dirContent[i] != "test.mpx") {
            var a = new Promise(function (res, rej) {
                resolveActions[key] = res;
                rejectActions[key] = rej;
                nodeRequire(readyDirPlace + "\\" + dirContent[i] + "\\app.js");
            });
            result.push(a);
        }
    }
    return Promise.all(result);
}
//
// ─── TEST ───────────────────────────────────────────────────────────────────────
//
// getSearchApp("search", '11111').then(function (res) {
//     console.log(res)
// })