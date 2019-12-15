const WPCampusHTMLElement = require("./default");
const stylesheet = require("../assets/css/notifications.css");

const localStorageKey = "wpcNotification";
const localStorageKeyTime = "wpcNotificationTime";

// URL to request notification info. Can be overwritten.
const notificationsURLDefault =
  "https://wpcampus.org/wp-json/wpcampus/data/notifications?limit=1";

// Life of notification stored locally in seconds (5 minutes). Can be overwritten.
const localStorageSecondsDefault = 300;

// How often to check for notification updates in seconds (5 minutes). Can be overwritten.
const requestUpdateSecondsDefault = 300;

// How many requests to make to update notifications. Can be overwritten.
const requestUpdateMaxDefault = 2;

// Keeps track of how many times the update request has been made.
var requestUpdateCount = 0;

const notificationsSelector = ".wpc-notifications";
const messageSelector = ".wpc-notification__message";

const loadingClass = "wpc-notifications--loading";

const template = `<div class="wpc-notifications">
  <div class="wpc-notification">
    <div class="wpc-notification__icon">
      <?xml version="1.0" encoding="utf-8"?>
      <svg aria-hidden="true" role="decoration" class="wpc-notification__icon__graphic" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" viewBox="0 0 30 30" style="enable-background:new 0 0 30 30;" xml:space="preserve">
        <title></title>
        <style type="text/css">.wpc-notification__icon__i--white{fill:#FFFFFF;}</style>
        <circle class="wpc-notification__icon__bg" cx="15" cy="15" r="15" />
        <circle class="wpc-notification__icon__i wpc-notification__icon__i--dot wpc-notification__icon__i--white" cx="15" cy="8.2" r="2.4" />
        <g>
          <path class="wpc-notification__icon__i wpc-notification__icon__i--body wpc-notification__icon__i--white" d="M12.6,23.1c0,0.3,0.3,0.6,0.6,0.6h3.6c0.3,0,0.6-0.3,0.6-0.6v-9.6c0-0.3-0.3-0.6-0.6-0.6h-3.6c-0.3,0-0.6,0.3-0.6,0.6V23.1z" />
        </g>
      </svg>
    </div>
    <div class="wpc-notification__message"></div>
  </div>
</div>`;

