import WPCampusHTMLElement from "./default";
import sessions from "./sessions.json";
import Handlebars from "handlebars";

Handlebars.registerHelper("excited", function(aString) {
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
    super("library");
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

export default WPCampusLibrary;
