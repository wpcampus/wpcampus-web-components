const WPCampusHTMLElement = require("./default");
const stylesheet = require("../assets/css/conduct.css");

const cocURL = "https://wpcampus.org/code-of-conduct/";

// wpc-area is the grid system used by WPCampus themes.
const template = `<div class="wpc-area wpc-coc__area">
    <h2 class="wpc-coc__heading">The WPCampus Code of Conduct</h2>
    <p class="wpc-coc__message">WPCampus seeks to provide a friendly, safe environment. All participants should be able to engage in productive dialogue. They should share and learn with each other in an atmosphere of mutual respect. We require all participants adhere to our Code of Conduct. This applies to all community interaction and events.</p>
    <a class="wpc-coc__button" href="${cocURL}">Our Code of Conduct</a>
</div>`;

class WPCampusCoC extends WPCampusHTMLElement {
	constructor() {
		super("coc");
		this.addStyles(stylesheet);
	}
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute("role", "complementary");
		this.setAttribute("aria-label", "Code of Conduct");
		this.innerHTML = this.wrapTemplate(template, true);
	}
}
customElements.define("wpcampus-coc", WPCampusCoC);

module.exports = WPCampusCoC;
