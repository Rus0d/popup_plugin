// Добавляет поддержку insertAdjacent* в Firefox

//localStorage.setItem("popup-show-restriction-" + 21, "y"); -- добавить если не надо чтоб модалка показывалась
// данному пользователю

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

    Model = function () {

        this.modals = [];                                                                                               /* Массив оюъектов с модалками */
        this.info = [];                                                                                                 /* Массив оюъектов разведчиков */
        this.currentPageInfo = [];                                                                                      /* Отфильтрованный массив оюъектов разведчиков для текущего URL */
        this.changedIds = [];                                                                                           /* ID модалок которые модифицировались */
        this.deletedIds = [];                                                                                           /* ID модалок которые были отключены */

        var updateInfoTimer = 300000,                                                                                   /* Интервал обновления по умолчанию */
            getInfoTrigger = true,                                                                                      /* Тригер обновления */
            actualModel = [],                                                                                           /* Массив фильтрованных модалок для текущего URL */
            modalsArray = [];                                                                                           /* Массив истансов конструктора Model */

        var getLocalModals = function() {

                this.modals = JSON.parse(localStorage.getItem("modalsArr")) || [];

                getInfo();

            }.bind(this),                                                               /* Достаем модалки из локального хранилища */

            getInfo = function() {

                var getJson = function() {

                    if ( getInfoTrigger ) {

                        var xhrInfo = new XMLHttpRequest();
                        xhrInfo.open('POST', 'https://my.citrus.ua/api/modalwindows', true);
                        xhrInfo.send();
                        xhrInfo.onreadystatechange = function() {
                            if (xhrInfo.readyState != 4) return;
                            if (xhrInfo.status != 200) {
                                //console.log(xhrInfo.status + ': ' + xhrInfo.statusText);
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

            }.bind(this),                                                                      /* Запрашиваем массив разведчиков */

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
            }.bind(this),                                                                  /* Фильтруем разведчиков по URL */

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
            }.bind(this),                                                             /* Формируем массив с ID модалок которые изменялись */

            getModel = function() {

                if( this.changedIds.length ) {

                    var xhrModals = new XMLHttpRequest();
                    xhrModals.open('POST', 'https://my.citrus.ua/api/modalwindows/' + this.changedIds.join(','), true);
                    xhrModals.send();
                    xhrModals.onreadystatechange = function() {
                        if (xhrModals.readyState != 4) return;
                        if (xhrModals.status != 200) {
                            //console.log(xhrModals.status + ': ' + xhrModals.statusText);
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

            }.bind(this),                                                                     /* Запрашиваем модалки */

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
            }.bind(this),                                                                  /* Удаляем дубликаты */

            setLocalModals = function() {

                var serialModals = JSON.stringify(this.modals);

                localStorage.setItem("modalsArr", serialModals);

                setActualModel();

            }.bind(this),                                                               /* Сохраняем массив с модалками в локальное хранилище */

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

            }.bind(this),                                                               /* Фильтруем массив с модалками по URL */

            initModals = function() {

                if( this.deletedIds.length ) {

                    for (var i = 0; i < modalsArray.length; i++){

                        for (var j = 0; j < this.deletedIds.length; j++){

                            if( modalsArray[i].modelItem.id === this.deletedIds[j] ) {
                                modalsArray[i].modelDelete();                                                           /* Удаляем попап из дома */
                                modalsArray[i] = {};
                                modalsArray.splice( i, 1 );                                                             /* Удаляем объект попапа */
                            }

                        }

                    }

                }

                actualModel.forEach(function( actItem, number ) {

                    var overlapCheck = false;

                    if( modalsArray.length > 0 ) {

                        modalsArray.forEach(function( modalsItem, modalsNumber ) {

                            if( actItem.id === modalsItem.modelItem.id ) {
                                overlapCheck = true;
                            }

                        }.bind(this));

                    }

                    if( !overlapCheck ){
                        modalsArray.push(new Modal(actItem));
                    }

                    /*if( !modalsArray[number] ) {
                        modalsArray[number] = new Modal(actItem);
                    }*/

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

            }.bind(this);                                                                   /* Создаем инстансы модалок */

        this.stopSynch = function() {

            getInfoTrigger = false;

        };                                                                              /* Метод для остановки авто синхронизации */

        this.startSynch = function(timeInterval) {

            getInfoTrigger = true;
            updateInfoTimer = timeInterval || updateInfoTimer;

            getLocalModals();

        };                                                                 /* Старт авто синхронизации */
    };

    Modal = function (modelItem) {                                                                                      /* Конструктор модалок */

        this.modelItem = modelItem;

        var popupActivity = false,                                                                                      /* Флаги активности попапа, выставляются чекерами */
            cookiePeriod = false,
            popupRestriction = false;


        var DOMinsert = function() {

                var bodyEl = document.querySelector('body');

                bodyEl.insertAdjacentHTML("beforeEnd", "<div id='popupId-" + this.modelItem.id + "' class='popup-plugin popup-plugin-hide'>" + this.modelItem.html + "</div>");

                var headEl = document.querySelector('head');

                if (this.modelItem.css) {
                    headEl.insertAdjacentHTML("beforeEnd", "<link id='popupIdCss-" + this.modelItem.id + "' href=https://my.citrus.ua" + this.modelItem.css + " rel='stylesheet' type='text/css'>");
                }

                var script = document.createElement('script');
                if(this.modelItem.js) {
                    script.src = "https://my.citrus.ua" + this.modelItem.js;
                    script.async = false;
                    script.id = "popupIdJs-" + this.modelItem.id;
                }
                if(this.modelItem.js) {
                    bodyEl.appendChild(script);
                }

            }.bind(this),                                                                    /* Работа с ДОМ */
            DOMrefresh = function() {

                var popup = document.getElementById("popupId-" + this.modelItem.id),
                    css = document.getElementById("popupIdCss-" + this.modelItem.id),
                    js = document.getElementById("popupIdJs-" + this.modelItem.id),
                    headEl = document.querySelector('head'),
                    bodyEl = document.querySelector('body'),
                    script = document.createElement('script');

                popup.innerHTML = this.modelItem.html;

                if(css != null) {
                    css.parentNode.removeChild(css);
                }

                if (this.modelItem.css) {
                    headEl.insertAdjacentHTML("beforeEnd", "<link id='popupIdCss-" + this.modelItem.id + "' href='https://my.citrus.ua" + this.modelItem.css + "' rel='stylesheet' type='text/css'>");
                }

                if(js != null) {
                    js.parentNode.removeChild(js);
                }
                if(this.modelItem.js) {
                    script.src = "https://my.citrus.ua" + this.modelItem.js;
                    script.async = true;
                    script.id = "popupIdJs-" + this.modelItem.id;
                }

                if(this.modelItem.js) {
                    bodyEl.appendChild(script);
                }

            }.bind(this),
            DOMdelete = function() {

                    var popup = document.getElementById("popupId-" + this.modelItem.id),
                        css = document.getElementById("popupIdCss-" + this.modelItem.id),
                        js = document.getElementById("popupIdJs-" + this.modelItem.id);

                    if(popup != null) {
                        popup.parentNode.removeChild(popup);
                    }
                    if(css != null) {
                        css.parentNode.removeChild(css);
                    }
                    if(js != null) {
                        js.parentNode.removeChild(js);
                    }

            }.bind(this),

            openWindowParametersTracking = function() {

                if ( typeof(dataLayer) != 'undefined' ) {

                    dataLayer.push({
                        'event': this.modelItem.event,
                        'eventCategory': this.modelItem.event_category,
                        'eventAction': 'Window Opened'
                    });

                }

            }.bind(this),
            closeWindowParametersTracking = function() {

                if ( typeof(dataLayer) != 'undefined' ) {

                    dataLayer.push({
                        'event': this.modelItem.event,
                        'eventCategory': this.modelItem.event_category,
                        'eventAction': 'Window Close'
                    });

                }

            }.bind(this),
            closeOuterSpaceParametersTracking = function() {

                if ( typeof(dataLayer) != 'undefined' ) {

                    dataLayer.push({
                        'event': this.modelItem.event,
                        'eventCategory': this.modelItem.event_category,
                        'eventAction': 'Window Close OuterSpace'
                    });

                }

            }.bind(this),

            dayCallPeriodChecker = function() {

                var startPeriod = this.modelItem.start_time,
                    endPeriod = this.modelItem.end_time,
                    now = new Date().getHours();

                if( (startPeriod <= now) && (now <= endPeriod) ){
                    popupActivity = true;
                }
                else {
                    popupActivity = false;
                }

            }.bind(this),                                                         /* Проверка периода вызова в сутки */
            cookiePeriodChecker = function() {

                var shownDay = JSON.parse(localStorage.getItem("coockieTime" + this.modelItem.id)) || 0,
                    timeDuration = this.modelItem.cookie_time * 24 * 3600 * 1000,
                    now = new Date();

                if ( (now.getTime() - timeDuration) >= shownDay ) {
                    cookiePeriod = true;
                } else {
                    cookiePeriod = false;
                }

            }.bind(this),                                                          /* Проверка времени cookie */
            restricitionChecker = function() {

                var restrictionValue = localStorage.getItem(this.modelItem.show_restriction_name) || 0;

                if ( restrictionValue === this.modelItem.show_restriction_value ) {
                    popupRestriction = true;
                } else {
                    popupRestriction = false;
                }

            }.bind(this),
            cookiePeriodSetter = function() {

                var now = new Date(),
                    shownDay = JSON.stringify( now.getTime() );

                localStorage.setItem("coockieTime" + this.modelItem.id, shownDay);

            }.bind(this),                                                           /* Устанавливаем время cookie */

            robotoShow = function() {

                dayCallPeriodChecker();
                cookiePeriodChecker();
                restricitionChecker();

                if ( popupActivity && cookiePeriod && !popupRestriction ) {

                    cookiePeriodSetter();
                    openWindowParametersTracking();

                    var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                    if( DOMelement != null ) {
                        DOMelement.classList.remove("popup-plugin-hide");
                    }
                }

            }.bind(this),                                                                   /* Метод показать попап учитывая время cookie, периода вызова в сутки */
            manualShow = function() {

                cookiePeriodSetter();
                openWindowParametersTracking();
                restricitionChecker();

                if ( !popupRestriction ) {

                var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                if( DOMelement != null ) {
                    DOMelement.classList.remove("popup-plugin-hide");
                }

                }

            }.bind(this),                                                                   /* Метод показать попап */
            hide = function() {

                var DOMelement = document.getElementById('popupId-' + this.modelItem.id);

                if( DOMelement != null ) {
                    DOMelement.classList.add("popup-plugin-hide");
                }

            }.bind(this),                                                                         /* Метод прячет попап */

            delayedShow = function() {

                if( this.modelItem.delay >= 0 ) {

                    setTimeout(robotoShow , this.modelItem.delay * 1000);

                }

            }.bind(this),
            onClickClose = function() {

                var popup = document.getElementById('popupId-' + this.modelItem.id);

                if( popup != null ) {
                    popup.onclick = function (e) {
                        var closeBtn = document.querySelector('#popupId-' + this.modelItem.id + ' .popup-close');
                        e.stopPropagation();

                        if (e.target === closeBtn) {
                            hide();
                            closeWindowParametersTracking();
                        }
                        else if (e.target === popup) {
                            hide();
                            closeOuterSpaceParametersTracking();
                        }

                    }.bind(this);
                }

            }.bind(this),
            onClickOpen = function() {

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
            onScrollOpen = function() {

                if( this.modelItem.on_scroll ) {

                    var scrollElements = document.querySelectorAll(this.modelItem.on_scroll),
                        direction = '',
                        opened = false,
                        oldScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

                    window.onscroll = function() {

                        var scrolled = window.pageYOffset || document.documentElement.scrollTop,
                            height = document.documentElement.clientHeight;

                        if ( (scrolled - oldScrollPosition) >= 0 ) {
                            direction = 'DOWN';
                        }
                        else {
                            direction = 'UP';
                        }

                        oldScrollPosition = scrolled;

                        scrollElements.forEach( function( item ){

                            if ( (direction === 'DOWN') && ( item.offsetTop <= (scrolled + height) ) && ( (scrolled + height) <= (item.offsetTop + item.offsetHeight) ) && ( !opened ) ) {
                                robotoShow();
                                opened = true;
                            }
                            else if ( (direction === 'UP') && ( (item.offsetHeight + item.offsetTop) >= scrolled ) && ( scrolled >= item.offsetTop ) && ( !opened ) ) {
                                robotoShow();
                                opened = true;
                            }
                            else if ( (direction === 'DOWN') && ( (scrolled) > (item.offsetTop + item.offsetHeight) ) && ( opened ) ) {
                                opened = false;
                            }
                            else if ( (direction === 'UP') && ( (scrolled + height) < item.offsetTop ) && ( opened ) ) {
                                opened = false;
                            }

                        });

                    };

                }

            }.bind(this),
            onOutOpen = function() {

                if ( this.modelItem.on_out_of_window ) {

                    var html = document.querySelector('html');

                    html.onmouseleave = function(e) {
                        e.stopPropagation();

                        if (e.clientY < 0) {
                            robotoShow();
                        }
                    };
                }

            }.bind(this);

        (function () {

            var callOnLoad = function() {

                DOMinsert();
                dayCallPeriodChecker();
                cookiePeriodChecker();
                delayedShow();
                onClickClose();
                onClickOpen();
                onScrollOpen();
                onOutOpen();

            };

            document.addEventListener("DOMContentLoaded", callOnLoad());

        }());

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

    var model = new Model();
    model.startSynch(5000);

}());