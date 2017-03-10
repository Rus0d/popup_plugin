// Добавляет поддержку insertAdjacent* в Firefox

if (typeof HTMLElement != "undefined" && !HTMLElement.prototype.insertAdjacentElement) {
    HTMLElement.prototype.insertAdjacentElement = function(where, parsedNode) {
        switch (where) {
            case 'beforeBegin':
                this.parentNode.insertBefore(parsedNode, this)
                break;
            case 'afterBegin':
                this.insertBefore(parsedNode, this.firstChild);
                break;
            case 'beforeEnd':
                this.appendChild(parsedNode);
                break;
            case 'afterEnd':
                if (this.nextSibling) this.parentNode.insertBefore(parsedNode, this.nextSibling);
                else this.parentNode.appendChild(parsedNode);
                break;
        }
    }

    HTMLElement.prototype.insertAdjacentHTML = function(where, htmlStr) {
        var r = this.ownerDocument.createRange();
        r.setStartBefore(this);
        var parsedHTML = r.createContextualFragment(htmlStr);
        this.insertAdjacentElement(where, parsedHTML)
    }


    HTMLElement.prototype.insertAdjacentText = function(where, txtStr) {
        var parsedText = document.createTextNode(txtStr)
        this.insertAdjacentElement(where, parsedText)
    }
}


