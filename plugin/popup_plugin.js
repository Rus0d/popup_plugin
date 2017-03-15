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

    this.Model = function () {

        this.modals = [];
        this.info = [];
        this.currentPageInfo = [];
        this.changedIds = [];
        this.deletedIds = [];

        var updateInfoTimer = 1000,
            getInfoTrigger = true,
            actualModel = [],
            modalsArray = [];

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
                }
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

                setActualModel();

            }.bind(this),

            setActualModel = function() {

                actualModel = [];

                this.modals.forEach(function( modelItem ) {

                    this.currentPageInfo.forEach(function( currentPageInfo ) {

                        if( currentPageInfo.id === modelItem.id ) {

                            actualModel.push( modelItem );

                        }

                    }.bind(this));

                }.bind(this));

                initModals();

            }.bind(this),

            initModals = function() {

                if( this.deletedIds.length ) {

                    for (var i = 0; i < modalsArray.length; i++){

                        for (var j = 0; j < this.deletedIds.length; j++){

                            if( modalsArray[i].modelItem.id === this.deletedIds[j] ) {
                                modalsArray[i].modelDelete();              /!* Удаляем попап из дома *!/
                                modalsArray[i] = {};
                                modalsArray.splice( i, 1 );                /!* Удаляем объект попапа *!/
                            }

                        }

                    }

                }

                actualModel.forEach(function( actItem, number ) {

                    if( !modalsArray[number] ) {
                        modalsArray[number] = new Modal(actItem);
                    }

                }.bind(this));

                actualModel.forEach(function( actItem ) {

                    this.changedIds.forEach(function (changedId) {

                        modalsArray.forEach(function (arrItem) {

                            if( (actItem.id === changedId) && (changedId === arrItem.modelItem.id) ) {
                                arrItem.modelRefresh(actItem);
                            }

                        }.bind(this));

                    }.bind(this));

                }.bind(this));

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

        var popupActivity = false,
            cookiePeriod = false;

        /*this.id = modelItem.id;
        this.timestamp = modelItem.timestamp;
        this.html = modelItem.html;
        this.css = modelItem.css;
        this.on_click = modelItem.on_click;
        this.on_scroll = modelItem.on_scroll;
        this.start_time = modelItem.start_time;
        this.end_time = modelItem.end_time;
        this.delay = modelItem.delay;
        this.cookie_time = modelItem.cookie_time;
        this.event_action = modelItem.event_action;
        this.event_category = modelItem.event_category;
        this.event_label = modelItem.event_label;
        this.on_out_of_window = modelItem.on_out_of_window;*/

        var DOMinsert = function() {

                var insertFunc = function() {

                    var bodyEl = document.querySelector('body');
                    bodyEl.insertAdjacentHTML("beforeEnd", "<div id='popupId-" + this.modelItem.id + "' class='popup-plugin popup-plugin-hide'>" + this.modelItem.html + "</div>");

                    var headEl = document.querySelector('head');
                    headEl.insertAdjacentHTML("beforeEnd", "<link id='popupIdCss-" + this.modelItem.id + "' href=" + this.modelItem.css + " rel='stylesheet' type='text/css'>");

                }.bind(this);

                document.addEventListener("DOMContentLoaded", insertFunc());

            }.bind(this),
            DOMrefresh = function(  ) {

                var popup = document.getElementById("popupId-" + this.modelItem.id),
                    css = document.getElementById("popupIdCss-" + this.modelItem.id),
                    headEl = document.querySelector('head');

                popup.innerHTML = this.modelItem.html;

                css.parentNode.removeChild(css);
                headEl.insertAdjacentHTML("beforeEnd", "<link id='popupIdCss-" + this.modelItem.id + "' href=" + this.modelItem.css + " rel='stylesheet' type='text/css'>");

            }.bind(this),
            DOMdelete = function(  ) {

                    var popup = document.getElementById("popupId-" + this.modelItem.id),
                        css = document.getElementById("popupIdCss-" + this.modelItem.id);

                    popup.parentNode.removeChild(popup);
                    css.parentNode.removeChild(css);

            }.bind(this),

            dayCallPeriodChecker = function(  ) {

                var startPeriod = this.modelItem.start_time,
                    endPeriod = this.modelItem.end_time,
                    now = new Date().getHours();

                if( (startPeriod <= now) && (now <= endPeriod) ){
                    popupActivity = true;
                }
                else {
                    popupActivity = false;
                }

            }.bind(this),
            cookiePeriodChecker = function(  ) {

                var shownDay = JSON.parse(localStorage.getItem("coockieTime" + this.modelItem.id)) || 0,
                    timeDuration = this.modelItem.cookie_time * 24 * 3600 * 1000,
                    now = new Date();

                if ( (now.getTime() - timeDuration) >= shownDay ) {
                    cookiePeriod = true;
                } else {
                    cookiePeriod = false;
                }

            }.bind(this),
            cookiePeriodSetter = function(  ) {

                var now = new Date(),
                    shownDay = JSON.stringify( now.getTime() );

                localStorage.setItem("coockieTime" + this.modelItem.id, shownDay);

            }.bind(this),

            robotoShow = function(  ) {

                dayCallPeriodChecker();
                cookiePeriodChecker();

                cookiePeriodSetter();

                if ( popupActivity && cookiePeriod ) {
                    var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                    DOMelement.classList.remove("popup-plugin-hide");
                }

            }.bind(this),
            manualShow = function(  ) {

                cookiePeriodSetter();

                    var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                    DOMelement.classList.remove("popup-plugin-hide");

            }.bind(this),
            hide = function(  ) {

                var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                DOMelement.classList.add("popup-plugin-hide");


            }.bind(this),

            delayedShow = function(  ) {

                setTimeout(robotoShow , this.modelItem.delay * 1000);

            }.bind(this),
            onClickClose = function(  ) {

                var popup = document.getElementById('popupId-' + this.modelItem.id),
                    closeBtn = document.querySelectorAll('#popupId-' + this.modelItem.id + ' .popup-close');

                popup.onclick = function(e) {
                    e.stopPropagation();

                    if ( e.target === popup ) {
                        hide();
                    }

                };

                if ( closeBtn ) {

                    closeBtn.onclick = function() {
                        hide();
                    };

                }

            }.bind(this),
            onClickOpen = function(  ) {

                if( this.modelItem.on_click ) {

                    var openBtn = document.querySelectorAll(this.modelItem.on_click);

                    openBtn.forEach(function(item){
                        item.onclick = function(e) {
                            e.stopPropagation();
                            manualShow();
                        };
                    });

                }

            }.bind(this),
            onScrollOpen = function(  ) {

                if( this.modelItem.on_scroll ) {

                    var scrollElements = document.querySelectorAll(this.modelItem.on_scroll);



                    scrollElements.forEach(function(item){

                        /*item.onclick = function(e) {
                            e.stopPropagation();
                            manualShow();
                        };*/

                    });

                }

            }.bind(this),
            onOutOpen = function(  ) {


            }.bind(this);

        DOMinsert();
        dayCallPeriodChecker();
        cookiePeriodChecker();
        delayedShow();
        onClickClose();
        onClickOpen();
        onScrollOpen();
        onOutOpen();

        this.modelRefresh = function( newModelItem ) {

            this.modelItem = newModelItem;
            DOMrefresh();
            dayCallPeriodChecker();
            cookiePeriodChecker();

        };
        this.modelDelete = function() {

            DOMdelete();

        };

    };


}());

var model = new Model();
model.startSynch(5000);
