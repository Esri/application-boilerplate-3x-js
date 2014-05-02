define([
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dojo/Deferred",
    "dojo/window"
],
function (
    Evented,
    declare,
    lang,
    _WidgetBase,
    on,
    dom, domClass,
    BorderContainer, ContentPane,
    Deferred,
    win
) {
    var Widget = declare([_WidgetBase, Evented], {
        declaredClass: "application.Drawer",
        options: {
            showDrawerSize: 850,
            borderContainer: null,
            contentPaneCenter: null,
            contentPaneSide: null,
            toggleButton: null,
            direction: 'ltr',
            mapResizeTimeout: 260,
            mapResizeStepTimeout: 25
        },
        // lifecycle: 1
        constructor: function (options) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // properties
            this.set("showDrawerSize", defaults.showDrawerSize);
            this.set("borderContainer", defaults.borderContainer);
            this.set("contentPaneCenter", defaults.contentPaneCenter);
            this.set("contentPaneSide", defaults.contentPaneSide);
            this.set("toggleButton", defaults.toggleButton);
            this.set("direction", defaults.direction);
            this.set("mapResizeTimeout", defaults.mapResizeTimeout);
            this.set("mapResizeStepTimeout", defaults.mapResizeStepTimeout);
            // classes
            this.css = {
                toggleButton: 'toggle-button',
                toggleButtonSelected: 'toggle-button-selected',
                drawerOpen: "drawer-open",
                drawerOpenComplete: "drawer-open-complete"
            };
        },
        // start widget. called by user
        startup: function () {
            this._init();
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function () {
            this._removeEvents();
            this.inherited(arguments);
        },
        resize: function () {
            // resize border container
            if (this._borderContainer) {
                this._borderContainer.layout();
            }
            // drawer status resize
            this.emit('resize', {});
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        // resize
        // toggle
        /* ---------------- */
        /* Public Functions */
        /* ---------------- */
        toggle: function (add) {
            // deferred to return
            var def = new Deferred();
            // true if drawer is opened
            var currentlyOpen = domClass.contains(document.body, this.css.drawerOpen);
            // if already open or already closed and asked to do the same
            if (currentlyOpen && add === true || !currentlyOpen && add === false) {
                // return
                return def.promise;
            }
            // whether drawer is now opened or closed
            var nowOpen;
            // if add is set
            if (typeof add !== 'undefined') {
                nowOpen = domClass.toggle(document.body, this.css.drawerOpen, add);
            } else {
                nowOpen = domClass.toggle(document.body, this.css.drawerOpen, !currentlyOpen);
            }
            // remove shadow
            domClass.remove(document.body, this.css.drawerOpenComplete);
            // if steps animation exists
            if (this._animationSteps) {
                clearInterval(this._animationSteps);
                this._animationSteps = null;
            }
            // resize during animation
            this._animationSteps = setInterval(lang.hitch(this, function () {
                // resize border container
                this.resize();
            }), this.get("mapResizeStepTimeout"));
            // remove timeout if exists
            if (this._animationTimeout) {
                clearTimeout(this._animationTimeout);
                this._animationTimeout = null;
            }
            // wait for animation to finish
            this._animationTimeout = setTimeout(lang.hitch(this, function () {
                // resize border container
                this.resize();
                // remove shown drawer
                this._checkDrawerStatus();
                // stop resizing container
                clearInterval(this._animationSteps);
                this._animationSteps = null;
                // now drawer is open
                if (nowOpen) {
                    // add shadow
                    domClass.add(document.body, this.css.drawerOpenComplete);
                }
                // return
                def.resolve();
            }), this.get("mapResizeTimeout"));
            // return when done
            return def.promise;
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _removeEvents: function () {
            if (this._events && this._events.length) {
                for (var i = 0; i < this._events.length; i++) {
                    this._events[i].remove();
                }
            }
            this._events = [];
            // destroy content panes
            if (this._contentPaneCenter) {
                this._contentPaneCenter.destroy();
            }
            if (this._contentPaneSide) {
                this._contentPaneSide.destroy();
            }
            // destroy content pane
            if (this._borderContainer) {
                this._borderContainer.destroy();
            }
        },
        _init: function () {
            // setup events
            this._removeEvents();
            // required nodes
            this._borderContainerNode = dom.byId(this.get("borderContainer"));
            this._contentPaneCenterNode = dom.byId(this.get("contentPaneCenter"));
            this._contentPaneSideNode = dom.byId(this.get("contentPaneSide"));
            this._toggleNode = dom.byId(this.get("toggleButton"));
            // all nodes present
            if (this._borderContainerNode &&
                this._contentPaneCenterNode &&
                this._contentPaneSideNode &&
                this._toggleNode
            ) {
                // outer container
                this._borderContainer = new BorderContainer({
                    gutters: false
                }, this._borderContainerNode);
                // center panel
                this._contentPaneCenter = new ContentPane({
                    region: "center",
                    style: {
                        padding: 0
                    }
                }, this._contentPaneCenterNode);
                this._borderContainer.addChild(this._contentPaneCenter);
                // panel side
                var side = 'left';
                if (this.get("direction") === 'rtl') {
                    side = 'right';
                }
                // left panel
                this._contentPaneSide = new ContentPane({
                    region: side,
                    style: {
                        padding: 0
                    }
                }, this._contentPaneSideNode);
                this._borderContainer.addChild(this._contentPaneSide);
                // start border container
                this._borderContainer.startup();
                // drawer button
                var toggleClick = on(this._toggleNode, 'click', lang.hitch(this, function () {
                    this.toggle();
                }));
                this._events.push(toggleClick);
                // window size event
                var winResize = on(window, 'resize', lang.hitch(this, function () {
                    this._windowResized();
                }));
                this._events.push(winResize);
                // check window size
                this._windowResized();
                // fix layout
                this.resize();
                // set loaded property
                this.set("loaded", true);
                // emit loaded event
                this.emit("load", {});
            } else {
                console.log('Drawer::Missing required node');
            }
        },
        _windowResized: function () {
            // view screen
            var vs = win.getBox();
            // if window width is less than specified size
            if (vs.w < this.get("showDrawerSize")) {
                // hide drawer
                this.toggle(false);
            } else {
                // show drawer
                this.toggle(true);
            }
            // remove forced open
            this._checkDrawerStatus();
        },
        _checkDrawerStatus: function () {
            // border container layout
            this.resize();
            // hamburger button toggle
            this._toggleButton();
        },
        _toggleButton: function () {
            // if drawer is displayed
            if (domClass.contains(document.body, this.css.drawerOpen)) {
                // has normal class
                if (domClass.contains(this._toggleNode, this.css.toggleButton)) {
                    // replace with selected class
                    domClass.replace(this._toggleNode, this.css.toggleButtonSelected, this.css.toggleButton);
                }
            } else {
                // has selected class
                if (domClass.contains(this._toggleNode, this.css.toggleButtonSelected)) {
                    // replace with normal class
                    domClass.replace(this._toggleNode, this.css.toggleButton, this.css.toggleButtonSelected);
                }
            }
        }
    });
    return Widget;
});
