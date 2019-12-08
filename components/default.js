const defaultFadeInterval = 80;

class WPCampusHTMLElement extends HTMLElement {
  constructor(componentID) {
    super();
    this.connected = false;
    this.componentID = componentID;
  }
  addStyles(stylesheet) {
    const styles = document.createElement("style");
    styles.appendChild(document.createTextNode(stylesheet));
    document.head.appendChild(styles);
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
  connectedCallback() {
    this.connected = true;
  }
}

export default WPCampusHTMLElement;