class WPCampusNotifications extends WPCampusHTMLElement {
  constructor() {
    super("notifications");
    this.addStyles(stylesheet);
  }
  checkPropertyNumber(value, defaultValue, forcePositive) {
    if (!value) {
      return defaultValue;
    }
    if (!Number.isInteger(value)) {
      return parseInt(value);
    }
    if (forcePositive) {
      return Math.abs(value);
    }
    return value;
  }
  isNotificationLocalExpired() {
    var notificationLocalTime = this.getLocalStorageItem(localStorageKeyTime);
    if (!notificationLocalTime) {
      return true;
    }
    const difference = (Date.now() - notificationLocalTime) / 1000;
    this.localStorageSeconds = this.checkPropertyNumber(
      this.localStorageSeconds,
      localStorageSecondsDefault,
      true
    );
    return difference >= this.localStorageSeconds;
  }
  pauseTimer() {
    const that = this;
    that.resetTimerFunction = that.resetTimer.bind(that);
    document.addEventListener("mousemove", that.resetTimerFunction);
    document.addEventListener("keydown", that.resetTimerFunction);
  }
  resetTimer() {
    const that = this;
    requestUpdateCount = 0;
    document.removeEventListener("mousemove", that.resetTimerFunction);
    document.removeEventListener("keydown", that.resetTimerFunction);
    that.loadNotificationFromRequest();
  }
  setUpdateTimer() {
    const that = this;
    this.requestUpdateSeconds = this.checkPropertyNumber(
      this.requestUpdateSeconds,
      requestUpdateSecondsDefault,
      true
    );
    setTimeout(function() {
      that.loadNotificationFromRequest();
    }, this.requestUpdateSeconds * 1000);
  }
  requestNotification() {
    const that = this;
    if (!that.notificationsURL) {
      that.notificationsURL = notificationsURLDefault;
    }
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", that.notificationsURL);
      request.onload = () => resolve(request.responseText);
      request.onerror = () => reject(request);
      request.send();
    });
  }
  storeNotificationLocal(notification) {
    this.setLocalStorageItem(localStorageKey, JSON.stringify(notification));
    this.setLocalStorageItem(localStorageKeyTime, Date.now());
  }
  getNotificationLocal() {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        if (that.isNotificationLocalExpired()) {
          resolve(null);
        }
        let notification = that.getLocalStorageItem(localStorageKey);
        if (notification) {
          notification = JSON.parse(notification);
        }
        resolve(notification);
      } catch (error) {
        reject(error);
      }
    });
  }
  getNotificationTemplate(notification, loading) {
    const templateDiv = document.createElement("div");
    templateDiv.innerHTML = template;

    if (notification) {
      templateDiv.querySelector(messageSelector).innerHTML = notification;
    }

    if (true === loading) {
      templateDiv
        .querySelector(notificationsSelector)
        .classList.add(loadingClass);
    }

    return templateDiv.innerHTML;
  }
  loadNotificationHTML(notification, loading) {
    const that = this;
    return new Promise((resolve, reject) => {
      // Get new message.
      const newMessage = notification ? notification.content.rendered : null;

      if (!newMessage) {
        return resolve(false);
      }

      if (!that.innerHTML) {
        that.innerHTML = that.getNotificationTemplate(newMessage, loading);
        if (true === loading) {
          setTimeout(function() {
            that
              .querySelector(notificationsSelector)
              .classList.remove(loadingClass);
          }, 200);
        }
        return resolve(true);
      }

      // Get existing message.
      var messageDiv = that.querySelector(messageSelector);
      const currentMessage = messageDiv ? messageDiv.innerHTML : null;

      // Get out of here if no message or the message is the same.
      if (!currentMessage || newMessage === currentMessage) {
        return resolve(false);
      }

      that.fadeOut(messageDiv).then(function() {
        messageDiv.setAttribute("role", "alert");
        messageDiv.innerHTML = newMessage;
        that.fadeIn(messageDiv).then(function() {
          return resolve(true);
        });
      });
    });
  }
  // Will return true if notification was loaded from local storage.
  async loadNotificationFromLocal() {
    let notificationLocal = await this.getNotificationLocal();
    if (notificationLocal) {
      this.loadNotificationHTML(notificationLocal);
      return true;
    }
    return false;
  }
  async loadNotificationFromRequest() {
    const that = this;

    // Limit the number of requests we make. Can be reset by user activity.
    requestUpdateCount++;
    this.requestUpdateMax = this.checkPropertyNumber(
      this.requestUpdateMax,
      requestUpdateMaxDefault,
      true
    );
    if (requestUpdateCount > this.requestUpdateMax) {
      that.pauseTimer();
      return;
    }

    await that
      .requestNotification()
      .then(function(notificationResponse) {
        try {
          if (!notificationResponse) {
            throw "The notification request had no response.";
          }

          // Convert string to object.
          notificationResponse = JSON.parse(notificationResponse);
          if (!notificationResponse.length) {
            throw "The notification request did not return a valid response.";
          }

          const notification = notificationResponse.shift();

          that.loadNotificationHTML(notification, true);

          that.storeNotificationLocal(notification);
        } catch (error) {}
      })
      .catch(function(error) {
        // @TODO what to do when the request doesn't work?
      })
      .finally(function() {
        that.setUpdateTimer();
      });
  }
  async loadNotification() {
    let loadedFromLocal = await this.loadNotificationFromLocal();
    if (!loadedFromLocal) {
      await this.loadNotificationFromRequest();
    }
    this.setUpdateTimer();
  }
  async render() {
    if (!this.isConnected() || this.isRendering()) {
      return;
    }
    this.isRendering(true);
    this.setAttribute("role", "complementary");
    this.setAttribute("aria-label", "Notifications");
    await this.loadNotification();
    this.isRendering(false);
  }
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }
}
customElements.define("wpcampus-notifications", WPCampusNotifications);

module.exports = WPCampusNotifications;
