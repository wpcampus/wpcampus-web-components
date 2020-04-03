const defaultFadeInterval = 80;

// Life of content stored locally in seconds (5 minutes). Can be overwritten.
const localStorageSecondsDefault = 300;

class WPCampusHTMLElement extends HTMLElement {
	constructor(config) {
		super();
		this.connected = false;
		this.rendering = false;

		// Process our properties.
		this.processProperties(
			[
				"componentID",
				"localStorageKey",
				"localStorageKeyTime",
				"localStorageSeconds"
			],
			config
		);
	}
	processProperties(properties, values) {
		properties.forEach(property => {
			if (values[property]) {
				this[property] = values[property];
			}
		});
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
		return new Promise((resolve) => {
			var fadeEffect = setInterval(() => {
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
		return new Promise((resolve) => {
			var fadeEffect = setInterval(() => {
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
	isLocalStorageExpired() {
		var localTime = this.getLocalStorageItem(this.localStorageKeyTime);
		if (!localTime) {
			return true;
		}
		const difference = (Date.now() - localTime) / 1000;
		this.localStorageSeconds = this.checkPropertyNumber(
			this.localStorageSeconds,
			localStorageSecondsDefault,
			true
		);
		return difference >= this.localStorageSeconds;
	}
	storeLocalContent(content) {
		this.setLocalStorageItem(this.localStorageKey, JSON.stringify(content));
		this.setLocalStorageItem(this.localStorageKeyTime, Date.now());
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
	// Will return true if content was loaded from local storage.
	async loadContentFromLocal() {
		let content = await this.getLocalContent();
		if (content) {
			this.loadContentHTML(content);
			return true;
		}
		return false;
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
	getWrapperSelector() {
		return `.wpc-${this.componentID}`;
	}
	wrapTemplateArea(template) {
		const id = this.componentID;
		return `<div class="wpc-area wpc-${id}__area">` + template + "</div>";
	}
	wrapTemplate(template, includeAreas, includeGrid, includeRows) {
		const id = this.componentID;
		if (includeAreas) {
			let gridCSS = (true === includeGrid) ? " wpc-areas--grid" : "";
			if (includeRows) {
				gridCSS += " wpc-areas--grid--rows";
			}
			template = `<div class="wpc-areas${gridCSS} wpc-${id}__areas">` + template + "</div>";
		}
		return `<div class="wpc-${id} wpc-wrapper">
      <div class="wpc-container wpc-${id}__container">` + template + `</div>
    </div>`;
	}
	render() {
		const that = this;
		return new Promise((resolve, reject) => {
			if (!that.isConnected() || that.isRendering()) {
				reject();
			}
			that.classList.add("wpc-component");
			that.classList.add(`wpc-component--${that.componentID}`);
			resolve();
		});
	}
	connectedCallback() {
		this.connected = true;
	}
}

module.exports = WPCampusHTMLElement;
