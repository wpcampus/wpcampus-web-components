const defaultFadeInterval = 80;

class WPCampusHTMLElement extends HTMLElement {
  constructor(componentID) {
    super();
    this.connected = false;
    this.rendering = false;
    this.componentID = componentID;
  }
  initShadow(mode) {
    if (undefined === mode || !["open", "closed"].includes(mode)) {
      mode = "open";
    }
    this.shadow = this.attachShadow({ mode: mode });
  }
  addStyles(stylesheet, toShadow) {
    const styles = document.createElement("style");
    styles.appendChild(document.createTextNode(stylesheet));
    if (true === toShadow && this.shadow) {
      this.shadow.appendChild(styles);
    } else {
      document.head.appendChild(styles);
    }
  }
  fadeIn(target, interval) {
    if (!target) {
      target = this;
    }
    if (!interval) {
      interval = defaultFadeInterval;
    }
    return new Promise((resolve, reject) => {
      var fadeEffect = setInterval(function() {
        if (!target.style.opacity) {
          target.style.opacity = 0;
        }
        var opacity = parseFloat(target.style.opacity);
        if (opacity < 1) {
          target.style.opacity = opacity + 0.1;
        } else {
          clearInterval(fadeEffect);
          resolve();
        }
      }, interval);
    });
  }
  fadeOut(target, interval) {
    if (!target) {
      target = this;
    }
    if (!interval) {
      interval = defaultFadeInterval;
    }
    return new Promise((resolve, reject) => {
      var fadeEffect = setInterval(function() {
        if (!target.style.opacity) {
          target.style.opacity = 1;
        }
        var opacity = parseFloat(target.style.opacity);
        if (opacity > 0) {
          target.style.opacity = opacity - 0.1;
        } else {
          clearInterval(fadeEffect);
          resolve();
        }
      }, interval);
    });
  }
  setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
  }
  getLocalStorageItem(key) {
    var value = null;
    try {
      value = localStorage.getItem(key);
    } catch (error) {
      value = null;
    }
    return value;
  }
  isConnected() {
    return this.connected;
  }
  // Pass true or false to set rendering state.
  isRendering(state) {
    if (true === state || false === state) {
      this.rendering = state;
      return state;
    }
    return this.rendering ? true === this.rendering : false;
  }
  connectedCallback() {
    this.connected = true;
  }
}

module.exports = WPCampusHTMLElement;
