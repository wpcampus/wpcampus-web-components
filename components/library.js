const WPCampusHTMLElement = require("./default");
const Handlebars = require("handlebars");

// Placeholder until make http requests.
const sessions = require("./data/sessions.json");

Handlebars.registerHelper("excited", (aString) => {
	//console.log(this);
	return aString + "!!!!!!!!!";
});

const templateHTML = `{{#each .}}
    <div class="session">
      <h2><a href="{{permalink}}">{{title}}</a></h2>
      <h3>{{excited event_name}}</h3>
      {{#if content.rendered}}<div>{{{content.rendered}}}</div>{{/if}}
    </div>
  {{/each}}`;
const template = Handlebars.compile(templateHTML);

class WPCampusLibrary extends WPCampusHTMLElement {
	constructor() {
		super({ componentID: "library" });
	}
	getSessions() {
		return sessions;
	}
	connectedCallback() {
		super.connectedCallback();
		this.innerHTML = template(this.getSessions());
	}
}
customElements.define("wpcampus-library", WPCampusLibrary);

module.exports = WPCampusLibrary;
