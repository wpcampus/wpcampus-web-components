const WPCampusHTMLElement = require("./default");

// Default number of content we're retrieving from request.
const limitDefault = 1;

// How often to check for updates in seconds (5 minutes). Can be overwritten.
const requestUpdateSecondsDefault = 300;

class WPCampusRequestElement extends WPCampusHTMLElement {
	constructor(config) {
		super(config);

		// How many requests to make to update content. Can be overwritten.
		this.requestUpdateMaxDefault = 2;

		// Process our properties.
		this.processProperties(
			[
				"requestURL"
			],
			config
		);

		if (this.dataset.limit !== undefined) {
			this.limit = parseInt(this.dataset.limit);
		}
		if (!this.limit || !(this.limit === -1 || this.limit > 0)) {
			this.limit = limitDefault;
		}

		// Keeps track of how many times the update request has been made.
		this.requestUpdateCount = 0;

	}
	setUpdateTimer() {
		const that = this;
		this.requestUpdateSeconds = this.checkPropertyNumber(
			this.requestUpdateSeconds,
			requestUpdateSecondsDefault,
			true
		);
		setTimeout(() => {
			that.loadContentFromRequest();
		}, this.requestUpdateSeconds * 1000);
	}
	pauseTimer() {
		const that = this;
		that.resetTimerFunction = that.resetTimer.bind(that);
		document.addEventListener("mousemove", that.resetTimerFunction);
		document.addEventListener("keydown", that.resetTimerFunction);
	}
	resetTimer() {
		const that = this;
		that.requestUpdateCount = 0;
		document.removeEventListener("mousemove", that.resetTimerFunction);
		document.removeEventListener("keydown", that.resetTimerFunction);
		that.loadContentFromRequest();
	}
	getRequestURL() {
		if (!this.requestURL) {
			return "";
		}
		let url = this.requestURL;
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
	requestContent() {
		const url = this.getRequestURL();
		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("GET", url);
			request.onload = () => resolve(request.responseText);
			request.onerror = () => reject(request);
			request.send();
		});
	}
	getLocalContent() {
		const that = this;
		return new Promise((resolve, reject) => {
			try {
				if (that.isLocalStorageExpired()) {
					resolve(null);
				}
				let response = that.getLocalStorageItem(that.localStorageKey);
				if (response) {
					response = JSON.parse(response);
				}
				if (response.length !== that.limit) {
					resolve(null);
				}
				resolve(response);
			} catch (error) {
				reject(error);
			}
		});
	}
	storeLocalContent(content) {
		this.setLocalStorageItem(this.localStorageKey, JSON.stringify(content));
		this.setLocalStorageItem(this.localStorageKeyTime, Date.now());
	}
	// Will return true if content was loaded from local storage.
	async loadContentFromLocal() {
		let content = await this.getLocalContent();
		if (content) {
			this.loadContentHTML(content);
			return true;
		}
		return false;
	}
	async loadContent() {
		let loadedFromLocal = await this.loadContentFromLocal();
		if (!loadedFromLocal) {
			await this.loadContentFromRequest();
		}
		this.setUpdateTimer();
	}
	connectedCallback() {
		super.connectedCallback();
	}
}

module.exports = WPCampusRequestElement;
