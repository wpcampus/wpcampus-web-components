const WPCampusHTMLElement = require("./default");
const stylesheet = require("../assets/css/notifications.css");

const localStorageKey = "wpcNotification";
const localStorageKeyTime = "wpcNotificationTime";

// Format options for displaying notifications.
const formatOptions = ["list", "listIcon"];
const formatDefault = "listIcon";

// Default number of notifications we're retrieving.
const limitDefault = 1;

// URL to request notification info. Can be overwritten.
const notificationsURLDefault =
	"https://wpcampus.org/wp-json/wpcampus/data/notifications";

// Life of notification stored locally in seconds (5 minutes). Can be overwritten.
const localStorageSecondsDefault = 300;

// How often to check for notification updates in seconds (5 minutes). Can be overwritten.
const requestUpdateSecondsDefault = 300;

// How many requests to make to update notifications. Can be overwritten.
const requestUpdateMaxDefault = 2;

// Keeps track of how many times the update request has been made.
var requestUpdateCount = 0;

const notificationsSelector = ".wpc-notifications";
const loadingNotificationsClass = "wpc-notifications--loading";
const listSelector = "wpc-notifications__list";
const messageSelector = ".wpc-notification__message";

class WPCampusNotifications extends WPCampusHTMLElement {
	constructor() {
		super("notifications");
		this.addStyles(stylesheet);
		if (this.dataset.format !== undefined) {
			this.format = this.dataset.format;
		}
		if (!formatOptions.includes(this.format)) {
			this.format = formatDefault;
		}
		if (this.dataset.limit !== undefined) {
			this.limit = parseInt(this.dataset.limit);
		}
		if (!this.limit || !(this.limit === -1 || this.limit > 0)) {
			this.limit = limitDefault;
		}
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
	getNotificationURL() {
		let url = "";
		if (!this.notificationsURL) {
			url = notificationsURLDefault;
		} else {
			url = this.notificationsURL;
		}
		// Add limit to URL.
		if (this.limit !== undefined) {
			if (url.search(/\?/g) >= 0) {
				url += "&";
			} else {
				url += "?";
			}
			url += `limit=${this.limit}`;
		}
		return url;
	}
	requestNotification() {
		const url = this.getNotificationURL();
		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("GET", url);
			request.onload = () => resolve(request.responseText);
			request.onerror = () => reject(request);
			request.send();
		});
	}
	storeNotificationsLocal(notifications) {
		this.setLocalStorageItem(localStorageKey, JSON.stringify(notifications));
		this.setLocalStorageItem(localStorageKeyTime, Date.now());
	}
	getNotificationsLocal() {
		const that = this;
		return new Promise((resolve, reject) => {
			try {
				if (that.isNotificationLocalExpired()) {
					resolve(null);
				}
				let notifications = that.getLocalStorageItem(localStorageKey);
				if (notifications) {
					notifications = JSON.parse(notifications);
				}
				if (notifications.length !== that.limit) {
					resolve(null);
				}
				resolve(notifications);
			} catch (error) {
				reject(error);
			}
		});
	}
	getNotificationTemplate(notification) {
		let notificationTemplate = "";
		let notificationClass = "wpc-notification";

		// Add the icon.
		if ("listIcon" === this.format) {
			notificationClass += " wpc-notification--icon";
			notificationTemplate += `<div class="wpc-notification__icon">
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
		  </div>`;
		}

		// Add message.
		notificationTemplate += "<div class=\"wpc-notification__message\"></div>";

		// Wrap in <li>.
		notificationTemplate = `<li class="${notificationClass}">` + notificationTemplate + "</li>";

		const templateDiv = document.createElement("div");
		templateDiv.innerHTML = notificationTemplate;

		if (notification) {
			templateDiv.querySelector(messageSelector).innerHTML = notification;
		}

		return templateDiv.innerHTML;
	}
	getNotificationsHTML(notifications, loading) {
		const templateDiv = document.createElement("div");

		let notificationsHTML = `<ul class="${listSelector}">${notifications}</ul>`;
		notificationsHTML = this.wrapTemplateArea(notificationsHTML);
		notificationsHTML = this.wrapTemplate(notificationsHTML, true);

		templateDiv.innerHTML = notificationsHTML;

		if (true === loading) {
			templateDiv
				.querySelector(notificationsSelector)
				.classList.add(loadingNotificationsClass);
		}

		return templateDiv.innerHTML;
	}
	loadNotificationsHTML(notifications, loading) {
		const that = this;
		return new Promise((resolve, reject) => {
			if (!notifications || !notifications.length) {
				reject("There are no notifications to display.");
			}

			// Build new template.
			let newMessages = "";

			// Get our limit of notifications.
			let notificationLimit;
			if (that.limit !== undefined && that.limit > 0) {
				notificationLimit = that.limit;
			} else {
				notificationLimit = notifications.length;
			}

			for (let i = 0; i < notificationLimit; i++) {
				let notification = notifications[i];

				// Get new message.
				let newMessage = notification ? notification.content.rendered : null;

				if (!newMessage) {
					continue;
				}

				// Strip parent <p>.
				const newMessageDiv = document.createElement("div");
				newMessageDiv.innerHTML = newMessage;
				newMessage = newMessageDiv.querySelector("*:first-child").innerHTML;

				// Add to the rest of the messages.
				newMessages += that.getNotificationTemplate(newMessage);

			}

			if (!newMessages) {
				return resolve(false);
			}

			// Wrap in global templates.
			// Only set loading if innerHTML is empty to begin with.
			let notificationsHTML = that.getNotificationsHTML(newMessages, loading && !that.innerHTML);

			if (!that.innerHTML) {

				// Load the notification HTML.
				that.innerHTML = notificationsHTML;

				if (true === loading) {
					setTimeout(function() {
						that
							.querySelector(notificationsSelector)
							.classList.remove(loadingNotificationsClass);
					}, 200);
				}

				return resolve(true);
			}

			// Get out of here if no message or the message is the same.
			let notificationsList = that.querySelector(`.${listSelector}`);
			if (newMessages === notificationsList.innerHTML) {
				return resolve(true);
			}

			// Get notifications wrapper.
			var notificationsDiv = that.querySelector(notificationsSelector);

			that.fadeOut(notificationsDiv).then(function () {
				that.innerHTML = notificationsHTML;
				that.fadeIn(notificationsDiv).then(function () {
					return resolve(true);
				});
			});
		});
	}
	// Will return true if notifications were loaded from local storage.
	async loadNotificationsFromLocal() {
		let notificationLocal = await this.getNotificationsLocal();
		if (notificationLocal) {
			this.loadNotificationsHTML(notificationLocal);
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

		that.requestNotification()
			.then(function (notificationResponse) {
				try {
					if (!notificationResponse) {
						throw "The notification request had no response.";
					}

					// Convert string to object.
					const notifications = JSON.parse(notificationResponse);

					that.loadNotificationsHTML(notifications, true)
						.then(function (loaded) {

							// This means the notifications were changed/updated.
							if (true === loaded) {
								that.storeNotificationsLocal(notifications);
							}
						})
						.catch(function () {
							// @TODO what to do when the request doesn't work?
						});
				} catch (error) {
					// @TODO handle error
				}
			})
			.catch(function() {
				// @TODO what to do when the request doesn't work?
			})
			.finally(function() {
				that.setUpdateTimer();
			});
	}
	async loadNotification() {
		let loadedFromLocal = await this.loadNotificationsFromLocal();
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
		this.setAttribute("aria-live", "polite");
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
