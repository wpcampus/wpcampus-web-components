const WPCampusHTMLElement = require("./default");

// wpc-area is the grid system used by WPCampus themes.
const template = `<div class="wpc-area wpc-footer__area wpc-footer__area--logo">Logo</div>
  <div class="wpc-area wpc-footer__area wpc-footer__area--nav">Org nav</div>
  <div class="wpc-area wpc-footer__area wpc-footer__area--desc">Description</div>
  <div class="wpc-area wpc-footer__area wpc-footer__area--social">Social</div>
  <div class="wpc-area wpc-footer__area wpc-footer__area--copyright">Copyright</div>`;

class WPCampusFooter extends WPCampusHTMLElement {
  constructor() {
    super("footer");
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "contentinfo");
    this.innerHTML = this.wrapTemplate(template, true, true);
  }
}
customElements.define("wpcampus-footer", WPCampusFooter);

module.exports = WPCampusFooter;