(function() {

/*    this.Modal = function () {

        this.updateInfoTimer = 120000;
        this.getInfoTrigger = true;

        this.modals = [];
        this.info = [];

        this.currentPageInfo = [];
        this.changedIds = [];
    };

    Modal.prototype.getLocalModals = function() {
        this.modals = JSON.parse(localStorage.getItem("modalsArr")) || [];

        this.getInfo();
    };

    Modal.prototype.getInfo = function() {

        var getJson = function() {

            if ( this.getInfoTrigger ) {

                var xhrInfo = new XMLHttpRequest();
                xhrInfo.open('POST', 'https://my.citrus.ua/api/modalwindows', true);
                xhrInfo.send();
                xhrInfo.onreadystatechange = function() {
                    if (xhrInfo.readyState != 4) return;
                    if (xhrInfo.status != 200) {
                        console.log(xhrInfo.status + ': ' + xhrInfo.statusText);
                        this.compareInfo();
                    } else {
                        this.info = JSON.parse(xhrInfo.responseText) || [{}];
                        this.compareInfo();
                    }
                }.bind(this);
            }
            else {
                return false;
            }

        }.bind(this);

        getJson();

        setInterval(getJson , this.updateInfoTimer);

    };

    Modal.prototype.compareInfo = function() {

        this.info.forEach(function(itemInfo) {

            this.currentPageInfo = [];

            for (var i = 0, len = itemInfo.patterns.length; i < len; i++){

                var expr = new RegExp(itemInfo.patterns[i]);

                if( expr.test(window.location.href) ) {
                    this.currentPageInfo.push(itemInfo);
                }

            }

        }.bind(this));

        console.log('this.currentPageInfo = ' + this.currentPageInfo);

        this.compareTimestamp();
    };

    Modal.prototype.compareTimestamp = function() {

        this.changedIds = [];

        if( this.modals.length === 0 ) {

            this.changedIds = this.currentPageInfo.map(function(itemInfo) {

                return itemInfo.id;

            }.bind(this));

        }
        else {

            this.currentPageInfo.forEach(function(itemInfo,i) {

                this.modals.forEach(function(itemModals,j) {

                    if( (itemInfo.id === itemModals.id) && (itemInfo.timestamp !=  itemModals.timestamp) ) {

                        this.changedIds.push( itemInfo.id );

                    }

                }.bind(this));

            }.bind(this));

            var currentPageInfoId = this.currentPageInfo.map(function(itemInfo) {

                return itemInfo.id;

            }.bind(this));

            var currentModalsId = this.modals.map(function(itemModals) {

                return itemModals.id;

            }.bind(this));

            console.log('currentModalsId = ' +  JSON.stringify(currentModalsId));

            var arr4Concat = currentPageInfoId.filter(function(item) {

                return !!(currentModalsId.indexOf(item) === -1);

            }.bind(this));

            this.changedIds = this.changedIds.concat(arr4Concat);
        }

        this.getModel();
    };

    Modal.prototype.getModel = function() {

        if( this.changedIds.length ) {

            var xhrModals = new XMLHttpRequest();
            xhrModals.open('POST', 'https://my.citrus.ua/api/modalwindows/' + this.changedIds.join(','), true);
            xhrModals.send();
            xhrModals.onreadystatechange = function() {
                if (xhrModals.readyState != 4) return;
                if (xhrModals.status != 200) {
                    console.log(xhrModals.status + ': ' + xhrModals.statusText);
                }
                else {

                    var newModals = JSON.parse(xhrModals.responseText),
                        replication = [];

                    console.log(newModals);

                    if( this.modals.length === 0 ) {

                        this.modals = newModals;

                    }
                    else {

                        this.modals.forEach(function (itemModals, i) {

                            newModals.forEach(function (itemModalsNew) {

                                if (itemModalsNew.id === itemModals.id) {
                                    this.modals[i] = itemModalsNew;
                                    replication.push(itemModalsNew.id);
                                }
                                else if( replication.indexOf(itemModalsNew.id) === -1 ) {
                                    this.modals.push(itemModalsNew);
                                    replication.push(itemModalsNew.id);
                                }

                            }.bind(this));

                        }.bind(this));

                    }
                    this.cleanModals();
                }
            }.bind(this);

        }
        else {
            this.cleanModals();
        }

    };

    Modal.prototype.cleanModals = function() {

        var newModal = [],
            existIds = [];

        this.info.forEach(function(itemInfo) {

            this.modals.forEach(function(itemModals) {

                if( (itemModals.id === itemInfo.id) && (existIds.indexOf(itemInfo.id) === -1) ) {
                    newModal.push(itemModals);
                    existIds.push(itemModals.id);
                }

            }.bind(this));

        }.bind(this));

        this.modals = newModal;

        console.log(this.modals);

        this.setLocalModals();
    };

    Modal.prototype.setLocalModals = function() {

        var serialModals = JSON.stringify(this.modals);

        localStorage.setItem("modalsArr", serialModals);

        console.log('---------------------------------------------------------------------------------------------------');

    };

    Modal.prototype.stopSynch = function() {

        this.getInfoTrigger = false;

    };

    Modal.prototype.startSynch = function(timeInterval) {

        this.getInfoTrigger = true;
        this.updateInfoTimer = timeInterval;

        this.getLocalModals();

    };*/

    modalsArray = [];

    this.Model = function () {

        this.modals = [];
        this.info = [];
        this.currentPageInfo = [];
        this.changedIds = [];
        this.deletedIds = [];

        var updateInfoTimer = 120000,
            getInfoTrigger = true;

        var getLocalModals = function() {
                this.modals = JSON.parse(localStorage.getItem("modalsArr")) || [];

                getInfo();
            }.bind(this),

            getInfo = function() {

                var getJson = function() {

                    if ( getInfoTrigger ) {

                        var xhrInfo = new XMLHttpRequest();
                        xhrInfo.open('POST', 'https://my.citrus.ua/api/modalwindows', true);
                        xhrInfo.send();
                        xhrInfo.onreadystatechange = function() {
                            if (xhrInfo.readyState != 4) return;
                            if (xhrInfo.status != 200) {
                                console.log(xhrInfo.status + ': ' + xhrInfo.statusText);
                                compareInfo();
                            } else {
                                this.info = JSON.parse(xhrInfo.responseText) || [{}];
                                compareInfo();
                            }
                        }.bind(this);
                    }
                    else {
                        return false;
                    }

                }.bind(this);

                getJson();

                setInterval(getJson , updateInfoTimer);

            }.bind(this),

            compareInfo = function() {

                this.currentPageInfo = [];

                this.info.forEach(function(itemInfo) {

                    for (var i = 0, len = itemInfo.patterns.length; i < len; i++){

                        var expr = new RegExp(itemInfo.patterns[i]);

                        if( expr.test(window.location.href) ) {

                            this.currentPageInfo.push(itemInfo);

                        }

                    }

                }.bind(this));

                compareTimestamp();
            }.bind(this),

            compareTimestamp = function() {

                this.changedIds = [];
                this.deletedIds = [];

                if( this.modals.length === 0 ) {

                    this.changedIds = this.currentPageInfo.map(function(itemInfo) {

                        return itemInfo.id;

                    }.bind(this));

                }
                else {

                    this.currentPageInfo.forEach(function(itemInfo,i) {

                        this.modals.forEach(function(itemModals,j) {

                            if( (itemInfo.id === itemModals.id) && (itemInfo.timestamp !=  itemModals.timestamp) ) {

                                this.changedIds.push( itemInfo.id );

                            }

                        }.bind(this));

                    }.bind(this));

                    var currentPageInfoId = this.currentPageInfo.map(function(itemInfo) {

                        return itemInfo.id;

                    }.bind(this));

                    var currentModalsId = this.modals.map(function(itemModals) {

                        return itemModals.id;

                    }.bind(this));

                    var arr4Concat = currentPageInfoId.filter(function(item) {

                        return (currentModalsId.indexOf(item) === -1);

                    }.bind(this));

                    this.changedIds = this.changedIds.concat(arr4Concat);

                    this.deletedIds = currentModalsId.filter(function(item) {

                        return (currentPageInfoId.indexOf(item) === -1);

                    }.bind(this));

                    console.log('this.deletedIds = ' + this.deletedIds)

                }

                console.log('currentModalsId = ' +  JSON.stringify(currentModalsId));

                getModel();
            }.bind(this),

            getModel = function() {

                if( this.changedIds.length ) {

                    var xhrModals = new XMLHttpRequest();
                    xhrModals.open('POST', 'https://my.citrus.ua/api/modalwindows/' + this.changedIds.join(','), true);
                    xhrModals.send();
                    xhrModals.onreadystatechange = function() {
                        if (xhrModals.readyState != 4) return;
                        if (xhrModals.status != 200) {
                            console.log(xhrModals.status + ': ' + xhrModals.statusText);
                            cleanModals();
                        }
                        else {

                            var newModals = JSON.parse(xhrModals.responseText),
                                replication = [];

                            if( this.modals.length === 0 ) {

                                this.modals = newModals;

                            }
                            else {

                                this.modals.forEach(function (itemModals, i) {

                                    newModals.forEach(function (itemModalsNew) {

                                        if (itemModalsNew.id === itemModals.id) {
                                            this.modals[i] = itemModalsNew;
                                            replication.push(itemModalsNew.id);
                                        }
                                        else if( replication.indexOf(itemModalsNew.id) === -1 ) {
                                            this.modals.push(itemModalsNew);
                                            replication.push(itemModalsNew.id);
                                        }

                                    }.bind(this));

                                }.bind(this));

                            }
                            cleanModals();
                        }
                    }.bind(this);

                }
                else {
                    cleanModals();
                }

            }.bind(this),

            cleanModals = function() {

                var newModal = [],
                    existIds = [];

                this.info.forEach(function(itemInfo) {

                    this.modals.forEach(function(itemModals) {

                        if( (itemModals.id === itemInfo.id) && (existIds.indexOf(itemInfo.id) === -1) ) {
                            newModal.push(itemModals);
                            existIds.push(itemModals.id);
                        }

                    }.bind(this));

                }.bind(this));

                this.modals = newModal;

                setLocalModals();
            }.bind(this),

            setLocalModals = function() {

                var serialModals = JSON.stringify(this.modals);

                localStorage.setItem("modalsArr", serialModals);

                initModals();

            }.bind(this),

            initModals = function() {

                this.modals.forEach(function( modelItem, number ) {

                    for (var i = 0, len = this.currentPageInfo.length; i < len; i++){

                        if( this.currentPageInfo[i].id === modelItem.id ) {

                            if( !modalsArray[number] ) {
                                modalsArray[number] = new Modal( modelItem );  /* Инициализируем инстансы попапов */
                                console.log('modelItem create');
                                console.log(modelItem);
                            }

                            else if( modalsArray[number] && this.changedIds.length ) {

                                for (var j = 0, len2 = this.changedIds.length; j < len2; j++){


                                    if( modelItem.id === this.changedIds[j] ) {
                                        modalsArray[number].modelRefresh( modelItem );  /* Обновляем попап */
                                        console.log('modelItem refresh');
                                        console.log(modelItem);
                                    }

                                }

                            }

                        }

                    }

                }.bind(this));

                if( this.deletedIds.length ) {

                    for (var i = 0; i < modalsArray.length; i++){

                        for (var j = 0; j < this.deletedIds.length; j++){

                            if( modalsArray[i].modelItem.id === this.deletedIds[j] ) {
                                modalsArray[i].modelDelete();              /* Удаляем попап из дома */
                                modalsArray[i] = {};
                                modalsArray.splice( i, 1 );                /* Удаляем объект попапа */
                            }

                        }

                    }

                }

                console.log('---------------------------------------------------------------------------------------------------');

            }.bind(this);

        this.stopSynch = function() {

            getInfoTrigger = false;

        };

        this.startSynch = function(timeInterval) {

            getInfoTrigger = true;
            updateInfoTimer = timeInterval;

            getLocalModals();

        };
    };






    Modal = function (modelItem) {

        this.modelItem = modelItem;

        /*this.id = modelItem.id;
        this.timestamp = modelItem.timestamp;
        this.html = modelItem.html;
        this.css = modelItem.css;
        this.on_click = modelItem.on_click;
        this.on_scroll = modelItem.on_scroll;
        this.start_time = modelItem.start_time;
        this.end_time = modelItem.end_time;
        this.start_period = modelItem.start_period;
        this.end_period = modelItem.end_period;
        this.delay = modelItem.delay;
        this.cookie_time = modelItem.cookie_time;
        this.event_action = modelItem.event_action;
        this.event_category = modelItem.event_category;
        this.event_label = modelItem.event_label;
        this.on_out_of_window = modelItem.on_out_of_window;*/

        var DOMinsert = function() {

                var insertFunc = function() {

                    var bodyEl = document.querySelector('body');
                    bodyEl.insertAdjacentHTML("beforeEnd", "<div id='popupId-" + modelItem.id + "' class='popup-plugin hide'>" + this.modelItem.html + "</div>");

                    var headEl = document.querySelector('head');
                    headEl.insertAdjacentHTML("beforeEnd", "<link href=" + this.modelItem.css + " rel='stylesheet' type='text/css'>");

                }.bind(this);

                document.addEventListener("DOMContentLoaded", insertFunc());

            }.bind(this),
            DOMrefresh = function(  ) {

                document.querySelector("#popupId-" + modelItem.id).innerHTML = this.modelItem.html;

                console.log('refreshed');

            }.bind(this),
            DOMdelete = function(  ) {

                console.log('deleting');

                var popup = document.querySelector("#popupId-" + modelItem.id);

                popup.parentNode.removeChild(popup);

            }.bind(this);

        DOMinsert();

        this.modelRefresh = function( newModelItem ) {

            this.modelItem = newModelItem;

            DOMrefresh();

        };
        this.modelDelete = function() {

            DOMdelete();

        };

    };





}());

var model = new Model();
model.startSynch(10000);
